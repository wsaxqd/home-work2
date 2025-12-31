import { query } from '../config/database';

export interface DashboardOverview {
  totalUsers: number;
  activeUsersToday: number;
  totalWorks: number;
  totalGames: number;
  avgSessionDuration: number;
}

export interface UserEngagement {
  dailyActiveUsers: Array<{ date: string; count: number }>;
  userRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  topFeatures: Array<{ feature: string; usageCount: number }>;
}

export interface LearningAnalytics {
  completionRates: {
    overall: number;
    byModule: Array<{ module: string; rate: number }>;
  };
  averageScores: {
    overall: number;
    bySubject: Array<{ subject: string; score: number }>;
  };
  studyTime: {
    total: number;
    average: number;
    byUser: Array<{ userId: string; minutes: number }>;
  };
}

export interface ContentAnalytics {
  topWorks: Array<any>;
  contentDistribution: Array<{ type: string; count: number }>;
  engagementMetrics: {
    avgLikes: number;
    avgComments: number;
    avgViews: number;
  };
}

export interface SafetyAnalytics {
  moderationStats: {
    totalChecks: number;
    flaggedContent: number;
    blockedContent: number;
    flagRate: number;
  };
  topReasons: Array<{ reason: string; count: number }>;
  riskUsers: Array<{ userId: string; riskLevel: string; flagCount: number }>;
}

export class AnalyticsService {
  /**
   * 获取仪表板总览
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    // 总用户数
    const usersResult = await query(`SELECT COUNT(*) as count FROM users`);
    const totalUsers = parseInt(usersResult.rows[0].count);

    // 今日活跃用户
    const activeUsersResult = await query(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM (
         SELECT user_id, created_at FROM works WHERE created_at >= CURRENT_DATE
         UNION ALL
         SELECT user_id, created_at FROM game_progress WHERE created_at >= CURRENT_DATE
         UNION ALL
         SELECT user_id, created_at FROM ai_conversations WHERE updated_at >= CURRENT_DATE
       ) AS active_users`
    );
    const activeUsersToday = parseInt(activeUsersResult.rows[0].count);

    // 总作品数
    const worksResult = await query(`SELECT COUNT(*) as count FROM works`);
    const totalWorks = parseInt(worksResult.rows[0].count);

    // 总游戏记录数
    const gamesResult = await query(`SELECT COUNT(*) as count FROM game_progress`);
    const totalGames = parseInt(gamesResult.rows[0].count);

    // 平均会话时长（基于辅导会话）
    const sessionResult = await query(
      `SELECT AVG(duration_minutes) as avg_duration
       FROM ai_tutoring_sessions
       WHERE ended_at IS NOT NULL`
    );
    const avgSessionDuration = parseFloat(sessionResult.rows[0].avg_duration || 0);

    return {
      totalUsers,
      activeUsersToday,
      totalWorks,
      totalGames,
      avgSessionDuration: Math.round(avgSessionDuration),
    };
  }

  /**
   * 获取用户参与度分析
   */
  async getUserEngagement(days: number = 30): Promise<UserEngagement> {
    // 每日活跃用户
    const dailyActiveResult = await query(
      `SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as count
       FROM (
         SELECT user_id, created_at FROM works
         UNION ALL
         SELECT user_id, created_at FROM game_progress
       ) AS activities
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    const dailyActiveUsers = dailyActiveResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      count: parseInt(row.count),
    }));

    // 用户留存率
    const retentionResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '1 day') * 100.0 / NULLIF(COUNT(*), 0) as day1,
         COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '7 days') * 100.0 / NULLIF(COUNT(*), 0) as day7,
         COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '30 days') * 100.0 / NULLIF(COUNT(*), 0) as day30
       FROM users
       WHERE created_at < CURRENT_DATE - INTERVAL '30 days'`
    );

    const retention = retentionResult.rows[0];

    // 热门功能使用统计
    const topFeaturesResult = await query(
      `SELECT feature_type as feature, COUNT(*) as count
       FROM usage_logs
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY feature_type
       ORDER BY count DESC
       LIMIT 10`
    );

    const topFeatures = topFeaturesResult.rows.map(row => ({
      feature: row.feature,
      usageCount: parseInt(row.count),
    }));

    return {
      dailyActiveUsers,
      userRetention: {
        day1: parseFloat(retention.day1 || 0),
        day7: parseFloat(retention.day7 || 0),
        day30: parseFloat(retention.day30 || 0),
      },
      topFeatures,
    };
  }

