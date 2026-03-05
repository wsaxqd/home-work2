import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import { knowledgeGraphService } from './knowledgeGraphService';
import { learningBehaviorService } from './learningBehaviorService';

/**
 * 学习路径生成服务
 * 负责生成个性化学习路径和自适应推荐
 */
export class AdaptiveLearningService {
  /**
   * 生成个性化学习路径
   */
  async generateLearningPath(data: {
    userId: string;
    subject: string;
    grade: string;
    goal: 'improve_weak_points' | 'review_all' | 'advance_learning';
    timeConstraint?: number; // 天数
    dailyTimeLimit?: number; // 每日学习时长(分钟)
  }) {
    const { userId, subject, grade, goal, timeConstraint = 30, dailyTimeLimit = 30 } = data;

    // 1. 获取知识图谱
    const knowledgeGraph = await knowledgeGraphService.getKnowledgeGraph(subject, grade, userId);

    // 2. 获取用户学习行为数据
    const behaviors = await learningBehaviorService.getUserLearningBehavior(userId);

    // 3. 根据目标选择知识点
    let targetKnowledgePoints: any[] = [];

    if (goal === 'improve_weak_points') {
      // 薄弱点优先
      const weakPoints = await learningBehaviorService.detectWeakPoints(userId, subject);
      targetKnowledgePoints = weakPoints.map(wp => {
        const kp = knowledgeGraph.knowledgePoints.find(k => k.id === wp.knowledgePointId);
        return { ...kp, reason: '薄弱知识点强化', priority: 'high' };
      });
    } else if (goal === 'review_all') {
      // 所有已学知识点
      const learnedIds = behaviors.map(b => b.knowledge_point_id);
      targetKnowledgePoints = knowledgeGraph.knowledgePoints
        .filter(kp => learnedIds.includes(kp.id))
        .map(kp => ({ ...kp, reason: '复习巩固', priority: 'medium' }));
    } else if (goal === 'advance_learning') {
      // 新知识点
      const learnedIds = behaviors
        .filter(b => b.mastery_level >= 3)
        .map(b => b.knowledge_point_id);
      targetKnowledgePoints = knowledgeGraph.knowledgePoints
        .filter(kp => !learnedIds.includes(kp.id))
        .map(kp => ({ ...kp, reason: '新知识学习', priority: 'medium' }));
    }

    // 4. 拓扑排序 (确保前置知识点先学)
    const sortedPoints = this.topologicalSort(targetKnowledgePoints, knowledgeGraph);

    // 5. 为每个知识点分配学习资源和时间
    const learningSteps: any[] = [];
    let totalMinutes = 0;

    for (const point of sortedPoints) {
      const behavior = behaviors.find(b => b.knowledge_point_id === point.id);
      const masteryLevel = behavior?.mastery_level || 0;

      // 根据掌握度决定学习时长和资源
      let estimatedMinutes: number;
      let resources: any;
      let stepReason: string;

      if (masteryLevel === 0) {
        // 未学习
        estimatedMinutes = 40;
        resources = await this.getFullResources(point);
        stepReason = '新知识点学习';
      } else if (masteryLevel <= 2) {
        // 薄弱
        estimatedMinutes = 30;
        resources = await this.getPracticeResources(point);
        stepReason = '薄弱点强化练习';
      } else {
        // 复习
        estimatedMinutes = 15;
        resources = await this.getReviewResources(point);
        stepReason = '复习巩固';
      }

      learningSteps.push({
        stepNumber: learningSteps.length + 1,
        knowledgePointId: point.id,
        knowledgePointName: point.name,
        reason: stepReason,
        resources,
        estimatedMinutes,
        difficulty: point.difficulty,
      });

      totalMinutes += estimatedMinutes;

      // 检查时间约束
      const estimatedDays = Math.ceil(totalMinutes / dailyTimeLimit);
      if (estimatedDays > timeConstraint) {
        break;
      }
    }

    // 6. 保存学习路径到数据库
    const pathName = this.generatePathName(goal, subject, learningSteps.length);
    const pathResult = await query(
      `INSERT INTO learning_paths
       (user_id, path_name, subject, grade, knowledge_points, current_step, total_steps, estimated_days, status, created_at, started_at)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [
        userId,
        pathName,
        subject,
        grade,
        JSON.stringify(learningSteps.map(s => s.knowledgePointId)),
        learningSteps.length,
        Math.ceil(totalMinutes / dailyTimeLimit)
      ]
    );

    const pathId = pathResult.rows[0].id;

    return {
      pathId,
      pathName,
      subject,
      grade,
      totalSteps: learningSteps.length,
      estimatedDays: Math.ceil(totalMinutes / dailyTimeLimit),
      totalMinutes,
      steps: learningSteps,
    };
  }

  /**
   * 拓扑排序 - 确保前置知识点先学
   */
  private topologicalSort(knowledgePoints: any[], knowledgeGraph: any): any[] {
    // 构建依赖关系
    const inDegree: Map<string, number> = new Map();
    const adjList: Map<string, string[]> = new Map();
    const kpMap: Map<string, any> = new Map();

    // 初始化
    knowledgePoints.forEach(kp => {
      kpMap.set(kp.id, kp);
      inDegree.set(kp.id, 0);
      adjList.set(kp.id, []);
    });

    // 构建图
    knowledgePoints.forEach(kp => {
      if (kp.parent && kpMap.has(kp.parent)) {
        const degree = inDegree.get(kp.id) || 0;
        inDegree.set(kp.id, degree + 1);

        const neighbors = adjList.get(kp.parent) || [];
        neighbors.push(kp.id);
        adjList.set(kp.parent, neighbors);
      }
    });

    // Kahn算法
    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) {
        queue.push(id);
      }
    });

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      const neighbors = adjList.get(current) || [];
      neighbors.forEach(neighbor => {
        const degree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, degree);
        if (degree === 0) {
          queue.push(neighbor);
        }
      });
    }

    // 映射回知识点对象
    return sorted.map(id => kpMap.get(id)!).filter(kp => kp);
  }

  /**
   * 获取完整学习资源（新知识点）
   */
  private async getFullResources(knowledgePoint: any) {
    const resources = knowledgePoint.resources || {};
    return {
      videos: resources.videos || [],
      articles: resources.articles || [],
      games: resources.games || [],
      questions: await this.generateQuestionIds(knowledgePoint.id, 8, knowledgePoint.difficulty),
    };
  }

  /**
   * 获取练习资源（薄弱点）
   */
  private async getPracticeResources(knowledgePoint: any) {
    return {
      videos: (knowledgePoint.resources?.videos || []).slice(0, 1), // 只推荐一个视频
      questions: await this.generateQuestionIds(knowledgePoint.id, 10, knowledgePoint.difficulty),
      games: knowledgePoint.resources?.games || [],
    };
  }

  /**
   * 获取复习资源
   */
  private async getReviewResources(knowledgePoint: any) {
    return {
      questions: await this.generateQuestionIds(knowledgePoint.id, 5),
    };
  }

  /**
   * 获取进阶学习资源
   */
  private async getAdvanceResources(knowledgePoint: any) {
    return {
      videos: (knowledgePoint.resources?.videos || []).slice(0, 2), // 推荐两个视频
      questions: await this.generateQuestionIds(knowledgePoint.id, 8, knowledgePoint.difficulty),
      articles: knowledgePoint.resources?.articles || [],
    };
  }

  /**
   * 从数据库查询题目ID列表
   * @param knowledgePointId 知识点ID
   * @param count 需要的题目数量
   * @param difficulty 难度等级（可选，1-5）
   * @param excludeIds 排除的题目ID（可选）
   */
  private async generateQuestionIds(
    knowledgePointId: string,
    count: number,
    difficulty?: number,
    excludeIds: number[] = []
  ): Promise<number[]> {
    try {
      // 构建查询条件
      let whereClause = 'WHERE knowledge_point_id = $1 AND is_active = true';
      const params: any[] = [knowledgePointId];
      let paramIndex = 2;

      // 添加难度筛选
      if (difficulty) {
        whereClause += ` AND difficulty = $${paramIndex}`;
        params.push(difficulty);
        paramIndex++;
      }

      // 排除已做过的题目
      if (excludeIds.length > 0) {
        whereClause += ` AND id NOT IN (${excludeIds.join(',')})`;
      }

      // 查询题目，优先选择正确率较低的题目（更有练习价值）
      const result = await query(
        `SELECT id FROM questions
         ${whereClause}
         ORDER BY
           CASE
             WHEN total_attempts > 0 THEN (correct_attempts::float / total_attempts)
             ELSE 0.5
           END ASC,
           RANDOM()
         LIMIT $${paramIndex}`,
        [...params, count]
      );

      // 如果查询到的题目不足，尝试放宽条件
      if (result.rows.length < count) {
        console.warn(
          `知识点 ${knowledgePointId} 的题目不足，需要 ${count} 道，实际找到 ${result.rows.length} 道`
        );

        // 如果设置了难度，尝试不限难度再查询
        if (difficulty && result.rows.length < count) {
          const additionalResult = await query(
            `SELECT id FROM questions
             WHERE knowledge_point_id = $1
               AND is_active = true
               AND id NOT IN (${result.rows.map((r: any) => r.id).join(',') || '0'})
               ${excludeIds.length > 0 ? `AND id NOT IN (${excludeIds.join(',')})` : ''}
             ORDER BY RANDOM()
             LIMIT $2`,
            [knowledgePointId, count - result.rows.length]
          );

          result.rows.push(...additionalResult.rows);
        }
      }

      return result.rows.map((row: any) => row.id);
    } catch (error: any) {
      console.error('查询题目失败:', error);
      // 如果查询失败，返回空数组而不是抛出错误
      return [];
    }
  }

  /**
   * 生成路径名称
   */
  private generatePathName(goal: string, subject: string, stepCount: number): string {
    const subjectNames: any = {
      math: '数学',
      chinese: '语文',
      english: '英语',
    };

    const goalNames: any = {
      improve_weak_points: '薄弱点强化',
      review_all: '全面复习',
      advance_learning: '进阶学习',
    };

    return `${subjectNames[subject] || subject}${goalNames[goal] || goal}路径（${stepCount}步）`;
  }

  /**
   * 获取用户学习路径
   */
  async getUserLearningPath(userId: string, pathId: number) {
    const result = await query(
      `SELECT * FROM learning_paths WHERE id = $1 AND user_id = $2`,
      [pathId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('学习路径不存在', 404);
    }

    const path = result.rows[0];

    // 获取详细步骤信息
    const knowledgePointIds = path.knowledge_points;
    const steps: any[] = [];

    for (let i = 0; i < knowledgePointIds.length; i++) {
      const kpId = knowledgePointIds[i];
      const kp = await knowledgeGraphService.getKnowledgePoint(kpId, userId);

      steps.push({
        stepNumber: i + 1,
        knowledgePointId: kpId,
        knowledgePointName: kp.name,
        status: i < path.current_step ? 'completed' : i === path.current_step ? 'in_progress' : 'locked',
        userMastery: kp.userMastery,
      });
    }

    return {
      pathId: path.id,
      pathName: path.path_name,
      subject: path.subject,
      grade: path.grade,
      currentStep: path.current_step,
      totalSteps: path.total_steps,
      progress: path.progress,
      status: path.status,
      estimatedDays: path.estimated_days,
      steps,
    };
  }

  /**
   * 更新学习路径进度
   */
  async updatePathProgress(userId: string, pathId: number, completedStep: number) {
    await query(
      `UPDATE learning_paths
       SET current_step = $1,
           progress = ROUND(($1::float / total_steps) * 100),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3`,
      [completedStep, pathId, userId]
    );

    // 检查是否完成
    const pathResult = await query(
      `SELECT * FROM learning_paths WHERE id = $1`,
      [pathId]
    );

    if (pathResult.rows[0].current_step >= pathResult.rows[0].total_steps) {
      await query(
        `UPDATE learning_paths
         SET status = 'completed', completed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [pathId]
      );
    }
  }

  /**
   * 自适应难度调整
   */
  async adjustDifficulty(userId: string, knowledgePointId: string, currentDifficulty: number) {
    // 获取最近5次答题记录
    const result = await query(
      `SELECT * FROM question_attempts
       WHERE user_id = $1 AND knowledge_point_id = $2
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId, knowledgePointId]
    );

    const recentAttempts = result.rows;

    if (recentAttempts.length === 0) {
      return { newDifficulty: currentDifficulty, reason: '保持当前难度' };
    }

    // 计算连续答对/答错次数
    let consecutiveCorrect = 0;
    let consecutiveWrong = 0;

    for (const attempt of recentAttempts.reverse()) {
      if (attempt.is_correct) {
        consecutiveCorrect++;
        consecutiveWrong = 0;
      } else {
        consecutiveWrong++;
        consecutiveCorrect = 0;
      }
    }

    let newDifficulty = currentDifficulty;
    let reason = '保持当前难度，继续练习';

    // 决策规则
    if (consecutiveCorrect >= 3) {
      // 连续3次答对 → 提升难度
      newDifficulty = Math.min(5, currentDifficulty + 1);
      reason = '表现优秀，尝试更难的题目';
    } else if (consecutiveWrong >= 2) {
      // 连续2次答错 → 降低难度
      newDifficulty = Math.max(1, currentDifficulty - 1);
      reason = '题目有点难，先练习简单的';
    }

    // 考虑答题速度
    if (recentAttempts.length >= 3) {
      const avgTime = recentAttempts.reduce((sum, a) => sum + (a.answer_time || 0), 0) / recentAttempts.length;
      const expectedTime = 30; // 期望答题时间30秒

      if (avgTime < expectedTime * 0.5 && consecutiveCorrect >= 2) {
        // 答题又快又对 → 难度再提升
        newDifficulty = Math.min(5, newDifficulty + 1);
        reason = '你太厉害了！挑战更高难度吧';
      }
    }

    // 边界检查：初学者不做太难的题
    const behavior = await query(
      `SELECT mastery_level FROM learning_behavior_analysis
       WHERE user_id = $1 AND knowledge_point_id = $2`,
      [userId, knowledgePointId]
    );

    if (behavior.rows.length > 0 && behavior.rows[0].mastery_level <= 1 && newDifficulty > 2) {
      newDifficulty = 2;
      reason = '先打好基础再挑战难题';
    }

    return {
      newDifficulty,
      reason,
      change: newDifficulty - currentDifficulty,
    };
  }

  /**
   * 创建自适应推荐
   */
  async createRecommendation(data: {
    userId: string;
    type: 'weak_point' | 'review' | 'advance';
    knowledgePointId: string;
    reason: string;
    priority: number;
    resources?: any;
  }) {
    const { userId, type, knowledgePointId, reason, priority, resources } = data;

    const result = await query(
      `INSERT INTO adaptive_recommendations
       (user_id, recommendation_type, knowledge_point_id, reason, priority, recommended_resources, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id`,
      [userId, type, knowledgePointId, reason, priority, JSON.stringify(resources || {})]
    );

    return result.rows[0].id;
  }

  /**
   * 获取用户推荐列表
   */
  async getRecommendations(userId: string, limit: number = 5) {
    const result = await query(
      `SELECT ar.*, kg.knowledge_point_name, kg.subject, kg.grade
       FROM adaptive_recommendations ar
       JOIN knowledge_graph kg ON ar.knowledge_point_id = kg.knowledge_point_id
       WHERE ar.user_id = $1 AND ar.status = 'pending'
       ORDER BY ar.priority DESC, ar.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(rec => ({
      id: rec.id,
      type: rec.recommendation_type,
      priority: rec.priority,
      knowledgePointId: rec.knowledge_point_id,
      knowledgePointName: rec.knowledge_point_name,
      subject: rec.subject,
      grade: rec.grade,
      reason: rec.reason,
      resources: rec.recommended_resources,
      status: rec.status,
      createdAt: rec.created_at,
    }));
  }

  /**
   * 生成智能推荐（混合推荐算法）
   */
  async generateSmartRecommendations(userId: string, limit: number = 5) {
    const recommendations: any[] = [];

    // 1. 薄弱点推荐（最高优先级）
    const weakPoints = await learningBehaviorService.detectWeakPoints(userId);
    for (const wp of weakPoints.slice(0, 2)) {
      const kp = await knowledgeGraphService.getKnowledgePoint(wp.knowledgePointId, userId);
      recommendations.push({
        type: 'weak_point',
        priority: 9,
        knowledgePointId: wp.knowledgePointId,
        knowledgePointName: wp.knowledgePointName,
        subject: wp.subject,
        grade: wp.grade,
        reason: `薄弱点：${wp.reason}`,
        resources: this.getPracticeResources(kp),
        estimatedMinutes: 30,
      });
    }

    // 2. 复习提醒（基于艾宾浩斯遗忘曲线）
    const behaviors = await learningBehaviorService.getUserLearningBehavior(userId);
    for (const behavior of behaviors) {
      if (behavior.mastery_level >= 3) {
        const daysSinceLast = Math.floor(
          (Date.now() - new Date(behavior.last_practice_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        // 1天、3天、7天、15天复习
        if ([1, 3, 7, 15].includes(daysSinceLast)) {
          const kp = await knowledgeGraphService.getKnowledgePoint(behavior.knowledge_point_id, userId);
          recommendations.push({
            type: 'review',
            priority: 7 - Math.floor(daysSinceLast / 2),
            knowledgePointId: behavior.knowledge_point_id,
            knowledgePointName: behavior.knowledge_point_name,
            subject: behavior.subject,
            grade: behavior.grade,
            reason: `已${daysSinceLast}天未练习，建议复习巩固`,
            resources: this.getReviewResources(kp),
            estimatedMinutes: 15,
          });
        }
      }
    }

    // 3. 进阶学习推荐（基于知识图谱）
    const masteredPoints = behaviors.filter(b => b.mastery_level >= 4);
    for (const behavior of masteredPoints.slice(0, 3)) {
      // 获取当前知识点的详细信息
      const kp = await knowledgeGraphService.getKnowledgePoint(behavior.knowledge_point_id, userId);

      // 推荐后续知识点（依赖当前知识点的）
      if (kp.nextKnowledgePoints && kp.nextKnowledgePoints.length > 0) {
        for (const nextKp of kp.nextKnowledgePoints.slice(0, 2)) {
          // 检查用户是否已经掌握
          const existingBehavior = behaviors.find(b => b.knowledge_point_id === nextKp.id);
          if (!existingBehavior || existingBehavior.mastery_level < 3) {
            recommendations.push({
              type: 'advance',
              priority: 5 + nextKp.difficulty,
              knowledgePointId: nextKp.id,
              knowledgePointName: nextKp.name,
              subject: behavior.subject,
              grade: behavior.grade,
              reason: `已掌握前置知识点"${behavior.knowledge_point_name}"，可以学习进阶内容`,
              resources: this.getAdvanceResources(nextKp),
              estimatedMinutes: 25,
            });
          }
        }
      }

      // 推荐相关知识点（横向扩展）
      if (kp.relatedKnowledgePoints && kp.relatedKnowledgePoints.length > 0) {
        for (const relatedKp of kp.relatedKnowledgePoints.slice(0, 1)) {
          const existingBehavior = behaviors.find(b => b.knowledge_point_id === relatedKp.id);
          if (!existingBehavior || existingBehavior.mastery_level < 3) {
            recommendations.push({
              type: 'advance',
              priority: 4,
              knowledgePointId: relatedKp.id,
              knowledgePointName: relatedKp.name,
              subject: behavior.subject,
              grade: behavior.grade,
              reason: `与已掌握的"${behavior.knowledge_point_name}"相关，建议拓展学习`,
              resources: this.getAdvanceResources(relatedKp),
              estimatedMinutes: 20,
            });
          }
        }
      }
    }

    // 排序和去重
    recommendations.sort((a, b) => b.priority - a.priority);

    // 去重
    const seen = new Set<string>();
    const uniqueRecommendations = recommendations.filter(rec => {
      if (seen.has(rec.knowledgePointId)) {
        return false;
      }
      seen.add(rec.knowledgePointId);
      return true;
    });

    return uniqueRecommendations.slice(0, limit);
  }
}

export const adaptiveLearningService = new AdaptiveLearningService();
