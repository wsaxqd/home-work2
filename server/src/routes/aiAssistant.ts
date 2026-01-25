import express, { Request, Response } from 'express'
import { pool } from '../config/database'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

interface AuthRequest extends Request {
  userId?: string
  userType?: string
}

/**
 * 1. 获取AI学习诊断
 * POST /api/ai-assistant/diagnosis
 */
router.post('/diagnosis', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { subject, diagnosisType = 'on_demand' } = req.body

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 获取用户最近的错题数据
      const wrongQuestionsQuery = `
        SELECT subject, knowledge_points, error_type, difficulty_level, created_at
        FROM wrong_questions
        WHERE user_id = $1
          ${subject ? 'AND subject = $2' : ''}
          AND created_at >= NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT 100
      `
      const wrongQuestionsResult = await client.query(
        wrongQuestionsQuery,
        subject ? [userId, subject] : [userId]
      )

      // 分析薄弱点
      const weaknessMap = new Map()
      const strengthMap = new Map()

      for (const question of wrongQuestionsResult.rows) {
        const points = Array.isArray(question.knowledge_points)
          ? question.knowledge_points
          : (typeof question.knowledge_points === 'string'
              ? JSON.parse(question.knowledge_points || '[]')
              : [])

        for (const point of points) {
          weaknessMap.set(point, (weaknessMap.get(point) || 0) + 1)
        }
      }

      // 转换为数组并排序
      const weaknesses = Array.from(weaknessMap.entries())
        .map(([area, count]) => ({
          area,
          errorCount: count,
          priority: count >= 5 ? 'high' : count >= 3 ? 'medium' : 'low',
          score: Math.max(0, 100 - count * 5)
        }))
        .sort((a, b) => b.errorCount - a.errorCount)
        .slice(0, 5)

      // 计算综合评分
      const totalQuestions = wrongQuestionsResult.rows.length
      const overallScore = totalQuestions > 0
        ? Math.round(Math.max(60, 100 - totalQuestions * 2))
        : 85

      // 生成AI建议（这里简化处理，实际应调用AI API）
      const aiSummary = totalQuestions > 10
        ? `通过分析你最近30天的学习数据，发现你在${subject || '多个科目'}中需要加强练习。建议重点关注薄弱知识点，多做针对性练习。`
        : `你的学习表现不错！继续保持，可以尝试更高难度的题目。`

      const aiRecommendations = weaknesses.length > 0
        ? `建议优先学习：${weaknesses.slice(0, 3).map(w => w.area).join('、')}。每天花15-20分钟专项练习这些知识点。`
        : `建议继续巩固已学知识，并逐步拓展新的学习内容。`

      // 保存诊断记录
      const diagnosisResult = await client.query(
        `INSERT INTO ai_learning_diagnosis
         (user_id, diagnosis_type, subject, overall_score, strengths, weaknesses,
          improvement_suggestions, analyzed_questions_count, analyzed_time_range,
          ai_summary, ai_recommendations)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          userId,
          diagnosisType,
          subject,
          overallScore,
          JSON.stringify([]), // 优势领域（简化）
          JSON.stringify(weaknesses),
          JSON.stringify([]),
          totalQuestions,
          JSON.stringify({ start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end_date: new Date() }),
          aiSummary,
          aiRecommendations
        ]
      )

      await client.query('COMMIT')

      res.json({
        success: true,
        message: '学习诊断完成',
        data: diagnosisResult.rows[0]
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('学习诊断失败:', error)
    res.status(500).json({ success: false, message: '学习诊断失败' })
  }
})

/**
 * 2. 生成个性化学习计划
 * POST /api/ai-assistant/learning-plan
 */
router.post('/learning-plan', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const {
      planName,
      subject: requestSubject,
      durationDays = 14,
      dailyTargetMinutes = 30,
      diagnosisId
    } = req.body

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 获取诊断数据,同时获取subject
      let weaknesses = []
      let subject = requestSubject || 'math' // 默认subject

      if (diagnosisId) {
        const diagnosisResult = await client.query(
          'SELECT weaknesses, subject FROM ai_learning_diagnosis WHERE id = $1 AND user_id = $2',
          [diagnosisId, userId]
        )
        if (diagnosisResult.rows.length > 0) {
          // JSONB字段会自动解析为对象,不需要JSON.parse
          const weakness_data = diagnosisResult.rows[0].weaknesses
          weaknesses = Array.isArray(weakness_data) ? weakness_data : (weakness_data ? [weakness_data] : [])
          // 使用诊断记录中的subject
          subject = diagnosisResult.rows[0].subject || subject
        }
      }

      // 生成学习主题（基于薄弱点）
      const topics = []
      const topicsPerWeek = Math.ceil(durationDays / 7) * 3

      for (let day = 1; day <= durationDays; day++) {
        const weaknessIndex = (day - 1) % Math.max(weaknesses.length, 1)
        const weakness = weaknesses[weaknessIndex] || { area: `${subject}基础练习` }

        topics.push({
          day,
          topic: weakness.area || `${subject}练习${day}`,
          exercises: [],
          estimated_time: dailyTargetMinutes,
          difficulty: day <= 7 ? 'easy' : day <= 14 ? 'medium' : 'hard'
        })
      }

      // 设置里程碑
      const milestones = [
        { day: 7, milestone: '完成第一周学习', reward: { points: 50, badge: '坚持一周' } },
        { day: 14, milestone: '完成两周学习', reward: { points: 100, badge: '学习达人' } },
        { day: 21, milestone: '完成三周学习', reward: { points: 200, badge: '学习大师' } }
      ].filter(m => m.day <= durationDays)

      // 设置学习目标
      const goals = weaknesses.slice(0, 3).map((w: any) => ({
        goal: `掌握${w.area}`,
        target_score: 90,
        knowledge_points: [w.area]
      }))

      if (goals.length === 0) {
        goals.push({
          goal: `提升${subject}水平`,
          target_score: 85,
          knowledge_points: []
        })
      }

      // 创建学习计划
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

      const planResult = await client.query(
        `INSERT INTO ai_learning_plans
         (user_id, diagnosis_id, plan_name, plan_type, subject, start_date, end_date,
          duration_days, goals, daily_target_minutes, topics, milestones)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          userId,
          diagnosisId,
          planName || `${subject}学习计划`,
          'auto',
          subject,
          startDate,
          endDate,
          durationDays,
          JSON.stringify(goals),
          dailyTargetMinutes,
          JSON.stringify(topics),
          JSON.stringify(milestones)
        ]
      )

      await client.query('COMMIT')

      res.json({
        success: true,
        message: '学习计划已生成',
        data: planResult.rows[0]
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('生成学习计划失败:', error)
    res.status(500).json({ success: false, message: '生成学习计划失败' })
  }
})

