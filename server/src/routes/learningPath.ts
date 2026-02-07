import express, { Request, Response } from 'express'
import { pool } from '../config/database'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

interface AuthRequest extends Request {
  user?: { userId: number; role: string }
}

/**
 * 获取所有学习地图
 * GET /api/learning-path/maps?subject=math
 */
router.get('/maps', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { subject } = req.query
    const userId = req.user?.userId

    let query = `
      SELECT
        lm.*,
        COALESCE(ulp.current_stage, 0) as user_current_stage,
        COALESCE(ulp.total_stars_earned, 0) as user_stars,
        COALESCE(ulp.completion_rate, 0) as user_completion_rate
      FROM learning_maps lm
      LEFT JOIN user_learning_progress ulp ON lm.id = ulp.map_id AND ulp.user_id = $1
      WHERE lm.is_active = true
    `
    const params: any[] = [userId]

    if (subject) {
      query += ' AND lm.subject = $2'
      params.push(subject)
    }

    query += ' ORDER BY lm.id'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取学习地图失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 获取地图的所有关卡
 * GET /api/learning-path/maps/:mapId/stages
 */
router.get('/maps/:mapId/stages', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { mapId } = req.params
    const userId = req.user?.userId

    // 获取用户进度
    const progressResult = await pool.query(
      'SELECT current_stage FROM user_learning_progress WHERE user_id = $1 AND map_id = $2',
      [userId, mapId]
    )
    const currentStage = progressResult.rows[0]?.current_stage || 0

    // 获取所有关卡
    const stagesResult = await pool.query(`
      SELECT
        ls.*,
        sc.score as user_best_score,
        sc.stars_earned as user_stars,
        sc.is_perfect as user_perfect
      FROM learning_stages ls
      LEFT JOIN (
        SELECT stage_id, MAX(score) as score, MAX(stars_earned) as stars_earned,
               BOOL_OR(is_perfect) as is_perfect
        FROM stage_completions
        WHERE user_id = $1
        GROUP BY stage_id
      ) sc ON ls.id = sc.stage_id
      WHERE ls.map_id = $2
      ORDER BY ls.stage_number
    `, [userId, mapId])

    // 判断每个关卡的解锁状态
    const stages = stagesResult.rows.map(stage => {
      let isUnlocked = false
      const condition = stage.unlock_condition

      if (condition.type === 'always') {
        isUnlocked = true
      } else if (condition.type === 'previous_stage') {
        isUnlocked = currentStage >= condition.stage
      }

      return {
        ...stage,
        is_unlocked: isUnlocked,
        is_completed: !!stage.user_best_score,
        is_current: stage.stage_number === currentStage + 1
      }
    })

    res.json({
      success: true,
      data: {
        stages,
        currentStage
      }
    })
  } catch (error) {
    console.error('获取关卡列表失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 开始关卡
 * POST /api/learning-path/stages/:stageId/start
 */
router.post('/stages/:stageId/start', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { stageId } = req.params
    const userId = req.user?.userId

    // 获取关卡信息
    const stageResult = await pool.query(
      'SELECT * FROM learning_stages WHERE id = $1',
      [stageId]
    )

    if (stageResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '关卡不存在' })
    }

    const stage = stageResult.rows[0]

    // 检查是否解锁
    // TODO: 实现解锁逻辑检查

    // 初始化用户进度（如果不存在）
    await pool.query(
      `INSERT INTO user_learning_progress (user_id, map_id, current_stage)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, map_id) DO NOTHING`,
      [userId, stage.map_id]
    )

    res.json({
      success: true,
      message: '关卡开始',
      data: {
        stage_id: stage.id,
        stage_name: stage.stage_name,
        content_data: stage.content_data,
        time_limit: stage.time_limit
      }
    })
  } catch (error) {
    console.error('开始关卡失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 完成关卡
 * POST /api/learning-path/stages/:stageId/complete
 */
router.post('/stages/:stageId/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { stageId } = req.params
    const userId = req.user?.userId
    const { score, timeSpent, answersData } = req.body

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // 获取关卡信息
      const stageResult = await client.query(
        'SELECT * FROM learning_stages WHERE id = $1',
        [stageId]
      )
      const stage = stageResult.rows[0]

      // 计算星星数
      let starsEarned = 0
      const isPerfect = score >= (stage.perfect_score || 100)

      if (score >= stage.pass_score) starsEarned = 1
      if (score >= 80) starsEarned = 2
      if (isPerfect) starsEarned = 3

      // 保存通关记录
      await client.query(
        `INSERT INTO stage_completions
         (user_id, stage_id, score, stars_earned, time_spent, is_perfect)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, stageId, score, starsEarned, timeSpent, isPerfect]
      )

      // 更新用户进度
      await client.query(
        `UPDATE user_learning_progress
         SET current_stage = GREATEST(current_stage, $1),
             total_stars_earned = total_stars_earned + $2,
             updated_at = NOW()
         WHERE user_id = $3 AND map_id = $4`,
        [stage.stage_number, starsEarned, userId, stage.map_id]
      )

      // 获取奖励
      const rewards = stage.rewards || {}

      // 添加积分
      if (rewards.points) {
        await client.query(
          'UPDATE users SET total_points = total_points + $1 WHERE id = $2',
          [rewards.points, userId]
        )
      }

      // 检查勋章解锁
      // TODO: 实现勋章检查逻辑

      await client.query('COMMIT')

      res.json({
        success: true,
        message: '恭喜通关！',
        data: {
          score,
          stars_earned: starsEarned,
          is_perfect: isPerfect,
          rewards
        }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('完成关卡失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 获取用户勋章
 * GET /api/learning-path/badges
 */
router.get('/badges', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    const result = await pool.query(`
      SELECT
        b.*,
        ub.earned_at,
        CASE WHEN ub.id IS NOT NULL THEN true ELSE false END as is_earned
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
      ORDER BY b.rarity DESC, b.id
    `, [userId])

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取勋章失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 获取学习统计
 * GET /api/learning-path/stats
 */
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    // 总关卡完成数
    const completedResult = await pool.query(
      'SELECT COUNT(DISTINCT stage_id) as count FROM stage_completions WHERE user_id = $1',
      [userId]
    )

    // 总星星数
    const starsResult = await pool.query(
      'SELECT SUM(stars_earned) as total FROM stage_completions WHERE user_id = $1',
      [userId]
    )

    // 完美通关数
    const perfectResult = await pool.query(
      'SELECT COUNT(*) as count FROM stage_completions WHERE user_id = $1 AND is_perfect = true',
      [userId]
    )

    // 勋章数
    const badgesResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_badges WHERE user_id = $1',
      [userId]
    )

    res.json({
      success: true,
      data: {
        total_completed: parseInt(completedResult.rows[0].count),
        total_stars: parseInt(starsResult.rows[0].total || 0),
        perfect_count: parseInt(perfectResult.rows[0].count),
        badges_count: parseInt(badgesResult.rows[0].count)
      }
    })
  } catch (error) {
    console.error('获取统计失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

export default router
