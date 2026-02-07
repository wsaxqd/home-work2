import { query } from '../config/database';

// 用户画像接口
export interface UserProfile {
  userId: string;
  age?: number;
  grade?: number;
  interests: string[];
  learningStyle: string; // visual, auditory, kinesthetic
  skillLevels: Record<string, number>; // subject -> level (1-5)
  activeTime: string[]; // 活跃时间段
  preferredContentTypes: string[];
  recentBehaviors: UserBehavior[];
}

// 用户行为接口
export interface UserBehavior {
  type: 'view' | 'like' | 'comment' | 'create' | 'complete' | 'share';
  contentType: string;
  contentId: string;
  timestamp: Date;
  duration?: number; // 停留时长(秒)
  score?: number; // 评分
}

// 内容特征接口
export interface ContentFeature {
  id: string;
  type: string;
  category: string;
  tags: string[];
  difficulty: number; // 1-5
  popularity: number; // 热度分数
  quality: number; // 质量分数
  ageGroup: string; // 适合年龄段
  subject: string; // 学科
}

// 推荐结果接口
export interface RecommendationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  thumbnail?: string;
  score: number; // 推荐分数
  reason: string; // 推荐理由
  tags: string[];
}

export class EnhancedRecommendationService {
  // 权重配置
  private readonly WEIGHTS = {
    userInterest: 0.3, // 用户兴趣匹配
    contentQuality: 0.25, // 内容质量
    popularity: 0.15, // 热度
    novelty: 0.15, // 新颖性
    diversity: 0.15 // 多样性
  };

  /**
   * 构建用户画像
   */
  async buildUserProfile(userId: string): Promise<UserProfile> {
    // 获取用户基本信息
    const userResult = await query(
      'SELECT age, grade FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0] || {};

    // 分析用户兴趣(基于创作和互动)
    const interestsResult = await query(`
      SELECT UNNEST(tags) as tag, COUNT(*) as count
      FROM (
        SELECT tags FROM works WHERE user_id = $1
        UNION ALL
        SELECT w.tags FROM likes l
        JOIN works w ON l.work_id = w.id
        WHERE l.user_id = $1
      ) combined
      WHERE tags IS NOT NULL
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 10
    `, [userId]);

    const interests = interestsResult.rows.map(r => r.tag);

    // 分析学习风格(基于偏好的内容类型)
    const styleResult = await query(`
      SELECT type, COUNT(*) as count
      FROM works
      WHERE user_id = $1
      GROUP BY type
      ORDER BY count DESC
      LIMIT 1
    `, [userId]);

    const learningStyle = this.inferLearningStyle(styleResult.rows[0]?.type);

    // 分析技能水平
    const skillLevels = await this.analyzeSkillLevels(userId);

    // 分析活跃时间
    const activeTime = await this.analyzeActiveTime(userId);

    // 分析偏好的内容类型
    const preferredTypes = await this.analyzePreferredContentTypes(userId);

    // 获取最近行为
    const recentBehaviors = await this.getRecentBehaviors(userId, 50);

    return {
      userId,
      age: user.age,
      grade: user.grade,
      interests,
      learningStyle,
      skillLevels,
      activeTime,
      preferredContentTypes: preferredTypes,
      recentBehaviors
    };
  }

  /**
   * 推断学习风格
   */
  private inferLearningStyle(preferredType?: string): string {
    const styleMap: Record<string, string> = {
      'art': 'visual',
      'music': 'auditory',
      'story': 'visual',
      'game': 'kinesthetic'
    };
    return styleMap[preferredType || ''] || 'visual';
  }

  /**
   * 分析技能水平
   */
  private async analyzeSkillLevels(userId: string): Promise<Record<string, number>> {
    const result = await query(`
      SELECT subject, AVG(score) as avg_score, COUNT(*) as attempt_count
      FROM (
        SELECT 'math' as subject, score FROM game_scores WHERE user_id = $1 AND game_type LIKE '%math%'
        UNION ALL
        SELECT 'chinese' as subject, score FROM game_scores WHERE user_id = $1 AND game_type LIKE '%chinese%'
        UNION ALL
        SELECT 'english' as subject, score FROM game_scores WHERE user_id = $1 AND game_type LIKE '%english%'
      ) scores
      GROUP BY subject
    `, [userId]);

    const skillLevels: Record<string, number> = {};
    result.rows.forEach(row => {
      // 根据平均分和尝试次数计算技能等级(1-5)
      const avgScore = parseFloat(row.avg_score) || 0;
      const attemptCount = parseInt(row.attempt_count) || 0;
      const level = Math.min(5, Math.floor((avgScore / 20) + (attemptCount / 10)));
      skillLevels[row.subject] = Math.max(1, level);
    });

    return skillLevels;
  }

  /**
   * 分析活跃时间
   */
  private async analyzeActiveTime(userId: string): Promise<string[]> {
    const result = await query(`
      SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
      FROM (
        SELECT created_at FROM works WHERE user_id = $1
        UNION ALL
        SELECT created_at FROM game_scores WHERE user_id = $1
      ) activities
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 3
    `, [userId]);

    return result.rows.map(r => {
      const hour = parseInt(r.hour);
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 18) return 'afternoon';
      if (hour >= 18 && hour < 22) return 'evening';
      return 'night';
    });
  }

