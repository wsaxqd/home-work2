import express, { Request, Response } from 'express'
import pool from '../db'
import { authenticateToken } from '../middlewares/auth'

const router = express.Router()

interface AuthRequest extends Request {
  user?: { userId: number; role: string }
}

/**
 * 获取我的错题本
 * GET /api/wrong-questions?subject=math&masteredFilter=false&page=1&limit=20
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const {
      subject,
      masteredFilter = 'false',
      page = '1',
      limit = '20'
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    let query = `
      SELECT
        wq.*,
        COUNT(wqr.id) as review_count_actual
      FROM wrong_questions wq
      LEFT JOIN wrong_question_reviews wqr ON wq.id = wqr.wrong_question_id
      WHERE wq.user_id = $1
    `
    const params: any[] = [userId]
    let paramIndex = 2

    // 科目筛选
    if (subject) {
      query += ` AND wq.subject = $${paramIndex}`
      params.push(subject)
      paramIndex++
    }

    // 掌握状态筛选
    if (masteredFilter === 'true') {
      query += ` AND wq.is_mastered = false`
    }

    query += `
      GROUP BY wq.id
      ORDER BY wq.last_wrong_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    params.push(limitNum, offset)

    const result = await pool.query(query, params)

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM wrong_questions WHERE user_id = $1 ${subject ? 'AND subject = $2' : ''}`,
      subject ? [userId, subject] : [userId]
    )

    res.json({
      success: true,
      data: {
        questions: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: pageNum,
        limit: limitNum
      }
    })
  } catch (error) {
    console.error('获取错题本失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 添加错题
 * POST /api/wrong-questions
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const {
      questionId,
      subject,
      gradeLevel,
      questionText,
      questionImage,
      correctAnswer,
      userAnswer,
      errorType,
      knowledgePoints,
      difficultyLevel
    } = req.body

    // 检查是否已存在
    const existingResult = await pool.query(
      `SELECT id, mistake_count FROM wrong_questions
       WHERE user_id = $1 AND question_text = $2 AND subject = $3`,
      [userId, questionText, subject]
    )

    let wrongQuestionId

    if (existingResult.rows.length > 0) {
      // 更新已有记录
      const existing = existingResult.rows[0]
      await pool.query(
        `UPDATE wrong_questions
         SET mistake_count = mistake_count + 1,
             last_wrong_at = NOW(),
             user_answer = $1,
             is_mastered = false,
             updated_at = NOW()
         WHERE id = $2`,
        [userAnswer, existing.id]
      )
      wrongQuestionId = existing.id
    } else {
      // 创建新记录
      const insertResult = await pool.query(
        `INSERT INTO wrong_questions
         (user_id, question_id, subject, grade_level, question_text, question_image,
          correct_answer, user_answer, error_type, knowledge_points, difficulty_level,
          next_review_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() + INTERVAL '1 day')
         RETURNING id`,
        [userId, questionId, subject, gradeLevel, questionText, questionImage,
         correctAnswer, userAnswer, errorType, JSON.stringify(knowledgePoints || []),
         difficultyLevel]
      )
      wrongQuestionId = insertResult.rows[0].id
    }

    // 更新知识点薄弱分析
    if (knowledgePoints && Array.isArray(knowledgePoints)) {
      for (const point of knowledgePoints) {
        await pool.query(
          `INSERT INTO knowledge_weakness
           (user_id, subject, knowledge_point, wrong_count, total_count, last_practice_at)
           VALUES ($1, $2, $3, 1, 1, NOW())
           ON CONFLICT (user_id, subject, knowledge_point)
           DO UPDATE SET
             wrong_count = knowledge_weakness.wrong_count + 1,
             total_count = knowledge_weakness.total_count + 1,
             last_practice_at = NOW(),
             updated_at = NOW()`,
          [userId, subject, point]
        )
      }
    }

    res.json({
      success: true,
      message: '错题已记录',
      data: { wrongQuestionId }
    })
  } catch (error) {
    console.error('添加错题失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 标记错题为已掌握
 * POST /api/wrong-questions/:id/master
 */
router.post('/:id/master', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const { id } = req.params

    await pool.query(
      `UPDATE wrong_questions
       SET is_mastered = true, updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    )

    res.json({ success: true, message: '已标记为掌握' })
  } catch (error) {
    console.error('标记掌握失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 记录复习
 * POST /api/wrong-questions/:id/review
 */
router.post('/:id/review', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const { result, timeSpent, confidenceLevel, notes } = req.body

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 记录复习
      await client.query(
        `INSERT INTO wrong_question_reviews
         (wrong_question_id, review_result, time_spent, confidence_level, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, result, timeSpent, confidenceLevel, notes]
      )

      // 更新错题记录
      let updateQuery = `
        UPDATE wrong_questions
        SET review_count = review_count + 1,
            updated_at = NOW()
      `

      if (result === 'correct') {
        // 答对了，延长复习间隔
        updateQuery += `, next_review_at = NOW() + INTERVAL '${Math.pow(2, await getReviewCount(id))} days'`
        // 如果连续答对3次，标记为已掌握
        if (await getCorrectReviewStreak(id) >= 2) {
          updateQuery += `, is_mastered = true`
        }
      } else if (result === 'wrong') {
        // 答错了，缩短复习间隔
        updateQuery += `, next_review_at = NOW() + INTERVAL '1 day', is_mastered = false`
      }

      updateQuery += ` WHERE id = $1 AND user_id = $2`
      await client.query(updateQuery, [id, userId])

      await client.query('COMMIT')

      res.json({ success: true, message: '复习记录已保存' })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('记录复习失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// 辅助函数：获取复习次数
async function getReviewCount(wrongQuestionId: number): Promise<number> {
  const result = await pool.query(
    'SELECT review_count FROM wrong_questions WHERE id = $1',
    [wrongQuestionId]
  )
  return result.rows[0]?.review_count || 0
}

// 辅助函数：获取连续答对次数
async function getCorrectReviewStreak(wrongQuestionId: number): Promise<number> {
  const result = await pool.query(
    `SELECT review_result FROM wrong_question_reviews
     WHERE wrong_question_id = $1
     ORDER BY created_at DESC
     LIMIT 3`,
    [wrongQuestionId]
  )

  let streak = 0
  for (const row of result.rows) {
    if (row.review_result === 'correct') {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * 获取知识点薄弱分析
 * GET /api/wrong-questions/weakness-analysis?subject=math
 */
router.get('/weakness-analysis', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const { subject } = req.query

    let query = `
      SELECT
        kw.*,
        ROUND((kw.wrong_count::DECIMAL / NULLIF(kw.total_count, 0)) * 100, 2) as error_rate
      FROM knowledge_weakness kw
      WHERE kw.user_id = $1
    `
    const params: any[] = [userId]

    if (subject) {
      query += ' AND kw.subject = $2'
      params.push(subject)
    }

    query += ' ORDER BY error_rate DESC, wrong_count DESC LIMIT 10'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取薄弱分析失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

/**
 * 获取今日待复习题目
 * GET /api/wrong-questions/review-today
 */
router.get('/review-today', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    const result = await pool.query(
      `SELECT * FROM wrong_questions
       WHERE user_id = $1
         AND is_mastered = false
         AND next_review_at <= NOW()
       ORDER BY next_review_at ASC
       LIMIT 20`,
      [userId]
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取复习题目失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

export default router
