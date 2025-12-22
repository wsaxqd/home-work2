import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export type WorkType = 'story' | 'music' | 'art' | 'poem';
export type WorkStatus = 'draft' | 'published' | 'archived';

export interface CreateWorkInput {
  type: WorkType;
  title: string;
  content?: string;
  coverImage?: string;
  audioUrl?: string;
}

export interface UpdateWorkInput {
  title?: string;
  content?: string;
  coverImage?: string;
  audioUrl?: string;
}

export class WorkService {
  // 创建作品
  async create(userId: string, input: CreateWorkInput) {
    const { type, title, content, coverImage, audioUrl } = input;

    const result = await query(
      `INSERT INTO works (user_id, type, title, content, cover_image, audio_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, content, coverImage, audioUrl]
    );

    return result.rows[0];
  }

  // 获取用户作品列表
  async getUserWorks(
    userId: string,
    options: { type?: WorkType; status?: WorkStatus; page?: number; pageSize?: number } = {}
  ) {
    const { type, status, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM works ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(pageSize, offset);
    const result = await query(
      `SELECT * FROM works ${whereClause}
       ORDER BY created_at DESC
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

  // 获取作品详情
  async getById(workId: string, userId?: string) {
    const result = await query(
      `SELECT w.*, u.nickname as author_name, u.avatar as author_avatar
       FROM works w
       JOIN users u ON w.user_id = u.id
       WHERE w.id = $1`,
      [workId]
    );

    if (result.rows.length === 0) {
      throw new AppError('作品不存在', 404);
    }

    const work = result.rows[0];

    // 检查是否有权限查看
    if (work.status !== 'published' && work.user_id !== userId) {
      throw new AppError('无权查看该作品', 403);
    }

    // 增加浏览次数
    await query(
      'UPDATE works SET view_count = view_count + 1 WHERE id = $1',
      [workId]
    );

    // 检查当前用户是否点赞
    let isLiked = false;
    if (userId) {
      const likeResult = await query(
        'SELECT id FROM likes WHERE work_id = $1 AND user_id = $2',
        [workId, userId]
      );
      isLiked = likeResult.rows.length > 0;
    }

    return {
      ...work,
      isLiked,
    };
  }

  // 更新作品
  async update(workId: string, userId: string, input: UpdateWorkInput) {
    // 检查作品所有权
    const checkResult = await query(
      'SELECT user_id, status FROM works WHERE id = $1',
      [workId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('作品不存在', 404);
    }

    if (checkResult.rows[0].user_id !== userId) {
      throw new AppError('无权修改该作品', 403);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(input.title);
    }

    if (input.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(input.content);
    }

    if (input.coverImage !== undefined) {
      updates.push(`cover_image = $${paramIndex++}`);
      values.push(input.coverImage);
    }

    if (input.audioUrl !== undefined) {
      updates.push(`audio_url = $${paramIndex++}`);
      values.push(input.audioUrl);
    }

    if (updates.length === 0) {
      throw new AppError('没有要更新的内容', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(workId);

    const result = await query(
      `UPDATE works SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // 删除作品
  async delete(workId: string, userId: string) {
    const checkResult = await query(
      'SELECT user_id FROM works WHERE id = $1',
      [workId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('作品不存在', 404);
    }

    if (checkResult.rows[0].user_id !== userId) {
      throw new AppError('无权删除该作品', 403);
    }

    await query('DELETE FROM works WHERE id = $1', [workId]);

    return { message: '删除成功' };
  }

  // 发布作品
  async publish(workId: string, userId: string) {
    const checkResult = await query(
      'SELECT user_id, status FROM works WHERE id = $1',
      [workId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('作品不存在', 404);
    }

    if (checkResult.rows[0].user_id !== userId) {
      throw new AppError('无权发布该作品', 403);
    }

    if (checkResult.rows[0].status === 'published') {
      throw new AppError('作品已发布', 400);
    }

    const result = await query(
      `UPDATE works SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [workId]
    );

    return result.rows[0];
  }

  // 取消发布
  async unpublish(workId: string, userId: string) {
    const checkResult = await query(
      'SELECT user_id, status FROM works WHERE id = $1',
      [workId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('作品不存在', 404);
    }

    if (checkResult.rows[0].user_id !== userId) {
      throw new AppError('无权操作该作品', 403);
    }

    if (checkResult.rows[0].status !== 'published') {
      throw new AppError('作品未发布', 400);
    }

    const result = await query(
      `UPDATE works SET status = 'draft', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [workId]
    );

    return result.rows[0];
  }

  // 获取公开作品画廊
  async getGallery(options: { type?: WorkType; page?: number; pageSize?: number } = {}) {
    const { type, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE w.status = 'published'";
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      whereClause += ` AND w.type = $${paramIndex++}`;
      params.push(type);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM works w ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(pageSize, offset);
    const result = await query(
      `SELECT w.*, u.nickname as author_name, u.avatar as author_avatar
       FROM works w
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

  // 获取热门作品
  async getTrending(limit: number = 10) {
    const result = await query(
      `SELECT w.*, u.nickname as author_name, u.avatar as author_avatar
       FROM works w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'published'
       ORDER BY (w.like_count + w.comment_count + w.view_count) DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

export const workService = new WorkService();
