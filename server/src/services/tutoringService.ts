import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import { difyAdapter } from './difyAdapter';

export interface TutoringSession {
  id: string;
  userId: string;
  subject: string;
  difficulty: number;
  questionsAsked: any[];
  questionsAnswered: any[];
  correctCount: number;
  totalCount: number;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
}

export interface TutoringQuestion {
  question: string;
  hint?: string;
  difficulty: number;
  correctAnswer?: string;
}

export interface TutoringAnswer {
  question: string;
  userAnswer: string;
  correct: boolean;
  explanation: string;
  nextDifficulty: number;
}

export class TutoringService {
  private readonly subjects = [
    { id: 'math', name: '数学', topics: ['加减法', '乘除法', '几何', '逻辑推理'] },
    { id: 'chinese', name: '语文', topics: ['拼音', '识字', '古诗', '阅读理解'] },
    { id: 'science', name: '科学', topics: ['动物', '植物', '天文', '物理现象'] },
    { id: 'english', name: '英语', topics: ['字母', '单词', '句型', '日常对话'] },
    { id: 'ai', name: 'AI知识', topics: ['AI基础', '机器学习', '图像识别', '语言理解'] },
  ];

  /**
   * 开始新的辅导会话
   */
  async startSession(userId: string, subject: string): Promise<TutoringSession> {
    // 获取用户当前水平
    const userLevel = await this.getUserLevel(userId, subject);

    const result = await query(
      `INSERT INTO ai_tutoring_sessions
       (id, user_id, subject, difficulty, questions_asked, questions_answered, correct_count, total_count, started_at)
       VALUES (gen_random_uuid(), $1, $2, $3, '[]'::jsonb, '[]'::jsonb, 0, 0, NOW())
       RETURNING *`,
      [userId, subject, userLevel]
    );

    return result.rows[0];
  }

  /**
   * 获取下一个问题（自适应难度）
   */
  async getNextQuestion(sessionId: string): Promise<TutoringQuestion> {
    // 获取会话信息
    const sessionResult = await query(
      `SELECT * FROM ai_tutoring_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new AppError('辅导会话不存在', 404);
    }

    const session = sessionResult.rows[0];
    const subject = this.subjects.find(s => s.id === session.subject);

    if (!subject) {
      throw new AppError('无效的科目', 400);
    }

    // 使用Dify生成个性化问题
    const prompt = this.buildQuestionPrompt(session, subject);
    const response = await difyAdapter.completion(
      difyAdapter.getTutoringAppKey(),
      session.user_id,
      {
        subject: subject.name,
        difficulty: session.difficulty,
        previousQuestions: session.questions_asked.slice(-3), // 最近3个问题
        correctRate: session.total_count > 0
          ? (session.correct_count / session.total_count * 100).toFixed(0)
          : '50',
        prompt: prompt,
      }
    );

    // 解析AI返回的问题
    const question = this.parseQuestionResponse(response.answer, session.difficulty);

    // 保存问题到会话
    await query(
      `UPDATE ai_tutoring_sessions
       SET questions_asked = questions_asked || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify(question), sessionId]
    );

