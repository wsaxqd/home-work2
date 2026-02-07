import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface CreateFeedbackData {
  userId: string;
  type: 'bug' | 'feature' | 'other';
  content: string;
  images?: string[];
  contact?: string;
}

interface Feedback {
  id: number;
  user_id: string;
  type: string;
  content: string;
  images: string[];
  contact: string;
  status: string;
  admin_reply: string | null;
  replied_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const feedbackService = {
  /**
   * 创建反馈
   */
  async createFeedback(data: CreateFeedbackData): Promise<Feedback> {
    const { userId, type, content, images = [], contact } = data;

    // 验证内容长度
    if (content.length < 10) {
      throw new AppError('反馈内容至少需要10个字符', 400);
    }

    if (content.length > 1000) {
      throw new AppError('反馈内容不能超过1000个字符', 400);
    }

    // 验证图片数量
    if (images.length > 5) {
      throw new AppError('最多只能上传5张图片', 400);
    }

    const result = await query(
      `INSERT INTO feedback (user_id, type, content, images, contact)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, content, images, contact]
    );

    return result.rows[0];
  },

  /**
   * 获取用户的反馈列表
   */
  async getUserFeedback(userId: string, page: number = 1, limit: number = 20): Promise<{
    feedbacks: Feedback[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    // 获取总数
    const countResult = await query(
      'SELECT COUNT(*) FROM feedback WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取反馈列表
    const result = await query(
      `SELECT * FROM feedback
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      feedbacks: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  /**
   * 获取反馈详情
   */
  async getFeedbackById(feedbackId: number, userId: string): Promise<Feedback> {
    const result = await query(
      'SELECT * FROM feedback WHERE id = $1 AND user_id = $2',
      [feedbackId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('反馈不存在', 404);
    }

    return result.rows[0];
  },

  /**
   * 删除反馈（仅允许删除未处理的反馈）
   */
  async deleteFeedback(feedbackId: number, userId: string): Promise<void> {
    const result = await query(
      `DELETE FROM feedback
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING id`,
      [feedbackId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('无法删除该反馈（不存在或已被处理）', 400);
    }
  }
};
