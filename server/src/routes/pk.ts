import { Router } from 'express'
import { Pool } from 'pg'
import { pool } from '../config/database'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// 生成随机房间码
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 计算段位分变化
function calculateRankChange(
  winner: boolean,
  myRank: number,
  opponentRank: number,
  winStreak: number
): number {
  let basePoints = 20

  // 连胜加成
  if (winner && winStreak >= 3) {
    basePoints += Math.min(winStreak - 2, 10) * 2
  }

  // 段位差异调整
  const rankDiff = opponentRank - myRank
  if (rankDiff > 0) {
    basePoints += Math.min(rankDiff, 10)
  } else {
    basePoints -= Math.min(Math.abs(rankDiff), 5)
  }

  return winner ? basePoints : -Math.max(basePoints / 2, 10)
}

// 1. 创建房间
router.post('/rooms/create', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { gameType, subject, difficulty, questionCount = 10, timeLimit = 300, isPrivate = false } = req.body

    const roomCode = generateRoomCode()

    const roomResult = await pool.query(`
      INSERT INTO pk_rooms (
        room_code, game_type, subject, difficulty,
        question_count, time_limit, created_by, is_private
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [roomCode, gameType, subject, difficulty, questionCount, timeLimit, userId, isPrivate])

    const room = roomResult.rows[0]

    // 创建者自动加入房间（槽位1）
    await pool.query(`
      INSERT INTO pk_participants (room_id, user_id, player_slot)
      VALUES ($1, $2, 1)
    `, [room.id, userId])

    res.json({
      success: true,
      data: room,
      message: '房间创建成功'
    })
  } catch (error) {
    console.error('创建房间失败:', error)
    res.status(500).json({ success: false, message: '创建房间失败' })
  }
})

// 2. 加入房间
router.post('/rooms/join', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { roomCode } = req.body

    // 查找房间
    const roomResult = await pool.query(`
      SELECT * FROM pk_rooms
      WHERE room_code = $1 AND room_status = 'waiting'
    `, [roomCode])

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '房间不存在或已开始' })
    }

    const room = roomResult.rows[0]

    // 检查房间是否已满
    const participantsResult = await pool.query(`
      SELECT COUNT(*) as count FROM pk_participants
      WHERE room_id = $1
    `, [room.id])

    const participantCount = parseInt(participantsResult.rows[0].count)
    if (participantCount >= 2) {
      return res.status(400).json({ success: false, message: '房间已满' })
    }

    // 加入房间（槽位2）
    await pool.query(`
      INSERT INTO pk_participants (room_id, user_id, player_slot)
      VALUES ($1, $2, 2)
    `, [room.id, userId])

    res.json({
      success: true,
      data: room,
      message: '加入房间成功'
    })
  } catch (error) {
    console.error('加入房间失败:', error)
    res.status(500).json({ success: false, message: '加入房间失败' })
  }
})

// 3. 获取房间列表
router.get('/rooms/list', authenticateToken, async (req: any, res) => {
  try {
    const { gameType, subject, difficulty } = req.query

    let query = `
      SELECT r.*, COUNT(p.id) as current_players,
             u.nickname as creator_name
      FROM pk_rooms r
      LEFT JOIN pk_participants p ON r.id = p.room_id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.room_status = 'waiting' AND r.is_private = false
    `
    const params: any[] = []

    if (gameType) {
      params.push(gameType)
      query += ` AND r.game_type = $${params.length}`
    }
    if (subject) {
      params.push(subject)
      query += ` AND r.subject = $${params.length}`
    }
    if (difficulty) {
      params.push(difficulty)
      query += ` AND r.difficulty = $${params.length}`
    }

    query += ` GROUP BY r.id, u.nickname HAVING COUNT(p.id) < 2 ORDER BY r.created_at DESC LIMIT 20`

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取房间列表失败:', error)
    res.status(500).json({ success: false, message: '获取房间列表失败' })
  }
})

// 4. 玩家准备
router.post('/rooms/:roomId/ready', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { roomId } = req.params

    // 标记玩家准备
    await pool.query(`
      UPDATE pk_participants
      SET is_ready = true
      WHERE room_id = $1 AND user_id = $2
    `, [roomId, userId])

    // 检查是否都准备好
    const readyResult = await pool.query(`
      SELECT COUNT(*) as ready_count
      FROM pk_participants
      WHERE room_id = $1 AND is_ready = true
    `, [roomId])

    const readyCount = parseInt(readyResult.rows[0].ready_count)

    // 如果两个玩家都准备好，开始游戏
    if (readyCount === 2) {
      await pool.query(`
        UPDATE pk_rooms
        SET room_status = 'playing', started_at = NOW()
        WHERE id = $1
      `, [roomId])

      // 生成题目（这里简化处理，实际应该从题库中随机选择）
      const roomResult = await pool.query('SELECT * FROM pk_rooms WHERE id = $1', [roomId])
      const room = roomResult.rows[0]

      // TODO: 从题库中选择题目
      // 这里暂时返回准备完成状态

      res.json({
        success: true,
        data: { status: 'playing' },
        message: '游戏开始！'
      })
    } else {
      res.json({
        success: true,
        data: { status: 'waiting' },
        message: '等待对手准备'
      })
    }
  } catch (error) {
    console.error('准备失败:', error)
    res.status(500).json({ success: false, message: '准备失败' })
  }
})

// 5. 提交答案
router.post('/rooms/:roomId/answer', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { roomId } = req.params
    const { questionNumber, userAnswer, timeSpent } = req.body

    // 获取正确答案
    const questionResult = await pool.query(`
      SELECT correct_answer FROM pk_questions
      WHERE room_id = $1 AND question_number = $2
    `, [roomId, questionNumber])

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '题目不存在' })
    }

    const correctAnswer = questionResult.rows[0].correct_answer
    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()

    // 保存答题记录
    await pool.query(`
      INSERT INTO pk_answers (room_id, user_id, question_number, user_answer, is_correct, time_spent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [roomId, userId, questionNumber, userAnswer, isCorrect, timeSpent])

    // 更新参与者统计
    if (isCorrect) {
      await pool.query(`
        UPDATE pk_participants
        SET score = score + 10,
            correct_count = correct_count + 1,
            total_time = total_time + $3
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId, timeSpent])
    } else {
      await pool.query(`
        UPDATE pk_participants
        SET total_time = total_time + $3
        WHERE room_id = $1 AND user_id = $2
      `, [roomId, userId, timeSpent])
    }

    res.json({
      success: true,
      data: { isCorrect, correctAnswer },
      message: isCorrect ? '回答正确！' : '回答错误'
    })
  } catch (error) {
    console.error('提交答案失败:', error)
    res.status(500).json({ success: false, message: '提交答案失败' })
  }
})

// 6. 获取对战结果
router.get('/rooms/:roomId/result', authenticateToken, async (req: any, res) => {
  try {
    const { roomId } = req.params

    // 获取参与者成绩
    const participantsResult = await pool.query(`
      SELECT p.*, u.nickname, u.avatar
      FROM pk_participants p
      JOIN users u ON p.user_id = u.id
      WHERE p.room_id = $1
      ORDER BY p.score DESC, p.total_time ASC
    `, [roomId])

    const participants = participantsResult.rows

    if (participants.length < 2) {
      return res.status(400).json({ success: false, message: '对战尚未完成' })
    }

    // 判断胜负
    const winner = participants[0]
    const loser = participants[1]

    // 获取段位信息
    const roomResult = await pool.query('SELECT game_type FROM pk_rooms WHERE id = $1', [roomId])
    const gameType = roomResult.rows[0].game_type

    const winnerRankResult = await pool.query(
      'SELECT * FROM pk_ranks WHERE user_id = $1 AND game_type = $2',
      [winner.user_id, gameType]
    )
    const loserRankResult = await pool.query(
      'SELECT * FROM pk_ranks WHERE user_id = $1 AND game_type = $2',
      [loser.user_id, gameType]
    )

    // 计算段位分变化
    const winnerRank = winnerRankResult.rows[0] || { rank_points: 0, win_streak: 0 }
    const loserRank = loserRankResult.rows[0] || { rank_points: 0, win_streak: 0 }

    const winnerRankChange = calculateRankChange(true, winnerRank.rank_points, loserRank.rank_points, winnerRank.win_streak)
    const loserRankChange = calculateRankChange(false, loserRank.rank_points, winnerRank.rank_points, 0)

    // 更新参与者结果
    await pool.query(`
      UPDATE pk_participants
      SET is_winner = true, rank_change = $2
      WHERE room_id = $1 AND user_id = $3
    `, [roomId, winnerRankChange, winner.user_id])

    await pool.query(`
      UPDATE pk_participants
      SET is_winner = false, rank_change = $2
      WHERE room_id = $1 AND user_id = $3
    `, [roomId, loserRankChange, loser.user_id])

    // 更新房间状态
    await pool.query(`
      UPDATE pk_rooms
      SET room_status = 'finished', finished_at = NOW()
      WHERE id = $1
    `, [roomId])

    // 更新段位数据
    // 胜者
    if (winnerRankResult.rows.length === 0) {
      await pool.query(`
        INSERT INTO pk_ranks (user_id, game_type, rank_points, total_wins, win_streak, max_win_streak)
        VALUES ($1, $2, $3, 1, 1, 1)
      `, [winner.user_id, gameType, Math.max(winnerRankChange, 0)])
    } else {
      const newWinStreak = winnerRank.win_streak + 1
      await pool.query(`
        UPDATE pk_ranks
        SET rank_points = rank_points + $3,
            total_wins = total_wins + 1,
            win_streak = $4,
            max_win_streak = GREATEST(max_win_streak, $4),
            updated_at = NOW()
        WHERE user_id = $1 AND game_type = $2
      `, [winner.user_id, gameType, winnerRankChange, newWinStreak])
    }

    // 败者
    if (loserRankResult.rows.length === 0) {
      await pool.query(`
        INSERT INTO pk_ranks (user_id, game_type, rank_points, total_losses, win_streak)
        VALUES ($1, $2, 0, 1, 0)
      `, [loser.user_id, gameType])
    } else {
      await pool.query(`
        UPDATE pk_ranks
        SET rank_points = GREATEST(rank_points + $3, 0),
            total_losses = total_losses + 1,
            win_streak = 0,
            updated_at = NOW()
        WHERE user_id = $1 AND game_type = $2
      `, [loser.user_id, gameType, loserRankChange])
    }

    res.json({
      success: true,
      data: {
        winner: { ...winner, rankChange: winnerRankChange },
        loser: { ...loser, rankChange: loserRankChange },
        participants
      }
    })
  } catch (error) {
    console.error('获取对战结果失败:', error)
    res.status(500).json({ success: false, message: '获取对战结果失败' })
  }
})

// 7. 获取段位信息
router.get('/ranks/:gameType', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { gameType } = req.params

    const result = await pool.query(`
      SELECT * FROM pk_ranks
      WHERE user_id = $1 AND game_type = $2
    `, [userId, gameType])

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          rank_level: 'bronze',
          rank_stars: 0,
          rank_points: 0,
          total_wins: 0,
          total_losses: 0,
          win_streak: 0,
          max_win_streak: 0
        }
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('获取段位信息失败:', error)
    res.status(500).json({ success: false, message: '获取段位信息失败' })
  }
})

// 8. 排行榜
router.get('/leaderboard/:gameType', authenticateToken, async (req: any, res) => {
  try {
    const { gameType } = req.params
    const { limit = 50 } = req.query

    const result = await pool.query(`
      SELECT r.*, u.nickname, u.avatar
      FROM pk_ranks r
      JOIN users u ON r.user_id = u.id
      WHERE r.game_type = $1
      ORDER BY r.rank_points DESC, r.total_wins DESC
      LIMIT $2
    `, [gameType, limit])

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取排行榜失败:', error)
    res.status(500).json({ success: false, message: '获取排行榜失败' })
  }
})

// 9. 发送好友请求
router.post('/friends/add', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { friendId } = req.body

    if (userId === friendId) {
      return res.status(400).json({ success: false, message: '不能添加自己为好友' })
    }

    // 检查是否已经是好友或已发送请求
    const existingResult = await pool.query(`
      SELECT * FROM friendships
      WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
    `, [userId, friendId])

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: '已发送过好友请求或已是好友' })
    }

    await pool.query(`
      INSERT INTO friendships (user_id, friend_id, status)
      VALUES ($1, $2, 'pending')
    `, [userId, friendId])

    res.json({
      success: true,
      message: '好友请求已发送'
    })
  } catch (error) {
    console.error('发送好友请求失败:', error)
    res.status(500).json({ success: false, message: '发送好友请求失败' })
  }
})

// 10. 获取好友列表
router.get('/friends/list', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(`
      SELECT f.*, u.nickname, u.avatar
      FROM friendships f
      JOIN users u ON (
        CASE
          WHEN f.user_id = $1 THEN u.id = f.friend_id
          ELSE u.id = f.user_id
        END
      )
      WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
      ORDER BY f.responded_at DESC
    `, [userId])

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取好友列表失败:', error)
    res.status(500).json({ success: false, message: '获取好友列表失败' })
  }
})

// 11. 处理好友请求
router.post('/friends/:friendshipId/respond', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { friendshipId } = req.params
    const { status } = req.body // 'accepted' or 'rejected'

    await pool.query(`
      UPDATE friendships
      SET status = $1, responded_at = NOW()
      WHERE id = $2 AND friend_id = $3
    `, [status, friendshipId, userId])

    res.json({
      success: true,
      message: status === 'accepted' ? '已接受好友请求' : '已拒绝好友请求'
    })
  } catch (error) {
    console.error('处理好友请求失败:', error)
    res.status(500).json({ success: false, message: '处理好友请求失败' })
  }
})

// 12. 邀请好友对战
router.post('/invitations/send', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const { roomId, friendId } = req.body

    // 创建邀请（5分钟过期）
    await pool.query(`
      INSERT INTO pk_invitations (room_id, inviter_id, invitee_id, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')
    `, [roomId, userId, friendId])

    res.json({
      success: true,
      message: '邀请已发送'
    })
  } catch (error) {
    console.error('发送邀请失败:', error)
    res.status(500).json({ success: false, message: '发送邀请失败' })
  }
})

// 13. 获取邀请列表
router.get('/invitations/list', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(`
      SELECT i.*, u.nickname as inviter_name, r.game_type, r.subject, r.difficulty
      FROM pk_invitations i
      JOIN users u ON i.inviter_id = u.id
      JOIN pk_rooms r ON i.room_id = r.id
      WHERE i.invitee_id = $1 AND i.status = 'pending' AND i.expires_at > NOW()
      ORDER BY i.created_at DESC
    `, [userId])

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取邀请列表失败:', error)
    res.status(500).json({ success: false, message: '获取邀请列表失败' })
  }
})

// 14. 获取房间详情（包含参与者信息）
router.get('/rooms/:roomId', authenticateToken, async (req: any, res) => {
  try {
    const { roomId } = req.params

    // 获取房间信息
    const roomResult = await pool.query('SELECT * FROM pk_rooms WHERE id = $1', [roomId])
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '房间不存在' })
    }

    // 获取参与者信息
    const participantsResult = await pool.query(`
      SELECT p.*, u.nickname, u.avatar
      FROM pk_participants p
      JOIN users u ON p.user_id = u.id
      WHERE p.room_id = $1
      ORDER BY p.player_slot
    `, [roomId])

    res.json({
      success: true,
      data: {
        room: roomResult.rows[0],
        participants: participantsResult.rows
      }
    })
  } catch (error) {
    console.error('获取房间详情失败:', error)
    res.status(500).json({ success: false, message: '获取房间详情失败' })
  }
})

// 15. 获取房间题目列表
router.get('/rooms/:roomId/questions', authenticateToken, async (req: any, res) => {
  try {
    const { roomId } = req.params

    // 检查是否已生成题目
    const existingQuestions = await pool.query(`
      SELECT * FROM pk_questions
      WHERE room_id = $1
      ORDER BY question_number
    `, [roomId])

    if (existingQuestions.rows.length > 0) {
      return res.json({
        success: true,
        data: existingQuestions.rows
      })
    }

    // 如果没有题目，生成新题目
    const roomResult = await pool.query('SELECT * FROM pk_rooms WHERE id = $1', [roomId])
    const room = roomResult.rows[0]

    // TODO: 从真实题库中获取题目，这里使用模拟数据
    const questions = []
    for (let i = 1; i <= room.question_count; i++) {
      const question = generateMockQuestion(i, room.subject, room.difficulty)

      const result = await pool.query(`
        INSERT INTO pk_questions (room_id, question_number, question_data, correct_answer)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [roomId, i, JSON.stringify(question), question.correctAnswer])

      questions.push(result.rows[0])
    }

    res.json({
      success: true,
      data: questions
    })
  } catch (error) {
    console.error('获取题目失败:', error)
    res.status(500).json({ success: false, message: '获取题目失败' })
  }
})