  /**
   * 获取学习分析
   */
  async getLearningAnalytics(): Promise<LearningAnalytics> {
    // 完成率
    const completionResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE completed = true) * 100.0 / NULLIF(COUNT(*), 0) as overall,
         module_id,
         COUNT(*) FILTER (WHERE completed = true) * 100.0 / NULLIF(COUNT(*), 0) as module_rate
       FROM learning_progress
       GROUP BY ROLLUP(module_id)`
    );

    const overall = parseFloat(completionResult.rows.find(r => !r.module_id)?.overall || 0);
    const byModule = completionResult.rows
      .filter(r => r.module_id)
      .map(r => ({
        module: r.module_id,
        rate: parseFloat(r.module_rate),
      }));

    // 平均分数（基于辅导会话）
    const scoresResult = await query(
      `SELECT
         AVG(correct_count * 100.0 / NULLIF(total_count, 0)) as overall,
         subject,
         AVG(correct_count * 100.0 / NULLIF(total_count, 0)) as subject_score
       FROM ai_tutoring_sessions
       WHERE ended_at IS NOT NULL
       GROUP BY ROLLUP(subject)`
    );

    const overallScore = parseFloat(scoresResult.rows.find(r => !r.subject)?.overall || 0);
    const bySubject = scoresResult.rows
      .filter(r => r.subject)
      .map(r => ({
        subject: r.subject,
        score: parseFloat(r.subject_score),
      }));

    // 学习时长
    const studyTimeResult = await query(
      `SELECT
         SUM(duration_minutes) as total,
         AVG(duration_minutes) as average,
         user_id,
         SUM(duration_minutes) as user_minutes
       FROM ai_tutoring_sessions
       WHERE ended_at IS NOT NULL
       GROUP BY ROLLUP(user_id)
       ORDER BY user_minutes DESC NULLS LAST
       LIMIT 11`
    );

    const totalRow = studyTimeResult.rows.find(r => !r.user_id);
    const total = parseFloat(totalRow?.total || 0);
    const average = parseFloat(totalRow?.average || 0);
    const byUser = studyTimeResult.rows
      .filter(r => r.user_id)
      .slice(0, 10)
      .map(r => ({
        userId: r.user_id,
        minutes: parseFloat(r.user_minutes),
      }));

    return {
      completionRates: {
        overall,
        byModule,
      },
      averageScores: {
        overall: overallScore,
        bySubject,
      },
      studyTime: {
        total,
        average,
        byUser,
      },
    };
  }

  /**
   * 获取内容分析
   */
  async getContentAnalytics(limit: number = 10): Promise<ContentAnalytics> {
    // 热门作品
    const topWorksResult = await query(
      `SELECT w.*, u.nickname, u.avatar
       FROM works w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'published'
       ORDER BY (w.like_count * 2 + w.comment_count + w.view_count) DESC
       LIMIT ${limit}`
    );

    const topWorks = topWorksResult.rows;

    // 内容分布
    const distributionResult = await query(
      `SELECT type, COUNT(*) as count
       FROM works
       GROUP BY type
       ORDER BY count DESC`
    );

    const contentDistribution = distributionResult.rows.map(row => ({
      type: row.type,
      count: parseInt(row.count),
    }));

    // 互动指标
    const engagementResult = await query(
      `SELECT
         AVG(like_count) as avg_likes,
         AVG(comment_count) as avg_comments,
         AVG(view_count) as avg_views
       FROM works
       WHERE status = 'published'`
    );

    const engagement = engagementResult.rows[0];

    return {
      topWorks,
      contentDistribution,
      engagementMetrics: {
        avgLikes: parseFloat(engagement.avg_likes || 0),
        avgComments: parseFloat(engagement.avg_comments || 0),
        avgViews: parseFloat(engagement.avg_views || 0),
      },
    };
  }

  /**
   * 获取安全分析
   */
  async getSafetyAnalytics(days: number = 30): Promise<SafetyAnalytics> {
    // 审核统计
    const moderationStatsResult = await query(
      `SELECT
         COUNT(*) as total_checks,
         COUNT(*) FILTER (WHERE action = 'flagged') as flagged,
         COUNT(*) FILTER (WHERE action = 'blocked') as blocked
       FROM moderation_logs
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'`
    );

    const stats = moderationStatsResult.rows[0];
    const totalChecks = parseInt(stats.total_checks);
    const flaggedContent = parseInt(stats.flagged);
    const blockedContent = parseInt(stats.blocked);

    // 主要违规原因（从moderation_result中提取）
    const topReasonsResult = await query(
      `SELECT
         jsonb_array_elements_text(moderation_result->'flaggedTerms') as reason,
         COUNT(*) as count
       FROM moderation_logs
       WHERE action IN ('flagged', 'blocked')
       AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY reason
       ORDER BY count DESC
       LIMIT 10`
    );

    const topReasons = topReasonsResult.rows.map(row => ({
      reason: row.reason,
      count: parseInt(row.count),
    }));

    // 高风险用户
    const riskUsersResult = await query(
      `SELECT user_id, COUNT(*) as flag_count
       FROM moderation_logs
       WHERE action IN ('flagged', 'blocked')
       AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY user_id
       HAVING COUNT(*) >= 3
       ORDER BY flag_count DESC
       LIMIT 10`
    );

    const riskUsers = riskUsersResult.rows.map(row => ({
      userId: row.user_id,
      riskLevel: parseInt(row.flag_count) >= 5 ? 'high' : 'medium',
      flagCount: parseInt(row.flag_count),
    }));

    return {
      moderationStats: {
        totalChecks,
        flaggedContent,
        blockedContent,
        flagRate: totalChecks > 0 ? (flaggedContent + blockedContent) / totalChecks * 100 : 0,
      },
      topReasons,
      riskUsers,
    };
  }

  /**
   * 获取用户个人分析
   */
  async getUserPersonalAnalytics(userId: string) {
    // 学习进度
    const learningProgressResult = await query(
      `SELECT module_id, progress, completed, score
       FROM learning_progress
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    // 创作统计
    const worksStatsResult = await query(
      `SELECT
         COUNT(*) as total_works,
         SUM(like_count) as total_likes,
         SUM(comment_count) as total_comments,
         type,
         COUNT(*) as type_count
       FROM works
       WHERE user_id = $1
       GROUP BY ROLLUP(type)`,
      [userId]
    );

    const totalRow = worksStatsResult.rows.find(r => !r.type);
    const byType = worksStatsResult.rows.filter(r => r.type);

    // 游戏统计
    const gameStatsResult = await query(
      `SELECT
         game_type,
         COUNT(*) as plays,
         AVG(score) as avg_score,
         MAX(score) as best_score
       FROM game_progress
       WHERE user_id = $1
       GROUP BY game_type`,
      [userId]
    );

    // 辅导统计
    const tutoringStatsResult = await query(
      `SELECT
         subject,
         COUNT(*) as sessions,
         AVG(correct_count * 100.0 / NULLIF(total_count, 0)) as avg_score,
         SUM(duration_minutes) as total_minutes
       FROM ai_tutoring_sessions
       WHERE user_id = $1 AND ended_at IS NOT NULL
       GROUP BY subject`,
      [userId]
    );

    return {
      learningProgress: learningProgressResult.rows,
      worksStats: {
        total: parseInt(totalRow?.total_works || 0),
        totalLikes: parseInt(totalRow?.total_likes || 0),
        totalComments: parseInt(totalRow?.total_comments || 0),
        byType: byType.map(r => ({
          type: r.type,
          count: parseInt(r.type_count),
        })),
      },
      gameStats: gameStatsResult.rows.map(r => ({
        gameType: r.game_type,
        plays: parseInt(r.plays),
        avgScore: parseFloat(r.avg_score || 0),
        bestScore: parseInt(r.best_score || 0),
      })),
      tutoringStats: tutoringStatsResult.rows.map(r => ({
        subject: r.subject,
        sessions: parseInt(r.sessions),
        avgScore: parseFloat(r.avg_score || 0),
        totalMinutes: parseFloat(r.total_minutes || 0),
      })),
    };
  }

  /**
   * 导出数据报告
   */
  async generateReport(type: 'overview' | 'learning' | 'content' | 'safety', format: 'json' | 'csv' = 'json') {
    let data: any;

    switch (type) {
      case 'overview':
        data = await this.getDashboardOverview();
        break;
      case 'learning':
        data = await this.getLearningAnalytics();
        break;
      case 'content':
        data = await this.getContentAnalytics(50);
        break;
      case 'safety':
        data = await this.getSafetyAnalytics(30);
        break;
    }

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return data;
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(data: any): string {
    // 简单的CSV转换实现
    if (Array.isArray(data)) {
      if (data.length === 0) return '';

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row =>
        Object.values(row).map(v => `"${v}"`).join(',')
      );

      return [headers, ...rows].join('\n');
    }

    // 对于对象，转换为key-value格式
    return Object.entries(data)
      .map(([key, value]) => `"${key}","${value}"`)
      .join('\n');
  }
}

export const analyticsService = new AnalyticsService();
