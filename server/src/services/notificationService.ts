import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export type NotificationType = 'like' | 'comment' | 'follow' | 'achievement' | 'system';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: string;
  relatedType?: string;
}

export class NotificationService {
  // 创建通知
  async createNotification(input: CreateNotificationInput) {
    const { userId, type, title, content, relatedId, relatedType } = input;

    const result = await query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, content, relatedId || null, relatedType || null]
    );

    return result.rows[0];
  }

  // 批量创建通知（用于系统通知）
  async createBulkNotifications(userIds: string[], type: NotificationType, title: string, content: string) {
    const values = userIds.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ');
    const params = userIds.flatMap(userId => [userId, type, title, content]);

    await query(
      `INSERT INTO notifications (user_id, type, title, content) VALUES ${values}`,
      params
    );

    return { message: `已向 ${userIds.length} 位用户发送通知` };
  }

  // 获取用户通知列表
  async getNotifications(userId: string, page: number = 1, pageSize: number = 20, type?: NotificationType) {
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM notifications ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(pageSize, offset);
    const result = await query(
      `SELECT * FROM notifications ${whereClause}
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

  // 获取未读通知数量
  async getUnreadCount(userId: string) {
    const result = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    return {
      unreadCount: parseInt(result.rows[0].count),
    };
  }

  // 标记通知为已读
  async markAsRead(notificationId: string, userId: string) {
    const result = await query(
      `UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('通知不存在', 404);
    }

    return result.rows[0];
  }

  // 标记所有通知为已读
  async markAllAsRead(userId: string) {
    await query(
      `UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return { message: '已全部标记为已读' };
  }

  // 删除通知
  async deleteNotification(notificationId: string, userId: string) {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('通知不存在', 404);
    }

    return { message: '删除成功' };
  }

  // 清空所有已读通知
  async clearReadNotifications(userId: string) {
    const result = await query(
      'DELETE FROM notifications WHERE user_id = $1 AND is_read = true RETURNING id',
      [userId]
    );

    return { message: `已清除 ${result.rows.length} 条已读通知` };
  }

  // 发送点赞通知
  async sendLikeNotification(workOwnerId: string, likerNickname: string, workTitle: string, workId: string) {
    return this.createNotification({
      userId: workOwnerId,
      type: 'like',
      title: '收到新点赞',
      content: `${likerNickname} 点赞了你的作品「${workTitle}」`,
      relatedId: workId,
      relatedType: 'work',
    });
  }

  // 发送评论通知
  async sendCommentNotification(workOwnerId: string, commenterNickname: string, workTitle: string, workId: string) {
    return this.createNotification({
      userId: workOwnerId,
      type: 'comment',
      title: '收到新评论',
      content: `${commenterNickname} 评论了你的作品「${workTitle}」`,
      relatedId: workId,
      relatedType: 'work',
    });
  }

  // 发送关注通知
  async sendFollowNotification(followedUserId: string, followerNickname: string, followerId: string) {
    return this.createNotification({
      userId: followedUserId,
      type: 'follow',
      title: '新粉丝',
      content: `${followerNickname} 关注了你`,
      relatedId: followerId,
      relatedType: 'user',
    });
  }

  // 发送成就通知
  async sendAchievementNotification(userId: string, achievementName: string, achievementId: string) {
    return this.createNotification({
      userId,
      type: 'achievement',
      title: '获得新成就',
      content: `恭喜你获得成就「${achievementName}」！`,
      relatedId: achievementId,
      relatedType: 'achievement',
    });
  }
}

export const notificationService = new NotificationService();
