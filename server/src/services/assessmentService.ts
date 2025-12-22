import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export type AssessmentType = 'cognitive' | 'emotional' | 'social' | 'creative' | 'language';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface AssessmentAnswer {
  questionId: string;
  answer: string | number | string[];
  timeSpent?: number;
}

export interface AssessmentSubmission {
  assessmentType: AssessmentType;
  answers: AssessmentAnswer[];
  totalTime: number;
}

export class AssessmentService {
  // 获取评估题目
  async getQuestions(assessmentType: AssessmentType, level?: SkillLevel) {
    let whereClause = 'WHERE type = $1';
    const params: any[] = [assessmentType];

    if (level) {
      whereClause += ' AND difficulty = $2';
      params.push(level);
    }

    const result = await query(
      `SELECT id, type, question, options, difficulty, points
       FROM assessment_questions ${whereClause}
       ORDER BY RANDOM()
       LIMIT 10`,
      params
    );

    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      question: row.question,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
      difficulty: row.difficulty,
      points: row.points,
    }));
  }

  // 提交评估
  async submitAssessment(userId: string, submission: AssessmentSubmission) {
    const { assessmentType, answers, totalTime } = submission;

    // 计算得分
    let totalScore = 0;
    let correctCount = 0;
    const results: any[] = [];

    for (const answer of answers) {
      const questionResult = await query(
        'SELECT correct_answer, points FROM assessment_questions WHERE id = $1',
        [answer.questionId]
      );

      if (questionResult.rows.length > 0) {
        const question = questionResult.rows[0];
        const isCorrect = this.checkAnswer(answer.answer, question.correct_answer);

        if (isCorrect) {
          totalScore += question.points;
          correctCount++;
        }

        results.push({
          questionId: answer.questionId,
          isCorrect,
          points: isCorrect ? question.points : 0,
        });
      }
    }

    const accuracy = answers.length > 0 ? (correctCount / answers.length) * 100 : 0;

    // 保存评估结果
    const assessmentResult = await query(
      `INSERT INTO assessments (user_id, type, score, accuracy, total_questions, correct_count, time_spent, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, assessmentType, totalScore, accuracy, answers.length, correctCount, totalTime, JSON.stringify(answers)]
    );

    // 更新学习进度
    await this.updateLearningProgress(userId, assessmentType, totalScore, accuracy);

    return {
      id: assessmentResult.rows[0].id,
      score: totalScore,
      accuracy: Math.round(accuracy * 100) / 100,
      correctCount,
      totalQuestions: answers.length,
      timeSpent: totalTime,
      results,
      level: this.determineLevel(accuracy),
    };
  }

  // 获取评估历史
  async getHistory(userId: string, assessmentType?: AssessmentType, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (assessmentType) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(assessmentType);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM assessments ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(pageSize, offset);
    const result = await query(
      `SELECT * FROM assessments ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return {
      list: result.rows.map(row => ({
        id: row.id,
        type: row.type,
        score: row.score,
        accuracy: parseFloat(row.accuracy),
        totalQuestions: row.total_questions,
        correctCount: row.correct_count,
        timeSpent: row.time_spent,
        createdAt: row.created_at,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取学习进度报告
  async getProgressReport(userId: string) {
    // 获取各类型的学习进度
    const progressResult = await query(
      'SELECT * FROM learning_progress WHERE user_id = $1',
      [userId]
    );

    // 获取最近的评估记录
    const recentAssessments = await query(
      `SELECT type, score, accuracy, created_at
       FROM assessments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // 计算综合评分
    const overallResult = await query(
      `SELECT
         AVG(score) as avg_score,
         AVG(accuracy) as avg_accuracy,
         COUNT(*) as total_assessments
       FROM assessments
       WHERE user_id = $1`,
      [userId]
    );

    const progress: Record<string, any> = {};
    for (const row of progressResult.rows) {
      progress[row.skill_type] = {
        level: row.current_level,
        score: row.score,
        progress: parseFloat(row.progress),
        lastUpdated: row.updated_at,
      };
    }

    const overall = overallResult.rows[0];

    return {
      progress,
      overall: {
        avgScore: overall.avg_score ? parseFloat(overall.avg_score) : 0,
        avgAccuracy: overall.avg_accuracy ? parseFloat(overall.avg_accuracy) : 0,
        totalAssessments: parseInt(overall.total_assessments) || 0,
      },
      recentAssessments: recentAssessments.rows,
      recommendations: this.generateRecommendations(progress),
    };
  }

  // 获取能力雷达图数据
  async getSkillRadar(userId: string) {
    const result = await query(
      `SELECT skill_type, score, current_level
       FROM learning_progress
       WHERE user_id = $1`,
      [userId]
    );

    const skills: Record<string, number> = {
      cognitive: 0,
      emotional: 0,
      social: 0,
      creative: 0,
      language: 0,
    };

    for (const row of result.rows) {
      skills[row.skill_type] = row.score || 0;
    }

    return {
      labels: ['认知能力', '情感能力', '社交能力', '创造力', '语言能力'],
      data: [
        skills.cognitive,
        skills.emotional,
        skills.social,
        skills.creative,
        skills.language,
      ],
      maxScore: 100,
    };
  }

  // 更新学习进度
  private async updateLearningProgress(userId: string, skillType: AssessmentType, score: number, accuracy: number) {
    const existingResult = await query(
      'SELECT * FROM learning_progress WHERE user_id = $1 AND skill_type = $2',
      [userId, skillType]
    );

    if (existingResult.rows.length === 0) {
      await query(
        `INSERT INTO learning_progress (user_id, skill_type, score, current_level, progress)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, skillType, score, this.determineLevel(accuracy), Math.min(accuracy, 100)]
      );
    } else {
      const current = existingResult.rows[0];
      const newScore = Math.max(current.score, score);
      const newProgress = Math.min((parseFloat(current.progress) + accuracy / 10), 100);

      await query(
        `UPDATE learning_progress SET
         score = $1,
         current_level = $2,
         progress = $3,
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4 AND skill_type = $5`,
        [newScore, this.determineLevel(accuracy), newProgress, userId, skillType]
      );
    }
  }

  // 检查答案
  private checkAnswer(userAnswer: string | number | string[], correctAnswer: string): boolean {
    const correct = typeof correctAnswer === 'string' ? correctAnswer : String(correctAnswer);
    const user = Array.isArray(userAnswer) ? userAnswer.sort().join(',') : String(userAnswer);
    return user.toLowerCase() === correct.toLowerCase();
  }

  // 确定等级
  private determineLevel(accuracy: number): SkillLevel {
    if (accuracy >= 90) return 'expert';
    if (accuracy >= 70) return 'advanced';
    if (accuracy >= 50) return 'intermediate';
    return 'beginner';
  }

  // 生成学习建议
  private generateRecommendations(progress: Record<string, any>): string[] {
    const recommendations: string[] = [];

    const skillNames: Record<string, string> = {
      cognitive: '认知能力',
      emotional: '情感能力',
      social: '社交能力',
      creative: '创造力',
      language: '语言能力',
    };

    for (const [skill, data] of Object.entries(progress)) {
      if (data.progress < 30) {
        recommendations.push(`建议多练习${skillNames[skill]}相关的游戏和活动`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('继续保持学习热情，挑战更高难度的内容！');
    }

    return recommendations;
  }
}

export const assessmentService = new AssessmentService();
