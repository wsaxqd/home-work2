import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

/**
 * 知识图谱服务
 * 负责知识点的查询和图谱关系构建
 */
export class KnowledgeGraphService {
  /**
   * 获取知识图谱
   */
  async getKnowledgeGraph(subject: string, grade: string, userId?: string) {
    // 1. 获取所有知识点
    const kpResult = await query(
      `SELECT * FROM knowledge_graph
       WHERE subject = $1 AND grade = $2
       ORDER BY difficulty_level ASC, id ASC`,
      [subject, grade]
    );

    const knowledgePoints = kpResult.rows;

    // 2. 如果提供了userId，获取用户的掌握情况
    let userMastery: any = {};
    if (userId) {
      const masteryResult = await query(
        `SELECT knowledge_point_id, mastery_level, accuracy_rate
         FROM learning_behavior_analysis
         WHERE user_id = $1`,
        [userId]
      );

      userMastery = masteryResult.rows.reduce((acc: any, row: any) => {
        acc[row.knowledge_point_id] = {
          masteryLevel: row.mastery_level,
          masteryProgress: row.mastery_level / 5,
          accuracyRate: parseFloat(row.accuracy_rate || 0),
        };
        return acc;
      }, {});
    }

    // 3. 构建知识点数据
    const nodes = knowledgePoints.map(kp => ({
      id: kp.knowledge_point_id,
      name: kp.knowledge_point_name,
      description: kp.description,
      difficulty: kp.difficulty_level,
      parent: kp.parent_knowledge_point_id,
      related: kp.related_knowledge_points || [],
      questionCount: kp.question_count,
      tags: kp.tags || [],
      resources: kp.resources || {},
      mastery: userMastery[kp.knowledge_point_id]?.masteryProgress || 0,
      masteryLevel: userMastery[kp.knowledge_point_id]?.masteryLevel || 0,
      accuracyRate: userMastery[kp.knowledge_point_id]?.accuracyRate || 0,
    }));

    // 4. 构建关系边
    const relationships: any[] = [];
    knowledgePoints.forEach(kp => {
      // 前置依赖关系
      if (kp.parent_knowledge_point_id) {
        relationships.push({
          from: kp.parent_knowledge_point_id,
          to: kp.knowledge_point_id,
          type: 'prerequisite',
        });
      }

      // 相关知识点关系
      if (kp.related_knowledge_points && Array.isArray(kp.related_knowledge_points)) {
        kp.related_knowledge_points.forEach((relatedId: string) => {
          relationships.push({
            from: kp.knowledge_point_id,
            to: relatedId,
            type: 'related',
          });
        });
      }
    });

    return {
      subject,
      grade,
      knowledgePoints: nodes,
      relationships,
    };
  }

