import { pool } from '../config/database';

export interface UsageLogData {
  userId: number;
  activityType: '阅读' | '游戏' | '创作' | '学习';
  activityTitle: string;
  duration: number;
  score?: number;
  metadata?: any;
}

export interface ControlSettings {
  dailyLimit: number;
  gameLimit: number;
  startTime: string;
  endTime: string;
  timeControlEnabled: boolean;
  contentControls: {
    games: boolean;
    creation: boolean;
    reading: boolean;
    aiEncyclopedia: boolean;
  };
}

class UsageDataService {
  // 记录使用数据
  async logUsage(data: UsageLogData) {
    const { userId, activityType, activityTitle, duration, score, metadata } = data;

    const result = await pool.query(
      `INSERT INTO usage_logs (user_id, activity_type, activity_title, duration, score, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, activityType, activityTitle, duration, score, metadata ? JSON.stringify(metadata) : null]
    );

    return result.rows[0];
  }

  // 获取今日使用时长
  async getTodayUsage(userId: number) {
    const result = await pool.query(
      `SELECT
        COALESCE(SUM(duration), 0) as total_duration,
        COALESCE(SUM(CASE WHEN activity_type = '游戏' THEN duration ELSE 0 END), 0) as game_duration,
        COALESCE(SUM(CASE WHEN activity_type != '游戏' THEN duration ELSE 0 END), 0) as learning_duration
       FROM usage_logs
       WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [userId]
    );

    return result.rows[0];
  }

  // 获取使用统计（按时间范围）
  async getUsageStats(userId: number, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate || new Date();

    // 按天统计
    const dailyStats = await pool.query(
      `SELECT
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN activity_type != '游戏' THEN duration ELSE 0 END), 0) as learning,
        COALESCE(SUM(CASE WHEN activity_type = '游戏' THEN duration ELSE 0 END), 0) as gaming
       FROM usage_logs
       WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [userId, start, end]
    );

    // 活动类型统计
    const typeStats = await pool.query(
      `SELECT
        activity_type,
        COUNT(*) as count,
        SUM(duration) as total_duration
       FROM usage_logs
       WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY activity_type`,
      [userId, start, end]
    );

    // 最近记录
    const recentRecords = await pool.query(
      `SELECT *
       FROM usage_logs
       WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId, start, end]
    );

