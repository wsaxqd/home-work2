import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface Topic {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  participantCount: number;
  workCount: number;
  isFeatured: boolean;
  status: string;
  startDate?: Date;
  endDate?: Date;
}

export class TopicService {
  /**
   * 获取话题列表
   */
  async getTopics(status: string = 'active', isFeatured?: boolean) {
    let whereClause = 'WHERE status = $1';
    const params: any[] = [status];
    let paramIndex = 2;

    if (isFeatured !== undefined) {
      whereClause += ` AND is_featured = $${paramIndex++}`;
      params.push(isFeatured);
    }

    const result = await query(
      `SELECT * FROM topics ${whereClause} ORDER BY is_featured DESC, created_at DESC`,
      params
    );

    return result.rows;
  }

  /**
   * 参与话题
   */
  async participateInTopic(topicId: string, workId: string, userId: string) {
    // 检查话题是否存在
    const topicResult = await query('SELECT id, status FROM topics WHERE id = $1', [topicId]);
    if (topicResult.rows.length === 0) {
      throw new AppError('话题不存在', 404);
    }
    if (topicResult.rows[0].status !== 'active') {
      throw new AppError('话题已结束', 400);
    }

    // 检查作品是否存在
    const workResult = await query('SELECT id FROM works WHERE id = $1 AND user_id = $2', [workId, userId]);
    if (workResult.rows.length === 0) {
      throw new AppError('作品不存在或无权限', 404);
    }

    // 检查是否已参与
    const existingResult = await query(
      'SELECT id FROM topic_participants WHERE topic_id = $1 AND work_id = $2',
      [topicId, workId]
    );

    if (existingResult.rows.length > 0) {
      throw new AppError('该作品已参与此话题', 400);
    }

    // 添加参与记录
    await query(
      'INSERT INTO topic_participants (topic_id, work_id, user_id) VALUES ($1, $2, $3)',
      [topicId, workId, userId]
    );

    // 更新话题统计
    await query(
      'UPDATE topics SET participant_count = participant_count + 1, work_count = work_count + 1 WHERE id = $1',
      [topicId]
    );

    return { message: '参与成功' };
  }

  /**
   * 获取话题下的作品
   */
  async getTopicWorks(topicId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const countResult = await query(
      'SELECT COUNT(*) FROM topic_participants WHERE topic_id = $1',
      [topicId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT w.*, u.nickname, u.avatar, tp.created_at as participated_at
       FROM topic_participants tp
       JOIN works w ON tp.work_id = w.id
       JOIN users u ON w.user_id = u.id
       WHERE tp.topic_id = $1
       ORDER BY tp.created_at DESC
       LIMIT $2 OFFSET $3`,
      [topicId, pageSize, offset]
    );

    return {
      list: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const topicService = new TopicService();