/**
 * 3. 获取我的学习计划列表
 * GET /api/ai-assistant/learning-plans?is_active=true
 */
router.get('/learning-plans', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { is_active } = req.query

    let query = 'SELECT * FROM ai_learning_plans WHERE user_id = $1'
    const params: any[] = [userId]

    if (is_active !== undefined) {
      query += ' AND is_active = $2'
      params.push(is_active === 'true')
    }

    query += ' ORDER BY created_at DESC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取学习计划失败:', error)
    res.status(500).json({ success: false, message: '获取学习计划失败' })
  }
})

/**
 * 4. 获取学习计划详情
 * GET /api/ai-assistant/learning-plans/:planId
 */
router.get('/learning-plans/:planId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { planId } = req.params

    const planResult = await pool.query(
      'SELECT * FROM ai_learning_plans WHERE id = $1 AND user_id = $2',
      [planId, userId]
    )

    if (planResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '学习计划不存在' })
    }

    // 获取进度记录
    const progressResult = await pool.query(
      `SELECT * FROM ai_plan_progress
       WHERE plan_id = $1
       ORDER BY day_number`,
      [planId]
    )

    res.json({
      success: true,
      data: {
        plan: planResult.rows[0],
        progress: progressResult.rows
      }
    })
  } catch (error) {
    console.error('获取计划详情失败:', error)
    res.status(500).json({ success: false, message: '获取计划详情失败' })
  }
})

/**
 * 5. 完成学习计划某一天
 * POST /api/ai-assistant/learning-plans/:planId/complete-day
 */