  /**
   * 分析偏好的内容类型
   */
  private async analyzePreferredContentTypes(userId: string): Promise<string[]> {
    const result = await query(`
      SELECT type, COUNT(*) as count
      FROM (
        SELECT type FROM works WHERE user_id = $1
        UNION ALL
        SELECT w.type FROM likes l
        JOIN works w ON l.work_id = w.id
        WHERE l.user_id = $1
      ) combined
      GROUP BY type
      ORDER BY count DESC
      LIMIT 5
    `, [userId]);

    return result.rows.map(r => r.type);
  }

  /**
   * 获取最近行为
   */
  private async getRecentBehaviors(userId: string, limit: number): Promise<UserBehavior[]> {
    const result = await query(`
      SELECT 'view' as type, 'work' as content_type, work_id as content_id, created_at as timestamp
      FROM work_views WHERE user_id = $1
      UNION ALL
      SELECT 'like' as type, 'work' as content_type, work_id as content_id, created_at as timestamp
      FROM likes WHERE user_id = $1
      UNION ALL
      SELECT 'create' as type, type as content_type, id as content_id, created_at as timestamp
      FROM works WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows.map(row => ({
      type: row.type as any,
      contentType: row.content_type,
      contentId: row.content_id,
      timestamp: row.timestamp
    }));
  }

  /**
   * 协同过滤推荐
   */
  async collaborativeFiltering(userId: string, limit: number = 10): Promise<RecommendationItem[]> {
    // 找到相似用户(基于共同点赞的作品)
    const similarUsersResult = await query(`
      SELECT l2.user_id, COUNT(*) as common_likes
      FROM likes l1
      JOIN likes l2 ON l1.work_id = l2.work_id
      WHERE l1.user_id = $1 AND l2.user_id != $1
      GROUP BY l2.user_id
      ORDER BY common_likes DESC
      LIMIT 10
    `, [userId]);

    if (similarUsersResult.rows.length === 0) {
      return [];
    }

    const similarUserIds = similarUsersResult.rows.map(r => r.user_id);

    // 获取相似用户喜欢但当前用户未点赞的作品
    const recommendationsResult = await query(`
      SELECT w.*, u.nickname, u.avatar,
        COUNT(DISTINCT l.user_id) as like_count_from_similar
      FROM works w
      JOIN users u ON w.user_id = u.id
      JOIN likes l ON w.id = l.work_id
      WHERE l.user_id = ANY($1)
        AND w.status = 'published'
        AND NOT EXISTS (
          SELECT 1 FROM likes WHERE user_id = $2 AND work_id = w.id
        )
      GROUP BY w.id, u.nickname, u.avatar
      ORDER BY like_count_from_similar DESC
      LIMIT $3
    `, [similarUserIds, userId, limit]);

    return recommendationsResult.rows.map(work => ({
      id: work.id,
      type: work.type,
      title: work.title,
      description: work.description,
      thumbnail: work.thumbnail,
      score: work.like_count_from_similar * 10,
      reason: '和你兴趣相似的用户都喜欢',
      tags: work.tags || []
    }));
  }

  /**
   * 基于内容的推荐
   */
  async contentBasedRecommendation(
    userProfile: UserProfile,
    limit: number = 10
  ): Promise<RecommendationItem[]> {
    // 构建查询条件
    const interests = userProfile.interests.slice(0, 5);
    const preferredTypes = userProfile.preferredContentTypes.slice(0, 3);

    const result = await query(`
      SELECT w.*, u.nickname, u.avatar,
        (
          CASE WHEN w.tags && $1 THEN 5 ELSE 0 END +
          CASE WHEN w.type = ANY($2) THEN 3 ELSE 0 END +
          (w.like_count * 0.1) +
          (w.view_count * 0.01)
        ) as relevance_score
      FROM works w
      JOIN users u ON w.user_id = u.id
      WHERE w.status = 'published'
        AND w.user_id != $3
        AND (w.tags && $1 OR w.type = ANY($2))
      ORDER BY relevance_score DESC
      LIMIT $4
    `, [interests, preferredTypes, userProfile.userId, limit]);

    return result.rows.map(work => ({
      id: work.id,
      type: work.type,
      title: work.title,
      description: work.description,
      thumbnail: work.thumbnail,
      score: work.relevance_score,
      reason: this.generateContentBasedReason(work, userProfile),
      tags: work.tags || []
    }));
  }

  /**
   * 生成基于内容的推荐理由
   */
  private generateContentBasedReason(work: any, profile: UserProfile): string {
    const matchedInterests = work.tags?.filter((tag: string) =>
      profile.interests.includes(tag)
    ) || [];

    if (matchedInterests.length > 0) {
      return `因为你对${matchedInterests[0]}感兴趣`;
    }

    if (profile.preferredContentTypes.includes(work.type)) {
      return `你喜欢的${work.type}类型`;
    }

    return '为你推荐的优质内容';
  }

  /**
   * 混合推荐算法
   */
  async hybridRecommendation(userId: string, limit: number = 20): Promise<RecommendationItem[]> {
    // 构建用户画像
    const userProfile = await this.buildUserProfile(userId);

    // 获取多种推荐结果
    const [collaborative, contentBased, trending] = await Promise.all([
      this.collaborativeFiltering(userId, Math.floor(limit * 0.4)),
      this.contentBasedRecommendation(userProfile, Math.floor(limit * 0.4)),
      this.getTrendingContent(Math.floor(limit * 0.2))
    ]);

    // 合并并去重
    const allRecommendations = [...collaborative, ...contentBased, ...trending];
    const uniqueRecommendations = this.deduplicateRecommendations(allRecommendations);

    // 重新排序(考虑多样性)
    const diverseRecommendations = this.ensureDiversity(uniqueRecommendations);

    return diverseRecommendations.slice(0, limit);
  }

  /**
   * 获取热门内容
   */
  private async getTrendingContent(limit: number): Promise<RecommendationItem[]> {
    const result = await query(`
      SELECT w.*, u.nickname, u.avatar,
        (w.like_count * 2 + w.view_count * 0.1 + w.comment_count * 3) as trending_score
      FROM works w
      JOIN users u ON w.user_id = u.id
      WHERE w.status = 'published'
        AND w.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY trending_score DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(work => ({
      id: work.id,
      type: work.type,
      title: work.title,
      description: work.description,
      thumbnail: work.thumbnail,
      score: work.trending_score,
      reason: '最近很火的内容',
      tags: work.tags || []
    }));
  }

  /**
   * 去重推荐结果
   */
  private deduplicateRecommendations(recommendations: RecommendationItem[]): RecommendationItem[] {
    const seen = new Set<string>();
    return recommendations.filter(item => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }

  /**
   * 确保推荐多样性
   */
  private ensureDiversity(recommendations: RecommendationItem[]): RecommendationItem[] {
    const result: RecommendationItem[] = [];
    const typeCount: Record<string, number> = {};

    // 按分数排序
    const sorted = [...recommendations].sort((a, b) => b.score - a.score);

    for (const item of sorted) {
      const count = typeCount[item.type] || 0;
      // 限制同一类型的数量
      if (count < 3) {
        result.push(item);
        typeCount[item.type] = count + 1;
      }
    }

    return result;
  }

  /**
   * 学习路径推荐
   */
  async recommendLearningPath(userId: string): Promise<any> {
    const userProfile = await this.buildUserProfile(userId);
    const skillLevels = userProfile.skillLevels;

    // 找出薄弱学科
    const weakSubjects = Object.entries(skillLevels)
      .filter(([_, level]) => level < 3)
      .map(([subject]) => subject);

    // 推荐学习内容
    const recommendations = [];

    for (const subject of weakSubjects) {
      const level = skillLevels[subject] || 1;
      recommendations.push({
        subject,
        currentLevel: level,
        targetLevel: level + 1,
        recommendedContent: await this.getSubjectContent(subject, level),
        reason: `提升${subject}技能`
      });
    }

    return {
      userLevel: Math.round(Object.values(skillLevels).reduce((a, b) => a + b, 0) / Object.keys(skillLevels).length),
      weakSubjects,
      recommendations,
      overallProgress: this.calculateOverallProgress(skillLevels)
    };
  }

  /**
   * 获取学科内容
   */
  private async getSubjectContent(subject: string, level: number): Promise<any[]> {
    // 这里可以根据学科和等级返回相应的学习内容
    return [];
  }

  /**
   * 计算整体进度
   */
  private calculateOverallProgress(skillLevels: Record<string, number>): number {
    const levels = Object.values(skillLevels);
    if (levels.length === 0) return 0;
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
    return Math.round((avg / 5) * 100);
  }
}

export const enhancedRecommendationService = new EnhancedRecommendationService();
