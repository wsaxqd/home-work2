import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export type WishCategory = 'study' | 'toy' | 'family' | 'friend' | 'other';
export type WishStatus = 'pending' | 'fulfilled';

export interface CreateWishInput {
  content: string;
  category: WishCategory;
}

export interface UpdateWishInput {
  content?: string;
  category?: WishCategory;
  status?: WishStatus;
}

export class WishesService {
  // 创建心愿
  async createWish(userId: string, input: CreateWishInput) {
    const { content, category } = input;

    const result = await query(
      `INSERT INTO wishes (user_id, content, category, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [userId, content, category]
    );

    return this.formatWish(result.rows[0]);
  }

  // 获取用户心愿列表
  async getWishes(userId: string, filters?: { status?: string; category?: string }) {
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.category) {
      whereClause += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }

    const result = await query(
      `SELECT * FROM wishes ${whereClause}
       ORDER BY created_at DESC`,
      params
    );

    return result.rows.map(row => this.formatWish(row));
  }

  // 获取单个心愿
  async getWish(userId: string, wishId: string) {
    const result = await query(
      'SELECT * FROM wishes WHERE id = $1',
      [wishId]
    );

    if (result.rows.length === 0) {
      throw new AppError('心愿不存在', 404);
    }

    const wish = result.rows[0];

    // 验证所有权
    if (wish.user_id !== userId) {
      throw new AppError('无权访问此心愿', 403);
    }

    return this.formatWish(wish);
  }

  // 更新心愿
  async updateWish(userId: string, wishId: string, input: UpdateWishInput) {
    // 先验证所有权
    await this.getWish(userId, wishId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (input.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      params.push(input.content);
    }

    if (input.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(input.category);
    }

    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(input.status);

      // 如果状态变为fulfilled，记录实现时间
      if (input.status === 'fulfilled') {
        updates.push(`fulfilled_at = NOW()`);
      }
    }

    if (updates.length === 0) {
      throw new AppError('没有要更新的内容', 400);
    }

    updates.push(`updated_at = NOW()`);
    params.push(wishId);

    const result = await query(
      `UPDATE wishes SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    return this.formatWish(result.rows[0]);
  }

  // 删除心愿
  async deleteWish(userId: string, wishId: string) {
    // 先验证所有权
    await this.getWish(userId, wishId);

    await query('DELETE FROM wishes WHERE id = $1', [wishId]);
    return { success: true };
  }

  // 获取心愿统计
  async getStats(userId: string) {
    const result = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'fulfilled') as fulfilled,
        category,
        COUNT(*) as category_count
       FROM wishes
       WHERE user_id = $1
       GROUP BY category`,
      [userId]
    );

    const totalResult = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'fulfilled') as fulfilled
       FROM wishes
       WHERE user_id = $1`,
      [userId]
    );

    const byCategory: Record<string, number> = {};
    result.rows.forEach(row => {
      byCategory[row.category] = parseInt(row.category_count);
    });

    return {
      total: parseInt(totalResult.rows[0]?.total || '0'),
      pending: parseInt(totalResult.rows[0]?.pending || '0'),
      fulfilled: parseInt(totalResult.rows[0]?.fulfilled || '0'),
      byCategory,
    };
  }

  // 格式化心愿对象
  private formatWish(row: any) {
    return {
      id: row.id,
      userId: row.user_id,
      content: row.content,
      category: row.category,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      fulfilledAt: row.fulfilled_at,
    };
  }
}

export const wishesService = new WishesService();
