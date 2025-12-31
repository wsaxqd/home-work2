import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface RecommendationResult {
  works: any[];
  topics: any[];
  templates: any[];
  reason: string;
}

export class RecommendationService {
  /**
   * 获取个性化推荐
   * 基于用户兴趣、行为历史等
   */
  async getPersonalizedRecommendations(userId: string): Promise<RecommendationResult> {
    // 1. 分析用户兴趣
    const userInterests = await this.analyzeUserInterests(userId);

    // 2. 推荐作品
    const works = await this.recommendWorks(userId, userInterests);

    // 3. 推荐话题
    const topics = await this.recommendTopics(userId, userInterests);

    // 4. 推荐模板
    const templates = await this.recommendTemplates(userId, userInterests);

    return {
      works,
      topics,
      templates,
      reason: this.generateRecommendationReason(userInterests),
    };
  }

  /**
   * 分析用户兴趣
   */
  private async analyzeUserInterests(userId: string) {
    // 分析用户创作的作品类型
    const worksResult = await query(
      `SELECT type, COUNT(*) as count
       FROM works
       WHERE user_id = $1
       GROUP BY type
       ORDER BY count DESC
       LIMIT 3`,
      [userId]
    );

    // 分析用户玩的游戏类型
    const gamesResult = await query(
      `SELECT game_type, COUNT(*) as count
       FROM game_progress
       WHERE user_id = $1
       GROUP BY game_type
       ORDER BY count DESC
       LIMIT 3`,
      [userId]
    );

    // 分析用户点赞的作品类型
    const likesResult = await query(
      `SELECT w.type, COUNT(*) as count
       FROM likes l
       JOIN works w ON l.work_id = w.id
       WHERE l.user_id = $1
       GROUP BY w.type
       ORDER BY count DESC
       LIMIT 3`,
      [userId]
    );

    return {
      favoriteWorkTypes: worksResult.rows.map(r => r.type),
      favoriteGameTypes: gamesResult.rows.map(r => r.game_type),
      likedWorkTypes: likesResult.rows.map(r => r.type),
    };
  }

  /**
   * 推荐作品
   */
  private async recommendWorks(userId: string, interests: any) {
    const types = [...new Set([...interests.favoriteWorkTypes, ...interests.likedWorkTypes])];

    let whereClause = 'WHERE w.status = \'published\' AND w.user_id != $1';
    const params: any[] = [userId];

    if (types.length > 0) {
      whereClause += ' AND w.type = ANY($2)';
      params.push(types);
    }

    const result = await query(
      `SELECT w.*, u.nickname, u.avatar,
        (w.like_count * 2 + w.comment_count) as popularity_score
       FROM works w
       JOIN users u ON w.user_id = u.id
       ${whereClause}
       ORDER BY popularity_score DESC, w.created_at DESC
       LIMIT 10`,
      params
    );

    return result.rows;
  }

  /**
   * 推荐话题
   */
  private async recommendTopics(userId: string, interests: any) {
    const result = await query(
      `SELECT * FROM topics
       WHERE status = 'active'
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)
       ORDER BY is_featured DESC, participant_count DESC
       LIMIT 5`
    );

    return result.rows;
  }

  /**
   * 推荐模板
   */
  private async recommendTemplates(userId: string, interests: any) {
    const types = interests.favoriteWorkTypes;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (types.length > 0) {
      whereClause += ' AND type = ANY($1)';
      params.push(types);
    }

    const result = await query(
      `SELECT * FROM creation_templates
       ${whereClause}
       ORDER BY is_featured DESC, usage_count DESC
       LIMIT 5`,
      params
    );

    return result.rows;
  }

  /**
   * 生成推荐理由
   */
  private generateRecommendationReason(interests: any): string {
    const reasons: string[] = [];

    if (interests.favoriteWorkTypes.length > 0) {
      reasons.push(`因为你经常创作${interests.favoriteWorkTypes[0]}作品`);
    }

    if (interests.likedWorkTypes.length > 0) {
      reasons.push(`你喜欢${interests.likedWorkTypes[0]}类型的内容`);
    }

    if (reasons.length === 0) {
      return '为你精选的热门内容';
    }

    return reasons.join('，');
  }

  /**
   * 智能学习路径推荐
   */
  async recommendLearningPath(userId: string) {
    // 获取用户当前学习进度
    const progressResult = await query(
      `SELECT module_id, progress, completed
       FROM learning_progress
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    const completedModules = progressResult.rows.filter(r => r.completed).map(r => r.module_id);
    const inProgressModules = progressResult.rows.filter(r => !r.completed && r.progress > 0);

    // 推荐下一步学习内容
    const nextSteps = [];

    // 1. 继续未完成的模块
    if (inProgressModules.length > 0) {
      nextSteps.push({
        type: 'continue',
        moduleId: inProgressModules[0].module_id,
        progress: inProgressModules[0].progress,
        reason: '继续上次的学习',
      });
    }

    // 2. 推荐新模块（基于难度递进）
    const availableModules = [
      { id: 'ai-intro', difficulty: 1, title: 'AI是什么' },
      { id: 'machine-learning', difficulty: 2, title: '机器学习入门' },
      { id: 'image-recognition', difficulty: 2, title: '图像识别' },
      { id: 'nlp', difficulty: 3, title: '语言理解' },
    ];

    const uncompletedModules = availableModules.filter(
      m => !completedModules.includes(m.id)
    );

    if (uncompletedModules.length > 0) {
      // 推荐难度适中的模块
      const userLevel = Math.floor(completedModules.length / 2) + 1;
      const suitableModule = uncompletedModules.find(m => m.difficulty === userLevel) || uncompletedModules[0];

      nextSteps.push({
        type: 'new',
        moduleId: suitableModule.id,
        title: suitableModule.title,
        difficulty: suitableModule.difficulty,
        reason: '适合你当前水平的新内容',
      });
    }

    return {
      completedCount: completedModules.length,
      inProgressCount: inProgressModules.length,
      nextSteps,
      overallProgress: Math.round((completedModules.length / availableModules.length) * 100),
    };
  }
}

export const recommendationService = new RecommendationService();
