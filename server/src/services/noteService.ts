import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface CreateNoteData {
  userId: string;
  title: string;
  content: string;
  resourceType?: string;
  resourceId?: string;
  tags?: string[];
}

interface UpdateNoteData {
  title?: string;
  content?: string;
  resourceType?: string;
  resourceId?: string;
  tags?: string[];
  isFavorite?: boolean;
}

interface Note {
  id: number;
  user_id: string;
  title: string;
  content: string;
  resource_type: string;
  resource_id: string;
  tags: string[];
  is_favorite: boolean;
  created_at: Date;
  updated_at: Date;
}

export const noteService = {
  /**
   * 创建笔记
   */
  async createNote(data: CreateNoteData): Promise<Note> {
    const { userId, title, content, resourceType, resourceId, tags = [] } = data;

    if (!title || title.trim().length === 0) {
      throw new AppError('笔记标题不能为空', 400);
    }

    if (!content || content.trim().length === 0) {
      throw new AppError('笔记内容不能为空', 400);
    }

    const result = await query(
      `INSERT INTO notes (user_id, title, content, resource_type, resource_id, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title, content, resourceType, resourceId, tags]
    );

    return result.rows[0];
  },

  /**
   * 获取用户的笔记列表
   */
  async getUserNotes(
    userId: string,
    options: {
      search?: string;
      tags?: string[];
      isFavorite?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    notes: Note[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { search, tags, isFavorite, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM notes WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    // 搜索标题和内容
    if (search) {
      sql += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 按标签筛选
    if (tags && tags.length > 0) {
      sql += ` AND tags && $${paramIndex}`;
      params.push(tags);
      paramIndex++;
    }

    // 只显示收藏
    if (isFavorite) {
      sql += ` AND is_favorite = true`;
    }

    // 获取总数
    const countResult = await query(
      sql.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取笔记列表
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    return {
      notes: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  /**
   * 获取笔记详情
   */
  async getNoteById(noteId: number, userId: string): Promise<Note> {
    const result = await query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('笔记不存在', 404);
    }

    return result.rows[0];
  },

  /**
   * 更新笔记
   */
  async updateNote(noteId: number, userId: string, data: UpdateNoteData): Promise<Note> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      if (data.title.trim().length === 0) {
        throw new AppError('笔记标题不能为空', 400);
      }
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }

    if (data.content !== undefined) {
      if (data.content.trim().length === 0) {
        throw new AppError('笔记内容不能为空', 400);
      }
      updates.push(`content = $${paramIndex++}`);
      params.push(data.content);
    }

    if (data.resourceType !== undefined) {
      updates.push(`resource_type = $${paramIndex++}`);
      params.push(data.resourceType);
    }

    if (data.resourceId !== undefined) {
      updates.push(`resource_id = $${paramIndex++}`);
      params.push(data.resourceId);
    }

    if (data.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      params.push(data.tags);
    }

    if (data.isFavorite !== undefined) {
      updates.push(`is_favorite = $${paramIndex++}`);
      params.push(data.isFavorite);
    }

    if (updates.length === 0) {
      throw new AppError('没有要更新的内容', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(noteId, userId);

    const result = await query(
      `UPDATE notes SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('笔记不存在', 404);
    }

    return result.rows[0];
  },

  /**
   * 删除笔记
   */
  async deleteNote(noteId: number, userId: string): Promise<void> {
    const result = await query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('笔记不存在', 404);
    }
  },

  /**
   * 获取所有标签
   */
  async getAllTags(userId: string): Promise<string[]> {
    const result = await query(
      `SELECT DISTINCT unnest(tags) as tag
       FROM notes
       WHERE user_id = $1 AND tags IS NOT NULL
       ORDER BY tag`,
      [userId]
    );

    return result.rows.map(row => row.tag);
  }
};
