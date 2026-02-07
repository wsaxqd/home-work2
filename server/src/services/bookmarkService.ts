import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface CreateBookmarkData {
  userId: string;
  resourceType: 'story' | 'article' | 'video' | 'knowledge';
  resourceId: string;
  resourceTitle?: string;
  position?: number;
  notes?: string;
}

interface Bookmark {
  id: number;
  user_id: string;
  resource_type: string;
  resource_id: string;
  resource_title: string;
  position: number;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

export const bookmarkService = {
  /**
   * 添加书签
   */
  async createBookmark(data: CreateBookmarkData): Promise<Bookmark> {
    const { userId, resourceType, resourceId, resourceTitle, position = 0, notes } = data;

    const result = await query(
      `INSERT INTO bookmarks (user_id, resource_type, resource_id, resource_title, position, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, resource_type, resource_id)
       DO UPDATE SET position = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, resourceType, resourceId, resourceTitle, position, notes]
    );

    return result.rows[0];
  },

  /**
   * 获取用户的书签列表
   */
  async getUserBookmarks(
    userId: string,
    resourceType?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    bookmarks: Bookmark[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM bookmarks WHERE user_id = $1';
    const params: any[] = [userId];

    if (resourceType) {
      params.push(resourceType);
      sql += ` AND resource_type = $${params.length}`;
    }

    // 获取总数
    const countResult = await query(
      sql.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取书签列表
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    return {
      bookmarks: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  /**
   * 获取单个书签
   */
  async getBookmark(userId: string, resourceType: string, resourceId: string): Promise<Bookmark | null> {
    const result = await query(
      'SELECT * FROM bookmarks WHERE user_id = $1 AND resource_type = $2 AND resource_id = $3',
      [userId, resourceType, resourceId]
    );

    return result.rows[0] || null;
  },

  /**
   * 更新书签
   */
  async updateBookmark(
    bookmarkId: number,
    userId: string,
    data: { position?: number; notes?: string }
  ): Promise<Bookmark> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      params.push(data.position);
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(data.notes);
    }

    if (updates.length === 0) {
      throw new AppError('没有要更新的内容', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(bookmarkId, userId);

    const result = await query(
      `UPDATE bookmarks SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('书签不存在', 404);
    }

    return result.rows[0];
  },

  /**
   * 删除书签
   */
  async deleteBookmark(bookmarkId: number, userId: string): Promise<void> {
    const result = await query(
      'DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 RETURNING id',
      [bookmarkId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('书签不存在', 404);
    }
  },

  /**
   * 检查书签是否存在
   */
  async hasBookmark(userId: string, resourceType: string, resourceId: string): Promise<boolean> {
    const result = await query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND resource_type = $2 AND resource_id = $3',
      [userId, resourceType, resourceId]
    );

    return result.rows.length > 0;
  }
};
