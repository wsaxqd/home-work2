import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export type MoodType = 'happy' | 'sad' | 'angry' | 'scared' | 'surprised' | 'neutral';

export interface CreateDiaryInput {
  title: string;
  content: string;
  mood: MoodType;
  weather?: string;
  images?: string[];
  isPrivate?: boolean;
}

export interface UpdateDiaryInput {
  title?: string;
  content?: string;
  mood?: MoodType;
  weather?: string;
  images?: string[];
  isPrivate?: boolean;
}

export class DiaryService {
  // 创建日记
  async createDiary(userId: string, input: CreateDiaryInput) {
    const { title, content, mood, weather, images, isPrivate } = input;

    const result = await query(
      `INSERT INTO diaries (user_id, title, content, mood, weather, images, is_private)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, title, content, mood, weather || null, JSON.stringify(images || []), isPrivate ?? true]
    );

    return this.formatDiary(result.rows[0]);
  }

  // 获取用户日记列表
  async getDiaries(userId: string, page: number = 1, pageSize: number = 20, mood?: MoodType) {
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (mood) {
      whereClause += ` AND mood = $${paramIndex++}`;
      params.push(mood);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM diaries ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(pageSize, offset);
    const result = await query(
      `SELECT * FROM diaries ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return {
      list: result.rows.map(row => this.formatDiary(row)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取日记详情
  async getDiaryById(diaryId: string, userId: string) {
    const result = await query(
      'SELECT * FROM diaries WHERE id = $1',
      [diaryId]
    );

    if (result.rows.length === 0) {
      throw new AppError('日记不存在', 404);
    }

    const diary = result.rows[0];

    // 检查权限：只有本人可以查看私密日记
    if (diary.is_private && diary.user_id !== userId) {
      throw new AppError('无权查看该日记', 403);
    }

    return this.formatDiary(diary);
  }

  // 更新日记
  async updateDiary(diaryId: string, userId: string, input: UpdateDiaryInput) {
    // 检查日记是否存在且属于当前用户
    const existingResult = await query(
      'SELECT * FROM diaries WHERE id = $1',
      [diaryId]
    );

    if (existingResult.rows.length === 0) {
      throw new AppError('日记不存在', 404);
    }

    if (existingResult.rows[0].user_id !== userId) {
      throw new AppError('无权修改该日记', 403);
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(input.title);
    }
    if (input.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      params.push(input.content);
    }
    if (input.mood !== undefined) {
      updates.push(`mood = $${paramIndex++}`);
      params.push(input.mood);
    }
    if (input.weather !== undefined) {
      updates.push(`weather = $${paramIndex++}`);
      params.push(input.weather);
    }
    if (input.images !== undefined) {
      updates.push(`images = $${paramIndex++}`);
      params.push(JSON.stringify(input.images));
    }
    if (input.isPrivate !== undefined) {
      updates.push(`is_private = $${paramIndex++}`);
      params.push(input.isPrivate);
    }

    if (updates.length === 0) {
      return this.formatDiary(existingResult.rows[0]);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(diaryId);

    const result = await query(
      `UPDATE diaries SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return this.formatDiary(result.rows[0]);
  }

  // 删除日记
  async deleteDiary(diaryId: string, userId: string) {
    const result = await query(
      'DELETE FROM diaries WHERE id = $1 AND user_id = $2 RETURNING id',
      [diaryId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('日记不存在或无权删除', 404);
    }

    return { message: '删除成功' };
  }

  // 获取心情统计
  async getMoodStats(userId: string, startDate?: Date, endDate?: Date) {
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

    // 心情分布统计
    const moodDistribution = await query(
      `SELECT mood, COUNT(*) as count
       FROM diaries ${whereClause}
       GROUP BY mood`,
      params
    );

    // 总日记数
    const totalResult = await query(
      `SELECT COUNT(*) FROM diaries ${whereClause}`,
      params
    );

    // 每日心情趋势（最近30天）
    const trendResult = await query(
      `SELECT DATE(created_at) as date, mood, COUNT(*) as count
       FROM diaries
       WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at), mood
       ORDER BY date`,
      [userId]
    );

    const distribution: Record<string, number> = {};
    for (const row of moodDistribution.rows) {
      distribution[row.mood] = parseInt(row.count);
    }

    return {
      total: parseInt(totalResult.rows[0].count),
      distribution,
      trend: trendResult.rows.map(row => ({
        date: row.date,
        mood: row.mood,
        count: parseInt(row.count),
      })),
    };
  }

  // 获取日历视图数据
  async getCalendarData(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await query(
      `SELECT DATE(created_at) as date, mood, COUNT(*) as count
       FROM diaries
       WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
       GROUP BY DATE(created_at), mood
       ORDER BY date`,
      [userId, startDate, endDate]
    );

    const calendar: Record<string, { mood: string; count: number }[]> = {};

    for (const row of result.rows) {
      const dateStr = row.date.toISOString().split('T')[0];
      if (!calendar[dateStr]) {
        calendar[dateStr] = [];
      }
      calendar[dateStr].push({
        mood: row.mood,
        count: parseInt(row.count),
      });
    }

    return calendar;
  }

  /**
   * 获取情绪统计
   */
  async getEmotionStats(userId: string, days: number = 30) {
    const sql = `
      SELECT mood, COUNT(*) as count
      FROM diaries
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY mood
      ORDER BY count DESC
    `;
    const result = await query(sql, [userId]);
    return result.rows.map(row => ({
      mood: row.mood,
      count: parseInt(row.count)
    }));
  }

  // 格式化日记数据
  private formatDiary(row: any) {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      mood: row.mood,
      weather: row.weather,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
      isPrivate: row.is_private,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const diaryService = new DiaryService();