    return {
      dailyStats: dailyStats.rows,
      typeStats: typeStats.rows,
      recentRecords: recentRecords.rows
    };
  }

  // 获取成长报告数据
  async getGrowthReportData(userId: number, reportType: 'week' | 'month') {
    const days = reportType === 'week' ? 7 : 30;
    const startDate = new Date(new Date().setDate(new Date().getDate() - days));

    // 总时长统计
    const totalStats = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN activity_type != '游戏' THEN duration ELSE 0 END), 0) as total_learning,
        COALESCE(SUM(CASE WHEN activity_type = '游戏' THEN duration ELSE 0 END), 0) as total_gaming,
        COALESCE(SUM(CASE WHEN activity_type = '创作' THEN duration ELSE 0 END), 0) as total_creation,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        COUNT(*) as total_records
       FROM usage_logs
       WHERE user_id = $1 AND created_at >= $2`,
      [userId, startDate]
    );

    // 最喜欢的活动
    const favoriteActivity = await pool.query(
      `SELECT activity_type, COUNT(*) as count
       FROM usage_logs
       WHERE user_id = $1 AND created_at >= $2
       GROUP BY activity_type
       ORDER BY count DESC
       LIMIT 1`,
      [userId, startDate]
    );

    // 成就统计（从游戏记录中）
    const achievements = await pool.query(
      `SELECT COUNT(*) as achievement_count
       FROM usage_logs
       WHERE user_id = $1 AND created_at >= $2 AND score >= 90`,
      [userId, startDate]
    );

    // 对比上周期数据计算进步指数
    const prevPeriodStart = new Date(new Date(startDate).setDate(startDate.getDate() - days));
    const prevStats = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN activity_type != '游戏' THEN duration ELSE 0 END), 0) as prev_learning
       FROM usage_logs
       WHERE user_id = $1 AND created_at BETWEEN $2 AND $3`,
      [userId, prevPeriodStart, startDate]
    );

    const currentLearning = parseInt(totalStats.rows[0].total_learning);
    const prevLearning = parseInt(prevStats.rows[0].prev_learning);
    const improvement = prevLearning > 0
      ? Math.round(((currentLearning - prevLearning) / prevLearning) * 100)
      : 0;

    return {
      totalLearning: currentLearning,
      totalGaming: parseInt(totalStats.rows[0].total_gaming),
      totalCreation: parseInt(totalStats.rows[0].total_creation),
      activeDays: totalStats.rows[0].active_days,
      totalRecords: totalStats.rows[0].total_records,
      favoriteActivity: favoriteActivity.rows[0]?.activity_type || '阅读',
      achievementCount: achievements.rows[0].achievement_count,
      improvement
    };
  }

  // 获取控制设置
  async getControlSettings(userId: number): Promise<ControlSettings> {
    const result = await pool.query(
      'SELECT * FROM parental_controls WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // 如果没有设置，创建默认设置
      const defaultSettings = await pool.query(
        `INSERT INTO parental_controls (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );
      return this.formatControlSettings(defaultSettings.rows[0]);
    }

    return this.formatControlSettings(result.rows[0]);
  }

  // 更新控制设置
  async updateControlSettings(userId: number, settings: Partial<ControlSettings>) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (settings.dailyLimit !== undefined) {
      updates.push(`daily_limit = $${paramIndex}`);
      values.push(settings.dailyLimit);
      paramIndex++;
    }

    if (settings.gameLimit !== undefined) {
      updates.push(`game_limit = $${paramIndex}`);
      values.push(settings.gameLimit);
      paramIndex++;
    }

    if (settings.startTime !== undefined) {
      updates.push(`start_time = $${paramIndex}`);
      values.push(settings.startTime);
      paramIndex++;
    }

    if (settings.endTime !== undefined) {
      updates.push(`end_time = $${paramIndex}`);
      values.push(settings.endTime);
      paramIndex++;
    }

    if (settings.timeControlEnabled !== undefined) {
      updates.push(`time_control_enabled = $${paramIndex}`);
      values.push(settings.timeControlEnabled);
      paramIndex++;
    }

    if (settings.contentControls !== undefined) {
      updates.push(`content_controls = $${paramIndex}`);
      values.push(JSON.stringify(settings.contentControls));
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('没有要更新的字段');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE parental_controls SET ${updates.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return this.formatControlSettings(result.rows[0]);
  }

  // 检查时间限制
  async checkTimeLimit(userId: number) {
    const [settings, todayUsage] = await Promise.all([
      this.getControlSettings(userId),
      this.getTodayUsage(userId)
    ]);

    if (!settings.timeControlEnabled) {
      return {
        allowed: true,
        reason: '时间控制未启用'
      };
    }

    // 检查总时长
    if (todayUsage.total_duration >= settings.dailyLimit * 60) {
      return {
        allowed: false,
        reason: '已达到今日使用时长限制',
        remainingTime: 0
      };
    }

    // 检查游戏时长
    if (todayUsage.game_duration >= settings.gameLimit * 60) {
      return {
        allowed: false,
        reason: '已达到今日游戏时长限制',
        remainingTime: 0,
        gameOnly: true
      };
    }

    // 检查时间段
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = settings.startTime.split(':').map(Number);
    const [endHour, endMin] = settings.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (currentTime < startMinutes || currentTime > endMinutes) {
      return {
        allowed: false,
        reason: '当前不在允许使用的时间段内'
      };
    }

    return {
      allowed: true,
      remainingTime: settings.dailyLimit * 60 - todayUsage.total_duration,
      remainingGameTime: settings.gameLimit * 60 - todayUsage.game_duration
    };
  }

  // 格式化控制设置
  private formatControlSettings(row: any): ControlSettings {
    return {
      dailyLimit: row.daily_limit,
      gameLimit: row.game_limit,
      startTime: row.start_time,
      endTime: row.end_time,
      timeControlEnabled: row.time_control_enabled,
      contentControls: row.content_controls
    };
  }
}

export const usageDataService = new UsageDataService();