// 模拟题目生成函数
function generateMockQuestion(questionNumber: number, subject: string, difficulty: string) {
  const mathQuestions = [
    {
      question: '计算：25 × 4 = ?',
      options: ['80', '90', '100', '110'],
      correctAnswer: '100'
    },
    {
      question: '一个长方形的长是8厘米，宽是5厘米，周长是多少厘米？',
      options: ['13', '26', '40', '52'],
      correctAnswer: '26'
    },
    {
      question: '小明有36颗糖，平均分给6个小朋友，每人分到几颗？',
      options: ['4', '5', '6', '7'],
      correctAnswer: '6'
    },
    {
      question: '计算：120 ÷ 4 = ?',
      options: ['20', '25', '30', '35'],
      correctAnswer: '30'
    },
    {
      question: '一个正方形的边长是7厘米，面积是多少平方厘米？',
      options: ['28', '35', '42', '49'],
      correctAnswer: '49'
    },
    {
      question: '计算：48 + 37 = ?',
      options: ['75', '80', '85', '90'],
      correctAnswer: '85'
    },
    {
      question: '小红有5元钱，买了一本书花了3.5元，还剩多少元？',
      options: ['1', '1.5', '2', '2.5'],
      correctAnswer: '1.5'
    },
    {
      question: '计算：9 × 7 = ?',
      options: ['54', '56', '63', '72'],
      correctAnswer: '63'
    },
    {
      question: '一个数的3倍是24，这个数是多少？',
      options: ['6', '7', '8', '9'],
      correctAnswer: '8'
    },
    {
      question: '计算：100 - 45 = ?',
      options: ['45', '50', '55', '60'],
      correctAnswer: '55'
    }
  ]

  const questionIndex = (questionNumber - 1) % mathQuestions.length
  return mathQuestions[questionIndex]
}

export default router