router.post('/learning-plans/:planId/complete-day', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { planId } = req.params
    const {
      dayNumber,
      actualTimeSpent,
      completedExercisesCount,
      correctRate,
      difficultyRating,
      userNotes
    } = req.body

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 验证计划
      const planResult = await client.query(
        'SELECT * FROM ai_learning_plans WHERE id = $1 AND user_id = $2',
        [planId, userId]
      )
      if (planResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ success: false, message: '学习计划不存在' })
      }

      const plan = planResult.rows[0]
      // JSONB字段会自动解析为对象
      const topics = Array.isArray(plan.topics) ? plan.topics : []
      const topic = topics.find((t: any) => t.day === dayNumber)

      // 生成AI反馈
      let aiFeedback = ''
      if (correctRate >= 90) {
        aiFeedback = '太棒了！你掌握得非常好，可以挑战更难的题目了！'
      } else if (correctRate >= 70) {
        aiFeedback = '不错！继续保持，再多练习几次会更好！'
      } else {
        aiFeedback = '需要加强哦！建议复习一下相关知识点，慢慢来，你一定可以的！'
      }

      // 记录进度
      const progressResult = await client.query(
        `INSERT INTO ai_plan_progress
         (plan_id, user_id, day_number, topic_name, is_completed, actual_time_spent,
          completed_exercises_count, correct_rate, difficulty_rating, user_notes, ai_feedback, completed_at)
         VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8, $9, $10, NOW())
         RETURNING *`,
        [
          planId,
          userId,
          dayNumber,
          topic?.topic || `Day ${dayNumber}`,
          actualTimeSpent,
          completedExercisesCount,
          correctRate,
          difficultyRating,
          userNotes,
          aiFeedback
        ]
      )

      // 更新计划进度
      const completedDays = await client.query(
        'SELECT COUNT(*) as count FROM ai_plan_progress WHERE plan_id = $1 AND is_completed = true',
        [planId]
      )
      const completionRate = (completedDays.rows[0].count / plan.duration_days) * 100

      await client.query(
        `UPDATE ai_learning_plans
         SET current_day = $1,
             completion_rate = $2,
             is_completed = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [
          dayNumber,
          completionRate.toFixed(2),
          completionRate >= 100,
          planId
        ]
      )

      // 检查里程碑
      // JSONB字段会自动解析为对象
      const milestones = Array.isArray(plan.milestones) ? plan.milestones : []
      const achievedMilestone = milestones.find((m: any) => m.day === dayNumber)

      if (achievedMilestone && achievedMilestone.reward?.points) {
        await client.query(
          'UPDATE users SET points = points + $1 WHERE id = $2',
          [achievedMilestone.reward.points, userId]
        )
      }

      await client.query('COMMIT')

      res.json({
        success: true,
        message: '今日学习已完成',
        data: {
          progress: progressResult.rows[0],
          milestone: achievedMilestone,
          completion_rate: completionRate.toFixed(2)
        }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('记录学习进度失败:', error)
    res.status(500).json({ success: false, message: '记录学习进度失败' })
  }
})

/**
 * 6. 获取AI题目讲解
 * POST /api/ai-assistant/explain-question
 */
router.post('/explain-question', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const {
      questionText,
      subject,
      correctAnswer,
      userAnswer,
      questionImage,
      explanationType = 'detailed'
    } = req.body

    // 生成AI讲解（简化版，实际应调用AI API）
    let aiExplanation = ''
    let explanationSteps = []

    if (explanationType === 'step_by_step') {
      explanationSteps = [
        {
          step: 1,
          title: '理解题意',
          content: '首先，我们要仔细阅读题目，理解题目在问什么。',
          images: []
        },
        {
          step: 2,
          title: '分析解题思路',
          content: '根据题目给出的条件，我们可以找到解题的关键信息。',
          images: []
        },
        {
          step: 3,
          title: '计算过程',
          content: `正确答案是：${correctAnswer}。让我们一步步来看如何得出这个答案。`,
          images: []
        },
        {
          step: 4,
          title: '总结',
          content: '通过这道题，我们掌握了相关知识点。下次遇到类似题目就知道怎么做了！',
          images: []
        }
      ]
      aiExplanation = explanationSteps.map(s => `${s.step}. ${s.title}: ${s.content}`).join('\n\n')
    } else {
      aiExplanation = `这道题的正确答案是"${correctAnswer}"。\n\n你的答案是"${userAnswer}"。让我来帮你分析一下：\n\n这道题考查的是${subject}的相关知识。解题的关键是要理解题目中的关键信息，然后运用正确的方法来求解。建议你复习一下相关知识点，多做几道类似的题目加深理解。`
    }

    // 提取知识点
    const knowledgePoints = [`${subject}基础`, '问题分析']

    // 保存讲解记录
    const result = await pool.query(
      `INSERT INTO ai_question_explanations
       (user_id, subject, question_text, question_image, correct_answer, user_answer,
        explanation_type, ai_explanation, knowledge_points, explanation_steps)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        subject,
        questionText,
        questionImage,
        correctAnswer,
        userAnswer,
        explanationType,
        aiExplanation,
        JSON.stringify(knowledgePoints),
        JSON.stringify(explanationSteps)
      ]
    )

    res.json({
      success: true,
      message: '题目讲解已生成',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('生成题目讲解失败:', error)
    res.status(500).json({ success: false, message: '生成题目讲解失败' })
  }
})

