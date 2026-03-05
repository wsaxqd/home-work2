import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

/**
 * 学习题目服务
 * 提供学习题目的查询、获取、统计等功能
 */
export class LearningQuestionService {
  /**
   * 根据知识点查询题目
   * @param knowledgePointId 知识点ID
   * @param options 查询选项
   */
  async getQuestionsByKnowledgePoint(
    knowledgePointId: string,
    options: {
      count?: number;
      difficulty?: number;
      questionType?: string;
      excludeIds?: number[];
      orderBy?: 'random' | 'difficulty' | 'accuracy';
    } = {}
  ) {
    const {
      count = 10,
      difficulty,
      questionType,
      excludeIds = [],
      orderBy = 'random',
    } = options;

    // 构建查询条件
    let whereClause = 'WHERE knowledge_point_id = $1 AND is_active = true';
    const params: any[] = [knowledgePointId];
    let paramIndex = 2;

    if (difficulty) {
      whereClause += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (questionType) {
      whereClause += ` AND question_type = $${paramIndex}`;
      params.push(questionType);
      paramIndex++;
    }

    if (excludeIds.length > 0) {
      whereClause += ` AND id NOT IN (${excludeIds.join(',')})`;
    }

    // 构建排序条件
    let orderClause = '';
    switch (orderBy) {
      case 'difficulty':
        orderClause = 'ORDER BY difficulty ASC, RANDOM()';
        break;
      case 'accuracy':
        orderClause = `ORDER BY
          CASE
            WHEN total_attempts > 0 THEN (correct_attempts::float / total_attempts)
            ELSE 0.5
          END ASC,
          RANDOM()`;
        break;
      case 'random':
      default:
        orderClause = 'ORDER BY RANDOM()';
        break;
    }

    const result = await query(
      `SELECT * FROM questions
       ${whereClause}
       ${orderClause}
       LIMIT $${paramIndex}`,
      [...params, count]
    );

    return result.rows;
  }

  /**
   * 根据ID获取题目详情
   */
  async getQuestionById(questionId: number) {
    const result = await query(
      'SELECT * FROM questions WHERE id = $1',
      [questionId]
    );

    if (result.rows.length === 0) {
      throw new AppError('题目不存在', 404);
    }

    return result.rows[0];
  }

  /**
   * 批量获取题目
   */
  async getQuestionsByIds(questionIds: number[]) {
    if (questionIds.length === 0) {
      return [];
    }

    const result = await query(
      `SELECT * FROM questions WHERE id = ANY($1) ORDER BY id`,
      [questionIds]
    );

    return result.rows;
  }

  /**
   * 记录用户答题
   */
  async recordUserAnswer(data: {
    userId: string;
    questionId: number;
    knowledgePointId: string;
    userAnswer: string;
    isCorrect: boolean;
    timeSpent?: number;
    source?: string;
    sessionId?: string;
  }) {
    const {
      userId,
      questionId,
      knowledgePointId,
      userAnswer,
      isCorrect,
      timeSpent,
      source = 'practice',
      sessionId,
    } = data;

    // 插入答题记录
    await query(
      `INSERT INTO user_question_records
       (user_id, question_id, knowledge_point_id, user_answer, is_correct, time_spent, source, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, questionId, knowledgePointId, userAnswer, isCorrect, timeSpent, source, sessionId]
    );

    // 更新题目统计
    await query(
      `UPDATE questions
       SET total_attempts = total_attempts + 1,
           correct_attempts = correct_attempts + ${isCorrect ? 1 : 0},
           average_time = CASE
             WHEN total_attempts > 0 THEN
               (average_time * total_attempts + ${timeSpent || 0}) / (total_attempts + 1)
             ELSE ${timeSpent || 0}
           END
       WHERE id = $1`,
      [questionId]
    );

    // 更新用户知识点掌握度
    await this.updateUserKnowledgeMastery(userId, knowledgePointId, isCorrect);
  }

  /**
   * 更新用户知识点掌握度
   */
  private async updateUserKnowledgeMastery(
    userId: string,
    knowledgePointId: string,
    isCorrect: boolean
  ) {
    // 获取知识点信息
    const kpResult = await query(
      'SELECT subject, grade FROM knowledge_points WHERE id = $1',
      [knowledgePointId]
    );

    if (kpResult.rows.length === 0) {
      return;
    }

    const { subject, grade } = kpResult.rows[0];

    // 检查是否已有记录
    const existingResult = await query(
      'SELECT * FROM user_knowledge_mastery WHERE user_id = $1 AND knowledge_point_id = $2',
      [userId, knowledgePointId]
    );

    if (existingResult.rows.length === 0) {
      // 创建新记录
      await query(
        `INSERT INTO user_knowledge_mastery
         (user_id, knowledge_point_id, subject, grade, mastery_level, total_questions, correct_questions, accuracy_rate, consecutive_correct, last_practiced_at, practice_count)
         VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, CURRENT_TIMESTAMP, 1)`,
        [
          userId,
          knowledgePointId,
          subject,
          grade,
          isCorrect ? 1 : 0,
          isCorrect ? 1 : 0,
          isCorrect ? 100 : 0,
          isCorrect ? 1 : 0,
        ]
      );
    } else {
      // 更新现有记录
      const current = existingResult.rows[0];
      const newTotalQuestions = current.total_questions + 1;
      const newCorrectQuestions = current.correct_questions + (isCorrect ? 1 : 0);
      const newAccuracyRate = (newCorrectQuestions / newTotalQuestions) * 100;
      const newConsecutiveCorrect = isCorrect ? current.consecutive_correct + 1 : 0;

      // 根据正确率和连续正确次数计算掌握度
      let newMasteryLevel = current.mastery_level;
      if (newAccuracyRate >= 90 && newConsecutiveCorrect >= 5) {
        newMasteryLevel = Math.min(5, current.mastery_level + 1);
      } else if (newAccuracyRate < 60) {
        newMasteryLevel = Math.max(0, current.mastery_level - 1);
      }

      await query(
        `UPDATE user_knowledge_mastery
         SET total_questions = $1,
             correct_questions = $2,
             accuracy_rate = $3,
             consecutive_correct = $4,
             mastery_level = $5,
             last_practiced_at = CURRENT_TIMESTAMP,
             practice_count = practice_count + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $6 AND knowledge_point_id = $7`,
        [
          newTotalQuestions,
          newCorrectQuestions,
          newAccuracyRate,
          newConsecutiveCorrect,
          newMasteryLevel,
          userId,
          knowledgePointId,
        ]
      );
    }
  }

  /**
   * 获取用户知识点掌握度
   */
  async getUserKnowledgeMastery(userId: string, knowledgePointId: string) {
    const result = await query(
      'SELECT * FROM user_knowledge_mastery WHERE user_id = $1 AND knowledge_point_id = $2',
      [userId, knowledgePointId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * 获取用户所有知识点掌握度
   */
  async getUserAllKnowledgeMastery(userId: string, subject?: string, grade?: string) {
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (subject) {
      whereClause += ` AND subject = $${paramIndex}`;
      params.push(subject);
      paramIndex++;
    }

    if (grade) {
      whereClause += ` AND grade = $${paramIndex}`;
      params.push(grade);
      paramIndex++;
    }

    const result = await query(
      `SELECT * FROM user_knowledge_mastery ${whereClause} ORDER BY last_practiced_at DESC`,
      params
    );

    return result.rows;
  }

  /**
   * 获取题目统计信息
   */
  async getQuestionStats(knowledgePointId?: string) {
    let whereClause = 'WHERE is_active = true';
    const params: any[] = [];

    if (knowledgePointId) {
      whereClause += ' AND knowledge_point_id = $1';
      params.push(knowledgePointId);
    }

    const result = await query(
      `SELECT
         COUNT(*) as total_questions,
         AVG(difficulty) as avg_difficulty,
         SUM(total_attempts) as total_attempts,
         SUM(correct_attempts) as total_correct,
         CASE
           WHEN SUM(total_attempts) > 0
           THEN (SUM(correct_attempts)::float / SUM(total_attempts)) * 100
           ELSE 0
         END as overall_accuracy
       FROM questions
       ${whereClause}`,
      params
    );

    return result.rows[0];
  }
}

export const learningQuestionService = new LearningQuestionService();
