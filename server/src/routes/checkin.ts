import { Router } from 'express'
import { pool } from '../config/database'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// ============ 每日签到 API ============

// 1. 今日签到
router.post('/checkin', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { mood, notes } = req.body
    const today = new Date().toISOString().split('T')[0]

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // 检查今天是否已签到
      const existingCheckin = await client.query(
        'SELECT * FROM daily_checkins WHERE user_id = $1 AND checkin_date = $2',
        [userId, today]
      )

      if (existingCheckin.rows.length > 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, message: '今日已签到' })
      }

      // 获取用户签到统计
      let statsResult = await client.query(
        'SELECT * FROM user_checkin_stats WHERE user_id = $1',
        [userId]
      )

      let stats = statsResult.rows[0]
      let consecutiveDays = 1
      let totalCheckins = 1

      if (stats) {
        const lastCheckin = new Date(stats.last_checkin_date)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        lastCheckin.setHours(0, 0, 0, 0)

        // 判断是否连续
        if (lastCheckin.getTime() === yesterday.getTime()) {
          consecutiveDays = stats.consecutive_days + 1
        } else {
          consecutiveDays = 1
        }

        totalCheckins = stats.total_checkins + 1
      }

      // 计算奖励积分
      const rewardResult = await client.query(
        'SELECT * FROM checkin_rewards WHERE consecutive_days = $1 AND is_active = true',
        [consecutiveDays]
      )

      const rewardPoints = rewardResult.rows.length > 0 ? rewardResult.rows[0].reward_value : 10

      // 插入签到记录
      const checkinResult = await client.query(
        `INSERT INTO daily_checkins
         (user_id, checkin_date, consecutive_days, total_checkins, reward_points, mood, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, today, consecutiveDays, totalCheckins, rewardPoints, mood, notes]
      )

      // 更新用户签到统计
      await client.query(
        `INSERT INTO user_checkin_stats
         (user_id, total_checkins, consecutive_days, max_consecutive_days, last_checkin_date)
         VALUES ($1, $2, $3, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET
           total_checkins = $2,
           consecutive_days = $3,
           max_consecutive_days = GREATEST(user_checkin_stats.max_consecutive_days, $3),
           last_checkin_date = $4,
           updated_at = NOW()`,
        [userId, totalCheckins, consecutiveDays, today]
      )

      // 更新用户积分
      await client.query(
        'UPDATE users SET points = points + $1 WHERE id = $2',
        [rewardPoints, userId]
      )

      // 检查并解锁成就
      await checkAndUnlockAchievements(client, userId, consecutiveDays, totalCheckins)

      await client.query('COMMIT')

      res.json({
        success: true,
        message: '签到成功！',
        data: {
          checkin: checkinResult.rows[0],
          consecutiveDays,
          rewardPoints,
          totalCheckins
        }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('签到失败:', error)
    res.status(500).json({ success: false, message: '签到失败' })
  }
})

// 2. 获取签到统计
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId

    const statsResult = await pool.query(
      'SELECT * FROM user_checkin_stats WHERE user_id = $1',
      [userId]
    )

    if (statsResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          totalCheckins: 0,
          consecutiveDays: 0,
          maxConsecutiveDays: 0,
          lastCheckinDate: null
        }
      })
    }

    res.json({
      success: true,
      data: statsResult.rows[0]
    })
  } catch (error) {
    console.error('获取统计失败:', error)
    res.status(500).json({ success: false, message: '获取统计失败' })
  }
})

// 3. 获取签到历史（日历数据）
router.get('/history', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { year, month } = req.query

    let query = 'SELECT * FROM daily_checkins WHERE user_id = $1'
    const params: any[] = [userId]

    if (year && month) {
      query += ` AND EXTRACT(YEAR FROM checkin_date) = $2 AND EXTRACT(MONTH FROM checkin_date) = $3`
      params.push(year, month)
    }

    query += ' ORDER BY checkin_date DESC LIMIT 365'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取签到历史失败:', error)
    res.status(500).json({ success: false, message: '获取签到历史失败' })
  }
})

// 4. 获取今日签到状态
router.get('/today', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const today = new Date().toISOString().split('T')[0]

    const result = await pool.query(
      'SELECT * FROM daily_checkins WHERE user_id = $1 AND checkin_date = $2',
      [userId, today]
    )

    res.json({
      success: true,
      data: {
        hasCheckedIn: result.rows.length > 0,
        checkin: result.rows[0] || null
      }
    })
  } catch (error) {
    console.error('获取今日签到状态失败:', error)
    res.status(500).json({ success: false, message: '获取今日签到状态失败' })
  }
})

// ============ 习惯养成 API ============

// 5. 创建习惯
router.post('/habits', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { habitName, habitType, description, icon, color, targetFrequency, targetCount, reminderTime } = req.body

    const result = await pool.query(
      `INSERT INTO habits
       (user_id, habit_name, habit_type, description, icon, color, target_frequency, target_count, reminder_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, habitName, habitType, description, icon, color, targetFrequency, targetCount, reminderTime]
    )

    // 初始化习惯统计
    await pool.query(
      'INSERT INTO habit_stats (habit_id, user_id) VALUES ($1, $2)',
      [result.rows[0].id, userId]
    )

    res.json({
      success: true,
      message: '习惯创建成功',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('创建习惯失败:', error)
    res.status(500).json({ success: false, message: '创建习惯失败' })
  }
})

