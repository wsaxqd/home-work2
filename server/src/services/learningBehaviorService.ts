import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

/**
 * 学习行为分析服务
 * 负责记录、分析和计算学习行为数据
 */
export class LearningBehaviorService {
  /**
   * 记录答题行为
   */
  async recordQuestionAttempt(data: {
    userId: string;
    questionId?: number;
    knowledgePointId: string;
    difficultyLevel: number;
    answer: string;
    isCorrect: boolean;
    answerTime: number; // 秒
    hintUsed?: boolean;
    attemptNumber?: number;
  }) {
    const { userId, questionId, knowledgePointId, difficultyLevel, answer, isCorrect, answerTime, hintUsed, attemptNumber } = data;

    // 1. 记录答题记录
    await query(
      `INSERT INTO question_attempts
       (user_id, question_id, knowledge_point_id, difficulty_level, answer, is_correct, answer_time, hint_used, attempt_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, questionId, knowledgePointId, difficultyLevel, answer, isCorrect, answerTime, hintUsed || false, attemptNumber || 1]
    );

    // 2. 更新学习行为分析数据
    await this.updateLearningBehavior(userId, knowledgePointId, isCorrect, answerTime);

    // 3. 计算掌握度
    const masteryLevel = await this.calculateMasteryLevel(userId, knowledgePointId);

    return { masteryLevel };
  }

  /**
   * 更新学习行为分析数据
   */
  private async updateLearningBehavior(userId: string, knowledgePointId: string, isCorrect: boolean, answerTime: number) {
    // 检查是否已存在记录
    const existingResult = await query(
      `SELECT * FROM learning_behavior_analysis
       WHERE user_id = $1 AND knowledge_point_id = $2`,
      [userId, knowledgePointId]
    );

    if (existingResult.rows.length === 0) {
      // 创建新记录
      await query(
        `INSERT INTO learning_behavior_analysis
         (user_id, knowledge_point_id, total_questions, correct_count, wrong_count,
          avg_answer_time, fastest_answer_time, slowest_answer_time,
          consecutive_correct, consecutive_wrong, first_practice_at, last_practice_at, practice_days)
         VALUES ($1, $2, 1, $3, $4, $5, $5, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)`,
        [
          userId,
          knowledgePointId,
          isCorrect ? 1 : 0,
          isCorrect ? 0 : 1,
          answerTime,
          isCorrect ? 1 : 0,
          isCorrect ? 0 : 1
        ]
      );
    } else {
      // 更新现有记录
      const current = existingResult.rows[0];

      // 计算新的平均答题时间
      const newAvgTime = Math.round(
        (current.avg_answer_time * current.total_questions + answerTime) / (current.total_questions + 1)
      );

      // 更新连续答对/答错次数
      const consecutiveCorrect = isCorrect ? current.consecutive_correct + 1 : 0;
      const consecutiveWrong = !isCorrect ? current.consecutive_wrong + 1 : 0;

      // 更新重复错误次数（如果连续答错）
      const repeatedErrors = !isCorrect && current.consecutive_wrong > 0
        ? current.repeated_errors + 1
        : current.repeated_errors;

      // 计算练习天数
      const lastPracticeDate = new Date(current.last_practice_at);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24));
      const practiceDays = daysDiff > 0 ? current.practice_days + 1 : current.practice_days;

      await query(
        `UPDATE learning_behavior_analysis
         SET total_questions = total_questions + 1,
             correct_count = correct_count + $1,
             wrong_count = wrong_count + $2,
             avg_answer_time = $3,
             fastest_answer_time = LEAST(fastest_answer_time, $4),
             slowest_answer_time = GREATEST(slowest_answer_time, $4),
             consecutive_correct = $5,
             consecutive_wrong = $6,
             repeated_errors = $7,
             last_practice_at = CURRENT_TIMESTAMP,
             practice_days = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $9 AND knowledge_point_id = $10`,
        [
          isCorrect ? 1 : 0,
          isCorrect ? 0 : 1,
          newAvgTime,
          answerTime,
          consecutiveCorrect,
          consecutiveWrong,
          repeatedErrors,
          practiceDays,
          userId,
          knowledgePointId
        ]
      );
    }
  }

  /**
   * 计算知识点掌握度 (0-5)
   */
  async calculateMasteryLevel(userId: string, knowledgePointId: string): Promise<number> {
    const result = await query(
      `SELECT * FROM learning_behavior_analysis
       WHERE user_id = $1 AND knowledge_point_id = $2`,
      [userId, knowledgePointId]
    );

    if (result.rows.length === 0) {
      return 0; // 未学习
    }

    const behavior = result.rows[0];

    // 1. 正确率分数 (0-1)
    const accuracyScore = behavior.accuracy_rate / 100;

    // 2. 速度分数 (0-1)
    // 假设期望答题时间为30秒，超过则降低分数
    const expectedTime = 30;
    const speedScore = Math.max(0, 1 - Math.max(0, behavior.avg_answer_time - expectedTime) / expectedTime);

    // 3. 稳定性分数 (0-1)
    // 连续答对5次以上为满分
    const stabilityScore = Math.min(1, behavior.consecutive_correct / 5);

    // 4. 保持性分数 (0-1)
    // 7天内练习过为满分，超过则衰减
    const daysSinceLast = Math.floor(
      (Date.now() - new Date(behavior.last_practice_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const retentionScore = Math.max(0, 1 - daysSinceLast / 7);

    // 5. 练习量分数 (0-1)
    // 至少做10题才能充分评估
    const volumeScore = Math.min(1, behavior.total_questions / 10);

    // 加权计算总分
    const totalScore =
      accuracyScore * 0.35 +      // 正确率权重35%
      speedScore * 0.15 +          // 速度权重15%
      stabilityScore * 0.2 +       // 稳定性权重20%
      retentionScore * 0.15 +      // 保持性权重15%
      volumeScore * 0.15;          // 练习量权重15%

    // 映射到0-5等级
    let masteryLevel: number;
    if (totalScore >= 0.9) {
      masteryLevel = 5; // 精通
    } else if (totalScore >= 0.75) {
      masteryLevel = 4; // 熟练
    } else if (totalScore >= 0.6) {
      masteryLevel = 3; // 掌握
    } else if (totalScore >= 0.4) {
      masteryLevel = 2; // 学习中
    } else if (totalScore >= 0.2) {
      masteryLevel = 1; // 初学
    } else {
      masteryLevel = 0; // 未掌握
    }

    // 更新掌握度
    await query(
      `UPDATE learning_behavior_analysis
       SET mastery_level = $1
       WHERE user_id = $2 AND knowledge_point_id = $3`,
      [masteryLevel, userId, knowledgePointId]
    );

    return masteryLevel;
  }

  /**
   * 获取用户学习行为数据
   */
  async getUserLearningBehavior(userId: string, knowledgePointId?: string) {
    let queryText = `
      SELECT lba.*, kg.knowledge_point_name, kg.subject, kg.grade, kg.difficulty_level as kp_difficulty
      FROM learning_behavior_analysis lba
      LEFT JOIN knowledge_graph kg ON lba.knowledge_point_id = kg.knowledge_point_id
      WHERE lba.user_id = $1
    `;
    const params: any[] = [userId];

    if (knowledgePointId) {
      queryText += ' AND lba.knowledge_point_id = $2';
      params.push(knowledgePointId);
    }

    queryText += ' ORDER BY lba.updated_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * 识别薄弱知识点
   */
  async detectWeakPoints(userId: string, subject?: string, threshold: number = 0.6): Promise<any[]> {
    let queryText = `
      SELECT lba.*, kg.knowledge_point_name, kg.subject, kg.grade, kg.difficulty_level,
             kg.parent_knowledge_point_id, kg.tags
      FROM learning_behavior_analysis lba
      JOIN knowledge_graph kg ON lba.knowledge_point_id = kg.knowledge_point_id
      WHERE lba.user_id = $1
        AND (lba.mastery_level::float / 5) < $2
    `;
    const params: any[] = [userId, threshold];

    if (subject) {
      queryText += ' AND kg.subject = $3';
      params.push(subject);
    }

    queryText += ' ORDER BY lba.mastery_level ASC, lba.accuracy_rate ASC';

    const result = await query(queryText, params);

    // 为每个薄弱点计算严重程度和生成诊断原因
    const weakPoints = result.rows.map(behavior => {
      const severity = this.calculateSeverity(behavior);
      const reason = this.generateDiagnosisReason(behavior);

      return {
        knowledgePointId: behavior.knowledge_point_id,
        knowledgePointName: behavior.knowledge_point_name,
        subject: behavior.subject,
        grade: behavior.grade,
        masteryLevel: behavior.mastery_level,
        accuracyRate: parseFloat(behavior.accuracy_rate),
        totalQuestions: behavior.total_questions,
        correctCount: behavior.correct_count,
        wrongCount: behavior.wrong_count,
        repeatedErrors: behavior.repeated_errors,
        avgAnswerTime: behavior.avg_answer_time,
        lastPracticeAt: behavior.last_practice_at,
        severity,
        reason,
      };
    });

    return weakPoints;
  }

  /**
   * 计算薄弱点严重程度
   */
  private calculateSeverity(behavior: any): string {
    const factors = [];

    // 因素1: 正确率越低越严重
    factors.push((100 - behavior.accuracy_rate) / 100);

    // 因素2: 重复错误次数越多越严重
    factors.push(Math.min(1, behavior.repeated_errors / 5));

    // 因素3: 基础知识点权重更高
    const isFundamental = !behavior.parent_knowledge_point_id ||
                          (behavior.tags && behavior.tags.includes('基础'));
    factors.push(isFundamental ? 1.5 : 1.0);

    // 综合计算
    const avgSeverity = factors.reduce((a, b) => a + b, 0) / factors.length;

    if (avgSeverity >= 0.7) {
      return 'high';
    } else if (avgSeverity >= 0.4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 生成诊断原因
   */
  private generateDiagnosisReason(behavior: any): string {
    const reasons = [];

    if (behavior.consecutive_wrong >= 3) {
      reasons.push(`连续${behavior.consecutive_wrong}次答错`);
    }

    if (behavior.repeated_errors >= 3) {
      reasons.push(`重复错误${behavior.repeated_errors}次`);
    }

    if (behavior.accuracy_rate < 50) {
      reasons.push(`正确率仅${behavior.accuracy_rate.toFixed(1)}%`);
    }

    if (behavior.avg_answer_time > 40) {
      reasons.push(`答题速度偏慢(平均${behavior.avg_answer_time}秒)`);
    }

    const daysSinceLast = Math.floor(
      (Date.now() - new Date(behavior.last_practice_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLast > 7) {
      reasons.push(`${daysSinceLast}天未练习，可能遗忘`);
    }

    if (reasons.length === 0) {
      reasons.push('掌握度低于标准，建议加强练习');
    }

    return reasons.join('；');
  }

  /**
   * 获取学习统计报告
   */
  async getAnalysisReport(userId: string, subject?: string, timeRange: string = 'week') {
    // 计算时间范围
    let startDate = new Date();
    if (timeRange === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate = new Date(0); // 全部
    }

    // 获取时间范围内的答题记录
    let queryText = `
      SELECT qa.*, kg.knowledge_point_name, kg.subject
      FROM question_attempts qa
      LEFT JOIN knowledge_graph kg ON qa.knowledge_point_id = kg.knowledge_point_id
      WHERE qa.user_id = $1 AND qa.created_at >= $2
    `;
    const params: any[] = [userId, startDate];

    if (subject) {
      queryText += ' AND kg.subject = $3';
      params.push(subject);
    }

    const attemptsResult = await query(queryText, params);
    const attempts = attemptsResult.rows;

    // 计算统计数据
    const totalQuestions = attempts.length;
    const correctCount = attempts.filter(a => a.is_correct).length;
    const accuracyRate = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const totalStudyTime = attempts.reduce((sum, a) => sum + (a.answer_time || 0), 0) / 60; // 分钟
    const averageAnswerTime = totalQuestions > 0 ? attempts.reduce((sum, a) => sum + (a.answer_time || 0), 0) / totalQuestions : 0;

    // 获取知识点掌握情况
    const knowledgeMasteryResult = await query(
      `SELECT lba.*, kg.knowledge_point_name
       FROM learning_behavior_analysis lba
       JOIN knowledge_graph kg ON lba.knowledge_point_id = kg.knowledge_point_id
       WHERE lba.user_id = $1 ${subject ? 'AND kg.subject = $2' : ''}
       ORDER BY lba.mastery_level DESC`,
      subject ? [userId, subject] : [userId]
    );

    const knowledgePointsCovered = knowledgeMasteryResult.rows.length;
    const knowledgePointsMastered = knowledgeMasteryResult.rows.filter(k => k.mastery_level >= 3).length;

    // 生成学习趋势数据（每天的正确率）
    const trendData = this.generateLearningTrend(attempts, timeRange);

    return {
      period: `${startDate.toISOString().split('T')[0]} ~ ${new Date().toISOString().split('T')[0]}`,
      summary: {
        totalStudyTime: Math.round(totalStudyTime),
        totalQuestions,
        correctCount,
        accuracyRate: parseFloat(accuracyRate.toFixed(1)),
        knowledgePointsCovered,
        knowledgePointsMastered,
        averageAnswerTime: Math.round(averageAnswerTime),
      },
      knowledgeMastery: knowledgeMasteryResult.rows.map(k => ({
        knowledgePointId: k.knowledge_point_id,
        knowledgePointName: k.knowledge_point_name,
        masteryLevel: k.mastery_level,
        masteryProgress: k.mastery_level / 5,
        accuracyRate: parseFloat(k.accuracy_rate),
        status: 'stable', // TODO: 计算趋势
      })),
      learningTrend: trendData,
    };
  }

  /**
   * 生成学习趋势数据
   */
  private generateLearningTrend(attempts: any[], timeRange: string) {
    const days = timeRange === 'week' ? 7 : 30;
    const dates: string[] = [];
    const accuracyRates: number[] = [];
    const studyTimes: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);

      // 计算当天的答题情况
      const dayAttempts = attempts.filter(a => {
        const attemptDate = new Date(a.created_at).toISOString().split('T')[0];
        return attemptDate === dateStr;
      });

      if (dayAttempts.length > 0) {
        const dayCorrect = dayAttempts.filter(a => a.is_correct).length;
        const dayAccuracy = (dayCorrect / dayAttempts.length) * 100;
        accuracyRates.push(Math.round(dayAccuracy));

        const dayTime = dayAttempts.reduce((sum, a) => sum + (a.answer_time || 0), 0) / 60;
        studyTimes.push(Math.round(dayTime));
      } else {
        accuracyRates.push(0);
        studyTimes.push(0);
      }
    }

    return { dates, accuracyRates, studyTimes };
  }
}

export const learningBehaviorService = new LearningBehaviorService();