    return question;
  }

  /**
   * 提交答案并获得反馈
   */
  async submitAnswer(
    sessionId: string,
    question: string,
    userAnswer: string
  ): Promise<TutoringAnswer> {
    const sessionResult = await query(
      `SELECT * FROM ai_tutoring_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new AppError('辅导会话不存在', 404);
    }

    const session = sessionResult.rows[0];
    const subject = this.subjects.find(s => s.id === session.subject);

    // 使用AI评估答案
    const response = await difyAdapter.completion(
      difyAdapter.getTutoringEvaluateAppKey(),
      session.user_id,
      {
        subject: subject?.name,
        question: question,
        userAnswer: userAnswer,
        difficulty: session.difficulty,
      }
    );

    const evaluation = this.parseEvaluationResponse(response.answer);

    // 自适应调整难度
    const nextDifficulty = this.calculateNextDifficulty(
      session.difficulty,
      evaluation.correct,
      session.correct_count,
      session.total_count
    );

    // 更新会话数据
    const newCorrectCount = session.correct_count + (evaluation.correct ? 1 : 0);
    const newTotalCount = session.total_count + 1;

    await query(
      `UPDATE ai_tutoring_sessions
       SET questions_answered = questions_answered || $1::jsonb,
           correct_count = $2,
           total_count = $3,
           difficulty = $4
       WHERE id = $5`,
      [
        JSON.stringify({
          question,
          userAnswer,
          correct: evaluation.correct,
          timestamp: new Date(),
        }),
        newCorrectCount,
        newTotalCount,
        nextDifficulty,
        sessionId,
      ]
    );

    return {
      question,
      userAnswer,
      correct: evaluation.correct,
      explanation: evaluation.explanation,
      nextDifficulty,
    };
  }

  /**
   * 结束辅导会话
   */
  async endSession(sessionId: string): Promise<{
    summary: string;
    correctRate: number;
    improvement: string;
    nextSteps: string[];
  }> {
    const sessionResult = await query(
      `UPDATE ai_tutoring_sessions
       SET ended_at = NOW(),
           duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
       WHERE id = $1
       RETURNING *`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new AppError('辅导会话不存在', 404);
    }

    const session = sessionResult.rows[0];
    const correctRate = session.total_count > 0
      ? (session.correct_count / session.total_count * 100)
      : 0;

    // 使用AI生成学习总结和建议
    const response = await difyAdapter.completion(
      difyAdapter.getTutoringSummaryAppKey(),
      session.user_id,
      {
        subject: session.subject,
        totalQuestions: session.total_count,
        correctCount: session.correct_count,
        correctRate: correctRate.toFixed(1),
        difficulty: session.difficulty,
        duration: Math.round(session.duration_minutes || 0),
      }
    );

    const summary = this.parseSummaryResponse(response.answer);

    return {
      summary: summary.text,
      correctRate: Math.round(correctRate),
      improvement: summary.improvement,
      nextSteps: summary.nextSteps,
    };
  }

  /**
   * 获取辅导历史
   */
  async getHistory(userId: string, subject?: string, limit: number = 10) {
    let whereClause = 'WHERE user_id = $1 AND ended_at IS NOT NULL';
    const params: any[] = [userId];

    if (subject) {
      whereClause += ' AND subject = $2';
      params.push(subject);
    }

    const result = await query(
      `SELECT id, subject, difficulty, correct_count, total_count,
              ROUND((correct_count::decimal / NULLIF(total_count, 0) * 100)::numeric, 1) as correct_rate,
              duration_minutes, started_at, ended_at
       FROM ai_tutoring_sessions
       ${whereClause}
       ORDER BY started_at DESC
       LIMIT ${limit}`,
      params
    );

    return result.rows;
  }

  /**
   * 获取学习统计
   */
  async getStatistics(userId: string, subject?: string) {
    let whereClause = 'WHERE user_id = $1 AND ended_at IS NOT NULL';
    const params: any[] = [userId];

    if (subject) {
      whereClause += ' AND subject = $2';
      params.push(subject);
    }

    const result = await query(
      `SELECT
         COUNT(*) as total_sessions,
         SUM(total_count) as total_questions,
         SUM(correct_count) as total_correct,
         ROUND(AVG(correct_count::decimal / NULLIF(total_count, 0) * 100)::numeric, 1) as avg_correct_rate,
         SUM(duration_minutes) as total_minutes,
         AVG(difficulty) as avg_difficulty
       FROM ai_tutoring_sessions
       ${whereClause}`,
      params
    );

    const stats = result.rows[0];

    // 获取各科目统计
    const subjectStats = await query(
      `SELECT subject,
              COUNT(*) as sessions,
              SUM(correct_count) as correct,
              SUM(total_count) as total,
              ROUND((SUM(correct_count)::decimal / NULLIF(SUM(total_count), 0) * 100)::numeric, 1) as correct_rate
       FROM ai_tutoring_sessions
       WHERE user_id = $1 AND ended_at IS NOT NULL
       GROUP BY subject
       ORDER BY sessions DESC`,
      [userId]
    );

    return {
      overall: {
        totalSessions: parseInt(stats.total_sessions) || 0,
        totalQuestions: parseInt(stats.total_questions) || 0,
        totalCorrect: parseInt(stats.total_correct) || 0,
        avgCorrectRate: parseFloat(stats.avg_correct_rate) || 0,
        totalMinutes: parseFloat(stats.total_minutes) || 0,
        avgDifficulty: parseFloat(stats.avg_difficulty) || 1,
      },
      bySubject: subjectStats.rows,
    };
  }

  /**
   * 获取可用科目列表
   */
  getAvailableSubjects() {
    return this.subjects;
  }

  // ========== 私有辅助方法 ==========

  /**
   * 获取用户当前水平
   */
  private async getUserLevel(userId: string, subject: string): Promise<number> {
    const result = await query(
      `SELECT AVG(difficulty) as avg_difficulty,
              ROUND(AVG(correct_count::decimal / NULLIF(total_count, 0) * 100)::numeric, 1) as correct_rate
       FROM ai_tutoring_sessions
       WHERE user_id = $1 AND subject = $2 AND ended_at IS NOT NULL
       ORDER BY ended_at DESC
       LIMIT 5`,
      [userId, subject]
    );

    if (result.rows.length === 0 || !result.rows[0].avg_difficulty) {
      return 1; // 新用户从难度1开始
    }

    const avgDifficulty = parseFloat(result.rows[0].avg_difficulty);
    const correctRate = parseFloat(result.rows[0].correct_rate);

    // 根据正确率调整起始难度
    if (correctRate >= 80) {
      return Math.min(5, Math.ceil(avgDifficulty) + 1);
    } else if (correctRate <= 50) {
      return Math.max(1, Math.floor(avgDifficulty) - 1);
    }

    return Math.round(avgDifficulty);
  }

  /**
   * 构建问题生成提示词
   */
  private buildQuestionPrompt(session: any, subject: any): string {
    return `请生成一个${subject.name}问题，难度等级${session.difficulty}（1-5级）。
要求：
1. 问题适合6-12岁儿童
2. 包含问题、提示（可选）、标准答案
3. 返回JSON格式：{"question": "...", "hint": "...", "answer": "..."}`;
  }

  /**
   * 解析问题响应
   */
  private parseQuestionResponse(answer: string, difficulty: number): TutoringQuestion {
    try {
      // 尝试解析JSON
      const jsonMatch = answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          question: parsed.question || answer,
          hint: parsed.hint,
          difficulty,
          correctAnswer: parsed.answer,
        };
      }
    } catch (e) {
      // JSON解析失败，使用原文
    }

    return {
      question: answer,
      difficulty,
    };
  }

  /**
   * 解析评估响应
   */
  private parseEvaluationResponse(answer: string): {
    correct: boolean;
    explanation: string;
  } {
    const lowerAnswer = answer.toLowerCase();
    const correct = lowerAnswer.includes('正确') ||
                   lowerAnswer.includes('对的') ||
                   lowerAnswer.includes('very good') ||
                   lowerAnswer.includes('correct');

    return {
      correct,
      explanation: answer,
    };
  }

  /**
   * 计算下一题难度（自适应算法）
   */
  private calculateNextDifficulty(
    currentDifficulty: number,
    isCorrect: boolean,
    correctCount: number,
    totalCount: number
  ): number {
    const newTotalCount = totalCount + 1;
    const newCorrectCount = correctCount + (isCorrect ? 1 : 0);
    const correctRate = newCorrectCount / newTotalCount;

    let nextDifficulty = currentDifficulty;

    // 最近3题的表现调整难度
    if (newTotalCount >= 3) {
      if (correctRate >= 0.8 && isCorrect) {
        // 正确率高且最新题也对，提升难度
        nextDifficulty = Math.min(5, currentDifficulty + 1);
      } else if (correctRate <= 0.4 && !isCorrect) {
        // 正确率低且最新题也错，降低难度
        nextDifficulty = Math.max(1, currentDifficulty - 1);
      }
    }

    return nextDifficulty;
  }

  /**
   * 解析总结响应
   */
  private parseSummaryResponse(answer: string): {
    text: string;
    improvement: string;
    nextSteps: string[];
  } {
    // 简单解析，实际可以更复杂
    const lines = answer.split('\n').filter(l => l.trim());

    return {
      text: answer,
      improvement: lines.find(l => l.includes('进步') || l.includes('改进')) || '继续保持学习热情！',
      nextSteps: lines
        .filter(l => l.match(/^\d+[\.、]/) || l.startsWith('-'))
        .map(l => l.replace(/^[\d\-\.、\s]+/, ''))
        .slice(0, 3),
    };
  }
}

export const tutoringService = new TutoringService();