  /**
   * 获取单个知识点详情
   */
  async getKnowledgePoint(knowledgePointId: string, userId?: string) {
    const result = await query(
      `SELECT * FROM knowledge_graph WHERE knowledge_point_id = $1`,
      [knowledgePointId]
    );

    if (result.rows.length === 0) {
      throw new AppError('知识点不存在', 404);
    }

    const kp = result.rows[0];

    // 获取用户掌握情况
    let userMastery = null;
    if (userId) {
      const masteryResult = await query(
        `SELECT * FROM learning_behavior_analysis
         WHERE user_id = $1 AND knowledge_point_id = $2`,
        [userId, knowledgePointId]
      );

      if (masteryResult.rows.length > 0) {
        const behavior = masteryResult.rows[0];
        userMastery = {
          masteryLevel: behavior.mastery_level,
          accuracyRate: parseFloat(behavior.accuracy_rate),
          totalQuestions: behavior.total_questions,
          correctCount: behavior.correct_count,
          wrongCount: behavior.wrong_count,
          lastPracticeAt: behavior.last_practice_at,
        };
      }
    }

    // 获取前置知识点信息
    let prerequisite = null;
    if (kp.parent_knowledge_point_id) {
      const preResult = await query(
        `SELECT knowledge_point_id, knowledge_point_name FROM knowledge_graph
         WHERE knowledge_point_id = $1`,
        [kp.parent_knowledge_point_id]
      );
      if (preResult.rows.length > 0) {
        prerequisite = {
          id: preResult.rows[0].knowledge_point_id,
          name: preResult.rows[0].knowledge_point_name,
        };
      }
    }

    // 获取后续知识点（依赖当前知识点的）
    const nextResult = await query(
      `SELECT knowledge_point_id, knowledge_point_name, difficulty_level
       FROM knowledge_graph
       WHERE parent_knowledge_point_id = $1`,
      [knowledgePointId]
    );

    const nextKnowledgePoints = nextResult.rows.map(row => ({
      id: row.knowledge_point_id,
      name: row.knowledge_point_name,
      difficulty: row.difficulty_level,
    }));

    // 获取相关知识点信息
    let relatedKnowledgePoints: any[] = [];
    if (kp.related_knowledge_points && Array.isArray(kp.related_knowledge_points) && kp.related_knowledge_points.length > 0) {
      const relatedResult = await query(
        `SELECT knowledge_point_id, knowledge_point_name, difficulty_level
         FROM knowledge_graph
         WHERE knowledge_point_id = ANY($1)`,
        [kp.related_knowledge_points]
      );
      relatedKnowledgePoints = relatedResult.rows.map(row => ({
        id: row.knowledge_point_id,
        name: row.knowledge_point_name,
        difficulty: row.difficulty_level,
      }));
    }

    // 获取题目数量统计（按难度分类）
    const questionStatsResult = await query(
      `SELECT difficulty, COUNT(*) as count
       FROM questions
       WHERE knowledge_point_id = $1
       GROUP BY difficulty
       ORDER BY difficulty`,
      [knowledgePointId]
    );

    const questionStats = {
      total: 0,
      byDifficulty: {} as Record<number, number>
    };

    questionStatsResult.rows.forEach(row => {
      const count = parseInt(row.count);
      questionStats.byDifficulty[row.difficulty] = count;
      questionStats.total += count;
    });

    // 获取用户练习记录统计
    let practiceRecords = null;
    if (userId) {
      const recordsResult = await query(
        `SELECT
           COUNT(*) as total_attempts,
           SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_attempts,
           AVG(answer_time) as avg_answer_time,
           MAX(attempt_date) as last_attempt_date
         FROM question_attempts
         WHERE user_id = $1 AND knowledge_point_id = $2`,
        [userId, knowledgePointId]
      );

      if (recordsResult.rows.length > 0 && recordsResult.rows[0].total_attempts > 0) {
        const record = recordsResult.rows[0];
        practiceRecords = {
          totalAttempts: parseInt(record.total_attempts),
          correctAttempts: parseInt(record.correct_attempts),
          avgAnswerTime: parseFloat(record.avg_answer_time),
          lastAttemptDate: record.last_attempt_date,
          accuracyRate: record.total_attempts > 0
            ? (parseInt(record.correct_attempts) / parseInt(record.total_attempts) * 100).toFixed(1)
            : '0.0'
        };
      }
    }

    return {
      id: kp.knowledge_point_id,
      name: kp.knowledge_point_name,
      description: kp.description,
      subject: kp.subject,
      grade: kp.grade,
      difficulty: kp.difficulty_level,
      tags: kp.tags || [],
      resources: kp.resources || {},
      prerequisite,
      nextKnowledgePoints,
      relatedKnowledgePoints,
      questionStats,
      userMastery,
      practiceRecords,
    };
  }

  /**
   * 获取前置知识点链
   */
  async getPrerequisiteChain(knowledgePointId: string): Promise<string[]> {
    const chain: string[] = [];
    let currentId: string | null = knowledgePointId;

    while (currentId) {
      const result = await query(
        `SELECT parent_knowledge_point_id FROM knowledge_graph
         WHERE knowledge_point_id = $1`,
        [currentId]
      );

      if (result.rows.length === 0 || !result.rows[0].parent_knowledge_point_id) {
        break;
      }

      currentId = result.rows[0].parent_knowledge_point_id;
      chain.unshift(currentId); // 添加到开头
    }

    return chain;
  }

