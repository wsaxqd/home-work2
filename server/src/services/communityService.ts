import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export class CommunityService {
  // ============ 点赞功能 ============

  // 点赞作品
  async likeWork(workId: string, userId: string) {
    // 检查作品是否存在
    const workResult = await query('SELECT id FROM works WHERE id = $1', [workId]);
    if (workResult.rows.length === 0) {
      throw new AppError('作品不存在', 404);
    }

    // 检查是否已点赞
    const existingLike = await query(
      'SELECT id FROM likes WHERE work_id = $1 AND user_id = $2',
      [workId, userId]
    );

    if (existingLike.rows.length > 0) {
      throw new AppError('已点赞该作品', 400);
    }

    // 添加点赞
    await query(
      'INSERT INTO likes (work_id, user_id) VALUES ($1, $2)',
      [workId, userId]
    );

    // 更新作品点赞数
    await query(
      'UPDATE works SET like_count = like_count + 1 WHERE id = $1',
      [workId]
    );

    return { message: '点赞成功' };
  }

  // 取消点赞
  async unlikeWork(workId: string, userId: string) {
    const result = await query(
      'DELETE FROM likes WHERE work_id = $1 AND user_id = $2 RETURNING id',
      [workId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('未点赞该作品', 400);
    }

    // 更新作品点赞数
    await query(
      'UPDATE works SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
      [workId]
    );

    return { message: '取消点赞成功' };
  }

  // ============ 评论功能 ============

  // 发表评论
  async createComment(workId: string, userId: string, content: string, parentId?: string) {
    // 检查作品是否存在
    const workResult = await query('SELECT id FROM works WHERE id = $1', [workId]);
    if (workResult.rows.length === 0) {
      throw new AppError('作品不存在', 404);
    }

    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const parentResult = await query('SELECT id FROM comments WHERE id = $1', [parentId]);
      if (parentResult.rows.length === 0) {
        throw new AppError('父评论不存在', 404);
      }
    }

    const result = await query(
      `INSERT INTO comments (work_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [workId, userId, content, parentId || null]
    );

    // 更新作品评论数
    await query(
      'UPDATE works SET comment_count = comment_count + 1 WHERE id = $1',
      [workId]
    );

    return result.rows[0];
  }

  // 获取评论列表
  async getComments(workId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const countResult = await query(
      'SELECT COUNT(*) FROM comments WHERE work_id = $1 AND parent_id IS NULL',
      [workId]
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取主评论
    const result = await query(
      `SELECT c.*, u.nickname, u.avatar,
        (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as reply_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.work_id = $1 AND c.parent_id IS NULL
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [workId, pageSize, offset]
    );

    return {
      list: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取评论回复
  async getCommentReplies(commentId: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const countResult = await query(
      'SELECT COUNT(*) FROM comments WHERE parent_id = $1',
      [commentId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT c.*, u.nickname, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.parent_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [commentId, pageSize, offset]
    );

    return {
      list: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 删除评论
  async deleteComment(commentId: string, userId: string) {
    const result = await query(
      'SELECT work_id, user_id FROM comments WHERE id = $1',
      [commentId]
    );

    if (result.rows.length === 0) {
      throw new AppError('评论不存在', 404);
    }

    if (result.rows[0].user_id !== userId) {
      throw new AppError('无权删除该评论', 403);
    }

    const workId = result.rows[0].work_id;

    // 删除评论及其回复
    const deleteResult = await query(
      'DELETE FROM comments WHERE id = $1 OR parent_id = $1 RETURNING id',
      [commentId]
    );

    // 更新作品评论数
    await query(
      'UPDATE works SET comment_count = GREATEST(comment_count - $1, 0) WHERE id = $2',
      [deleteResult.rows.length, workId]
    );

    return { message: '删除成功' };
  }

  // ============ 心愿墙功能 ============

  // 发布心愿
  async createWish(userId: string, content: string) {
    const result = await query(
      'INSERT INTO wishes (user_id, content) VALUES ($1, $2) RETURNING *',
      [userId, content]
    );

    return result.rows[0];
  }

  // 获取心愿墙
  async getWishes(page: number = 1, pageSize: number = 20, status?: string) {
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause = `WHERE w.status = $${paramIndex++}`;
      params.push(status);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM wishes w ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(pageSize, offset);
    const result = await query(
      `SELECT w.*, u.nickname, u.avatar
       FROM wishes w
       JOIN users u ON w.user_id = u.id
       ${whereClause}
       ORDER BY w.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return {
      list: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 支持心愿（点赞）
  async supportWish(wishId: string, userId: string) {
    // 检查心愿是否存在
    const wishResult = await query('SELECT id FROM wishes WHERE id = $1', [wishId]);
    if (wishResult.rows.length === 0) {
      throw new AppError('心愿不存在', 404);
    }

    // 更新点赞数
    await query(
      'UPDATE wishes SET like_count = like_count + 1 WHERE id = $1',
      [wishId]
    );

    return { message: '支持成功' };
  }

  // 更新心愿状态
  async updateWishStatus(wishId: string, userId: string, status: 'pending' | 'in_progress' | 'completed') {
    const result = await query(
      'SELECT user_id FROM wishes WHERE id = $1',
      [wishId]
    );

    if (result.rows.length === 0) {
      throw new AppError('心愿不存在', 404);
    }

    if (result.rows[0].user_id !== userId) {
      throw new AppError('无权修改该心愿', 403);
    }

    const updateResult = await query(
      `UPDATE wishes SET status = $1,
       completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = $2
       RETURNING *`,
      [status, wishId]
    );

    return updateResult.rows[0];
  }
}

export const communityService = new CommunityService();