/**
 * 7. AI学习伙伴对话
 * POST /api/ai-assistant/companion/chat
 */
router.post('/companion/chat', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { message, sessionId, contextData } = req.body

    const generatedSessionId = sessionId || `session_${userId}_${Date.now()}`

    // 保存用户消息
    await pool.query(
      `INSERT INTO ai_companion_chats
       (user_id, session_id, role, message, message_type, context_data)
       VALUES ($1, $2, 'user', $3, 'text', $4)`,
      [userId, generatedSessionId, message, JSON.stringify(contextData || {})]
    )

    // 生成AI回复（简化版，实际应调用AI API）
    let aiReply = ''
    let aiIntent = 'chat'

    if (message.includes('不会') || message.includes('难')) {
      aiReply = '别担心！学习新知识本来就需要时间。让我来帮你分析一下这道题，我们一步步来解决它！'
      aiIntent = 'encourage'
    } else if (message.includes('累') || message.includes('休息')) {
      aiReply = '学习确实需要劳逸结合！休息一下是很重要的。等你休息好了，我们再继续学习吧！'
      aiIntent = 'encourage'
    } else if (message.includes('好') || message.includes('对')) {
      aiReply = '太棒了！你答对了！继续保持这个状态，你会越来越厉害的！'
      aiIntent = 'praise'
    } else {
      aiReply = '我明白你的意思了。让我来帮助你理解这个问题。你可以告诉我具体哪里不理解吗？'
      aiIntent = 'guide'
    }

    // 保存AI回复
    const assistantResult = await pool.query(
      `INSERT INTO ai_companion_chats
       (user_id, session_id, role, message, message_type, ai_intent, confidence_score)
       VALUES ($1, $2, 'assistant', $3, 'text', $4, 0.85)
       RETURNING *`,
      [userId, generatedSessionId, aiReply, aiIntent]
    )

    res.json({
      success: true,
      data: {
        sessionId: generatedSessionId,
        message: assistantResult.rows[0]
      }
    })
  } catch (error) {
    console.error('AI对话失败:', error)
    res.status(500).json({ success: false, message: 'AI对话失败' })
  }
})

/**
 * 8. 获取对话历史
 * GET /api/ai-assistant/companion/history?sessionId=xxx
 */
router.get('/companion/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { sessionId } = req.query

    let query = 'SELECT * FROM ai_companion_chats WHERE user_id = $1'
    const params: any[] = [userId]

    if (sessionId) {
      query += ' AND session_id = $2'
      params.push(sessionId)
    }

    query += ' ORDER BY created_at ASC LIMIT 100'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取对话历史失败:', error)
    res.status(500).json({ success: false, message: '获取对话历史失败' })
  }
})

/**
 * 9. 生成学习报告
 * POST /api/ai-assistant/report/generate
 */