// 6. 获取我的习惯列表
router.get('/habits', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT h.*, hs.total_checkins, hs.consecutive_days, hs.completion_rate, hs.last_checkin_date
       FROM habits h
       LEFT JOIN habit_stats hs ON h.id = hs.habit_id
       WHERE h.user_id = $1 AND h.is_active = true
       ORDER BY h.created_at DESC`,
      [userId]
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取习惯列表失败:', error)
    res.status(500).json({ success: false, message: '获取习惯列表失败' })
  }
})

// 7. 习惯打卡
router.post('/habits/:habitId/checkin', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { habitId } = req.params
    const { completionValue = 1, notes, mood } = req.body
    const today = new Date().toISOString().split('T')[0]

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // 检查习惯是否存在
      const habitResult = await client.query(
        'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
        [habitId, userId]
      )

      if (habitResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ success: false, message: '习惯不存在' })
      }

      // 检查今天是否已打卡
      const existingCheckin = await client.query(
        'SELECT * FROM habit_checkins WHERE habit_id = $1 AND checkin_date = $2',
        [habitId, today]
      )

      if (existingCheckin.rows.length > 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, message: '今日已打卡' })
      }

      // 插入打卡记录
      await client.query(
        `INSERT INTO habit_checkins (habit_id, user_id, checkin_date, completion_value, notes, mood)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [habitId, userId, today, completionValue, notes, mood]
      )

      // 更新习惯统计
      const statsResult = await client.query(
        'SELECT * FROM habit_stats WHERE habit_id = $1',
        [habitId]
      )

      const stats = statsResult.rows[0]
      let consecutiveDays = 1

      if (stats && stats.last_checkin_date) {
        const lastCheckin = new Date(stats.last_checkin_date)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        lastCheckin.setHours(0, 0, 0, 0)

        if (lastCheckin.getTime() === yesterday.getTime()) {
          consecutiveDays = stats.consecutive_days + 1
        }
      }

      await client.query(
        `UPDATE habit_stats SET
           total_checkins = total_checkins + 1,
           consecutive_days = $1,
           max_consecutive_days = GREATEST(max_consecutive_days, $1),
           last_checkin_date = $2,
           updated_at = NOW()
         WHERE habit_id = $3`,
        [consecutiveDays, today, habitId]
      )

      await client.query('COMMIT')

      res.json({
        success: true,
        message: '打卡成功！',
        data: { consecutiveDays }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('习惯打卡失败:', error)
    res.status(500).json({ success: false, message: '习惯打卡失败' })
  }
})