  /**
   * 获取后续知识点树
   */
  async getNextKnowledgeTree(knowledgePointId: string): Promise<any[]> {
    const result = await query(
      `SELECT knowledge_point_id, knowledge_point_name, difficulty_level
       FROM knowledge_graph
       WHERE parent_knowledge_point_id = $1`,
      [knowledgePointId]
    );

    const tree = await Promise.all(
      result.rows.map(async (row) => {
        const children = await this.getNextKnowledgeTree(row.knowledge_point_id);
        return {
          id: row.knowledge_point_id,
          name: row.knowledge_point_name,
          difficulty: row.difficulty_level,
          children,
        };
      })
    );

    return tree;
  }

  /**
   * 检查前置条件是否满足
   */
  async checkPrerequisitesMet(userId: string, knowledgePointId: string): Promise<boolean> {
    const prerequisites = await this.getPrerequisiteChain(knowledgePointId);

    if (prerequisites.length === 0) {
      return true; // 没有前置条件
    }

    // 检查所有前置知识点是否都已掌握（掌握度>=3）
    const result = await query(
      `SELECT knowledge_point_id, mastery_level
       FROM learning_behavior_analysis
       WHERE user_id = $1 AND knowledge_point_id = ANY($2)`,
      [userId, prerequisites]
    );

    const masteryMap = result.rows.reduce((acc: any, row: any) => {
      acc[row.knowledge_point_id] = row.mastery_level;
      return acc;
    }, {});

    // 检查是否所有前置知识点都已掌握
    return prerequisites.every(preId => (masteryMap[preId] || 0) >= 3);
  }

  /**
   * 获取推荐的下一个学习知识点
   */
  async getRecommendedNextKnowledge(userId: string, subject: string, grade: string) {
    // 1. 获取用户已掌握的知识点
    const masteredResult = await query(
      `SELECT lba.knowledge_point_id
       FROM learning_behavior_analysis lba
       JOIN knowledge_graph kg ON lba.knowledge_point_id = kg.knowledge_point_id
       WHERE lba.user_id = $1 AND kg.subject = $2 AND kg.grade = $3 AND lba.mastery_level >= 3`,
      [userId, subject, grade]
    );

    const masteredIds = masteredResult.rows.map(r => r.knowledge_point_id);

    // 2. 获取所有知识点
    const allKnowledgeResult = await query(
      `SELECT * FROM knowledge_graph
       WHERE subject = $1 AND grade = $2
       ORDER BY difficulty_level ASC`,
      [subject, grade]
    );

    // 3. 找到未掌握但前置条件已满足的知识点
    const recommendations = [];
    for (const kp of allKnowledgeResult.rows) {
      // 跳过已掌握的
      if (masteredIds.includes(kp.knowledge_point_id)) {
        continue;
      }

      // 检查前置条件
      if (!kp.parent_knowledge_point_id || masteredIds.includes(kp.parent_knowledge_point_id)) {
        recommendations.push({
          id: kp.knowledge_point_id,
          name: kp.knowledge_point_name,
          difficulty: kp.difficulty_level,
          description: kp.description,
          reason: kp.parent_knowledge_point_id
            ? '前置知识点已掌握，可以学习了'
            : '基础知识点，适合开始学习',
        });
      }
    }

    return recommendations.slice(0, 5); // 返回前5个推荐
  }

  /**
   * 搜索知识点
   */
  async searchKnowledgePoints(keyword: string, subject?: string, grade?: string) {
    let queryText = `
      SELECT * FROM knowledge_graph
      WHERE (knowledge_point_name ILIKE $1 OR description ILIKE $1)
    `;
    const params: any[] = [`%${keyword}%`];

    if (subject) {
      queryText += ' AND subject = $2';
      params.push(subject);
    }

    if (grade) {
      queryText += ` AND grade = $${params.length + 1}`;
      params.push(grade);
    }

    queryText += ' ORDER BY difficulty_level ASC LIMIT 20';

    const result = await query(queryText, params);

    return result.rows.map(kp => ({
      id: kp.knowledge_point_id,
      name: kp.knowledge_point_name,
      description: kp.description,
      subject: kp.subject,
      grade: kp.grade,
      difficulty: kp.difficulty_level,
      tags: kp.tags || [],
    }));
  }
}

export const knowledgeGraphService = new KnowledgeGraphService();