router.post('/report/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { reportType = 'weekly', subject } = req.body

    // 计算时间范围
    const endDate = new Date()
    let startDate = new Date()

    if (reportType === 'daily') {
      startDate.setDate(endDate.getDate() - 1)
    } else if (reportType === 'weekly') {
      startDate.setDate(endDate.getDate() - 7)
    } else if (reportType === 'monthly') {
      startDate.setMonth(endDate.getMonth() - 1)
    }

    // 收集统计数据
    const stats = {
      total_time: 0,
      questions_solved: 0,
      accuracy_rate: 0,
      subjects_studied: []
    }

    // 生成AI总结
    const aiSummary = `在过去的${reportType === 'daily' ? '一天' : reportType === 'weekly' ? '一周' : '一个月'}里，你完成了多项学习任务。继续保持这个节奏，你会取得更大的进步！`

    // 亮点
    const highlights = [
      { type: 'achievement', content: '坚持每日学习', emoji: '🏆' },
      { type: 'improvement', content: '正确率提升10%', emoji: '📈' }
    ]

    // 保存报告
    const reportResult = await pool.query(
      `INSERT INTO ai_learning_reports
       (user_id, report_type, report_period_start, report_period_end, subject,
        stats, ai_summary, highlights, areas_to_improve, next_week_suggestions, charts_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId,
        reportType,
        startDate,
        endDate,
        subject,
        JSON.stringify(stats),
        aiSummary,
        JSON.stringify(highlights),
        JSON.stringify([]),
        '建议下周增加练习时长，保持学习热情！',
        JSON.stringify({})
      ]
    )

    res.json({
      success: true,
      message: '学习报告已生成',
      data: reportResult.rows[0]
    })
  } catch (error) {
    console.error('生成学习报告失败:', error)
    res.status(500).json({ success: false, message: '生成学习报告失败' })
  }
})

/**
 * 10. 获取我的学习报告列表
 * GET /api/ai-assistant/reports?reportType=weekly
 */
router.get('/reports', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { reportType } = req.query

    let query = 'SELECT * FROM ai_learning_reports WHERE user_id = $1'
    const params: any[] = [userId]

    if (reportType) {
      query += ' AND report_type = $2'
      params.push(reportType)
    }

    query += ' ORDER BY generated_at DESC LIMIT 20'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取学习报告失败:', error)
    res.status(500).json({ success: false, message: '获取学习报告失败' })
  }
})

/**
 * 11. 获取智能推荐
 * GET /api/ai-assistant/recommendations?type=question
 */
router.get('/recommendations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { type } = req.query

    let query = `
      SELECT * FROM ai_smart_recommendations
      WHERE user_id = $1
        AND is_dismissed = false
        AND (expires_at IS NULL OR expires_at > NOW())
    `
    const params: any[] = [userId]

    if (type) {
      query += ' AND recommendation_type = $2'
      params.push(type)
    }

    query += ' ORDER BY priority DESC, created_at DESC LIMIT 10'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取推荐失败:', error)
    res.status(500).json({ success: false, message: '获取推荐失败' })
  }
})

/**
 * 12. 接受推荐
 * POST /api/ai-assistant/recommendations/:id/accept
 */
router.post('/recommendations/:id/accept', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { id } = req.params
    const { feedbackRating } = req.body

    await pool.query(
      `UPDATE ai_smart_recommendations
       SET is_viewed = true, is_accepted = true, feedback_rating = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [feedbackRating, id, userId]
    )

    res.json({ success: true, message: '已接受推荐' })
  } catch (error) {
    console.error('接受推荐失败:', error)
    res.status(500).json({ success: false, message: '接受推荐失败' })
  }
})

/**
 * 13. 拒绝推荐
 * POST /api/ai-assistant/recommendations/:id/dismiss
 */
router.post('/recommendations/:id/dismiss', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { id } = req.params

    await pool.query(
      `UPDATE ai_smart_recommendations
       SET is_viewed = true, is_dismissed = true, updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [id, userId]
    )

    res.json({ success: true, message: '已忽略推荐' })
  } catch (error) {
    console.error('忽略推荐失败:', error)
    res.status(500).json({ success: false, message: '忽略推荐失败' })
  }
})

export default router
