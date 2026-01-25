import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface ParentalControl {
  userId: string;
  dailyLimit: number; // 分钟
  gameLimit: number; // 分钟
  startTime: string; // 时间字符串如 "08:00:00"
  endTime: string;
  timeControlEnabled: boolean;
  contentControls: any; // JSONB对象
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
      dailyLimit: row.daily_limit,
      gameLimit: row.game_limit,
      startTime: row.start_time,
      endTime: row.end_time,
      timeControlEnabled: row.time_control_enabled,
      contentControls: row.content_controls || {},
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
         (user_id, daily_limit, game_limit, start_time, end_time, time_control_enabled, content_controls)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          settings.dailyLimit || 120,
          settings.gameLimit || 30,
          settings.startTime || '08:00:00',
          settings.endTime || '20:00:00',
          settings.timeControlEnabled !== undefined ? settings.timeControlEnabled : true,
          JSON.stringify(settings.contentControls || { games: true, reading: true, creation: true, aiEncyclopedia: true }),
        ]
      );
    } else {
      // 更新设置
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (settings.dailyLimit !== undefined) {
        updates.push(`daily_limit = $${paramIndex++}`);
        values.push(settings.dailyLimit);
      }
      if (settings.gameLimit !== undefined) {
        updates.push(`game_limit = $${paramIndex++}`);
        values.push(settings.gameLimit);
      }
      if (settings.startTime !== undefined) {
        updates.push(`start_time = $${paramIndex++}`);
        values.push(settings.startTime);
      }
      if (settings.endTime !== undefined) {
        updates.push(`end_time = $${paramIndex++}`);
        values.push(settings.endTime);
      }
      if (settings.timeControlEnabled !== undefined) {
        updates.push(`time_control_enabled = $${paramIndex++}`);
        values.push(settings.timeControlEnabled);
      }
      if (settings.contentControls !== undefined) {
        updates.push(`content_controls = $${paramIndex++}`);
        values.push(JSON.stringify(settings.contentControls));
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
      `INSERT INTO usage_logs (user_id, activity_type, duration, metadata, activity_title)
       VALUES ($1, $2, $3, $4, $2)`,
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
       WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
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
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    const result = await query(
      `SELECT
        DATE(created_at) as logged_date,
        activity_type as feature_type,
        SUM(duration) as total_duration,
        COUNT(*) as session_count
       FROM usage_logs
       ${whereClause}
       GROUP BY DATE(created_at), activity_type
       ORDER BY logged_date DESC, activity_type`,
      params
    );

    return result.rows;
  }

  /**
   * 检查是否超时
   */
  async checkTimeLimit(userId: string): Promise<{ exceeded: boolean; remaining: number }> {
    const settings = await this.getSettings(userId);
    if (!settings || !settings.timeControlEnabled) {
      return { exceeded: false, remaining: 999999 };
    }

    const todayUsage = await this.getTodayUsage(userId);
    const limit = settings.dailyLimit;
    const remaining = Math.max(0, limit - todayUsage);

    return {
      exceeded: todayUsage >= limit,
      remaining,
    };
  }
}

export const parentalControlService = new ParentalControlService();
