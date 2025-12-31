import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface ParentalControl {
  userId: string;
  dailyTimeLimit: number; // 分钟
  contentFilterLevel: number; // 1-5
  allowedFeatures: string[];
  blockedFeatures: string[];
  notificationSettings: any;
}

export class ParentalControlService {
  /**
   * 获取家长控制设置
   */
  async getSettings(userId: string): Promise<ParentalControl | null> {
    const result = await query(
      'SELECT * FROM parental_controls WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      userId: row.user_id,
      dailyTimeLimit: row.daily_time_limit,
      contentFilterLevel: row.content_filter_level,
      allowedFeatures: row.allowed_features || [],
      blockedFeatures: row.blocked_features || [],
      notificationSettings: row.notification_settings || {},
    };
  }

  /**
   * 更新家长控制设置
   */
  async updateSettings(userId: string, settings: Partial<ParentalControl>) {
    const existing = await this.getSettings(userId);

    if (!existing) {
      // 创建新设置
      await query(
        `INSERT INTO parental_controls
         (user_id, daily_time_limit, content_filter_level, allowed_features, blocked_features, notification_settings)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          settings.dailyTimeLimit || 120,
          settings.contentFilterLevel || 1,
          JSON.stringify(settings.allowedFeatures || []),
          JSON.stringify(settings.blockedFeatures || []),
          JSON.stringify(settings.notificationSettings || {}),
        ]
      );
    } else {
      // 更新设置
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (settings.dailyTimeLimit !== undefined) {
        updates.push(`daily_time_limit = $${paramIndex++}`);
        values.push(settings.dailyTimeLimit);
      }
      if (settings.contentFilterLevel !== undefined) {
        updates.push(`content_filter_level = $${paramIndex++}`);
        values.push(settings.contentFilterLevel);
      }
      if (settings.allowedFeatures !== undefined) {
        updates.push(`allowed_features = $${paramIndex++}`);
        values.push(JSON.stringify(settings.allowedFeatures));
      }
      if (settings.blockedFeatures !== undefined) {
        updates.push(`blocked_features = $${paramIndex++}`);
        values.push(JSON.stringify(settings.blockedFeatures));
      }
      if (settings.notificationSettings !== undefined) {
        updates.push(`notification_settings = $${paramIndex++}`);
        values.push(JSON.stringify(settings.notificationSettings));
      }

      if (updates.length > 0) {
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId);
        await query(
          `UPDATE parental_controls SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
          values
        );
      }
    }

    return this.getSettings(userId);
  }

  /**
   * 记录使用时长
   */
  async logUsage(userId: string, featureType: string, duration: number, activityData?: any) {
    await query(
      `INSERT INTO usage_logs (user_id, feature_type, duration, activity_data, logged_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
      [userId, featureType, duration, JSON.stringify(activityData || {})]
    );
  }

  /**
   * 获取今日使用时长
   */
  async getTodayUsage(userId: string): Promise<number> {
    const result = await query(
      `SELECT COALESCE(SUM(duration), 0) as total_duration
       FROM usage_logs
       WHERE user_id = $1 AND logged_date = CURRENT_DATE`,
      [userId]
    );

    return parseInt(result.rows[0].total_duration);
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(userId: string, startDate?: Date, endDate?: Date) {
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      whereClause += ` AND logged_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND logged_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    const result = await query(
      `SELECT
        logged_date,
        feature_type,
        SUM(duration) as total_duration,
        COUNT(*) as session_count
       FROM usage_logs
       ${whereClause}
       GROUP BY logged_date, feature_type
       ORDER BY logged_date DESC, feature_type`,
      params
    );

    return result.rows;
  }

  /**
   * 检查是否超时
   */
  async checkTimeLimit(userId: string): Promise<{ exceeded: boolean; remaining: number }> {
    const settings = await this.getSettings(userId);
    if (!settings) {
      return { exceeded: false, remaining: 999999 };
    }

    const todayUsage = await this.getTodayUsage(userId);
    const limit = settings.dailyTimeLimit;
    const remaining = Math.max(0, limit - todayUsage);

    return {
      exceeded: todayUsage >= limit,
      remaining,
    };
  }
}

export const parentalControlService = new ParentalControlService();