// 8. 获取习惯打卡历史
router.get('/habits/:habitId/history', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { habitId } = req.params
    const { limit = 30 } = req.query

    const result = await pool.query(
      `SELECT * FROM habit_checkins
       WHERE habit_id = $1 AND user_id = $2
       ORDER BY checkin_date DESC
       LIMIT $3`,
      [habitId, userId, limit]
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取习惯历史失败:', error)
    res.status(500).json({ success: false, message: '获取习惯历史失败' })
  }
})

// 9. 删除习惯
router.delete('/habits/:habitId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { habitId } = req.params

    await pool.query(
      'UPDATE habits SET is_active = false WHERE id = $1 AND user_id = $2',
      [habitId, userId]
    )

    res.json({
      success: true,
      message: '习惯已删除'
    })
  } catch (error) {
    console.error('删除习惯失败:', error)
    res.status(500).json({ success: false, message: '删除习惯失败' })
  }
})

// ============ 成就系统 API ============

// 10. 获取所有成就
router.get('/achievements', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT
         ca.*,
         uca.earned_at,
         uca.is_claimed,
         CASE WHEN uca.id IS NOT NULL THEN true ELSE false END as is_earned
       FROM checkin_achievements ca
       LEFT JOIN user_checkin_achievements uca ON ca.id = uca.achievement_id AND uca.user_id = $1
       WHERE ca.is_active = true
       ORDER BY ca.rarity DESC, ca.id`,
      [userId]
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取成就失败:', error)
    res.status(500).json({ success: false, message: '获取成就失败' })
  }
})

// 11. 领取成就奖励
router.post('/achievements/:achievementId/claim', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { achievementId } = req.params

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // 检查是否已获得该成就
      const userAchievement = await client.query(
        'SELECT * FROM user_checkin_achievements WHERE user_id = $1 AND achievement_id = $2',
        [userId, achievementId]
      )

      if (userAchievement.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ success: false, message: '未获得该成就' })
      }

      if (userAchievement.rows[0].is_claimed) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, message: '奖励已领取' })
      }

      // 获取成就信息
      const achievement = await client.query(
        'SELECT * FROM checkin_achievements WHERE id = $1',
        [achievementId]
      )

      const rewardPoints = achievement.rows[0].reward_points

      // 标记为已领取
      await client.query(
        'UPDATE user_checkin_achievements SET is_claimed = true WHERE user_id = $1 AND achievement_id = $2',
        [userId, achievementId]
      )

      // 发放积分
      await client.query(
        'UPDATE users SET points = points + $1 WHERE id = $2',
        [rewardPoints, userId]
      )

      await client.query('COMMIT')

      res.json({
        success: true,
        message: '奖励领取成功',
        data: { rewardPoints }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('领取成就奖励失败:', error)
    res.status(500).json({ success: false, message: '领取成就奖励失败' })
  }
})

// 辅助函数：检查并解锁成就
async function checkAndUnlockAchievements(client: any, userId: string, consecutiveDays: number, totalCheckins: number) {
  // 查询所有签到相关成就
  const achievements = await client.query(
    'SELECT * FROM checkin_achievements WHERE achievement_type = \'checkin\' AND is_active = true'
  )

  for (const achievement of achievements.rows) {
    // 检查是否已解锁
    const existing = await client.query(
      'SELECT * FROM user_checkin_achievements WHERE user_id = $1 AND achievement_id = $2',
      [userId, achievement.id]
    )

    if (existing.rows.length > 0) continue

    // 检查是否达成条件
    let unlocked = false

    if (achievement.condition_type === 'consecutive_days') {
      unlocked = consecutiveDays >= achievement.condition_value
    } else if (achievement.condition_type === 'total_days') {
      unlocked = totalCheckins >= achievement.condition_value
    }

    if (unlocked) {
      await client.query(
        'INSERT INTO user_checkin_achievements (user_id, achievement_id) VALUES ($1, $2)',
        [userId, achievement.id]
      )
    }
  }
}

export default router
