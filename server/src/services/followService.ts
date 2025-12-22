import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export class FollowService {
  // 关注用户
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError('不能关注自己', 400);
    }

    // 检查目标用户是否存在
    const userResult = await query('SELECT id FROM users WHERE id = $1', [followingId]);
    if (userResult.rows.length === 0) {
      throw new AppError('用户不存在', 404);
    }

    // 检查是否已经关注
    const existingFollow = await query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    if (existingFollow.rows.length > 0) {
      throw new AppError('已经关注该用户', 400);
    }

    await query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
      [followerId, followingId]
    );

    return { message: '关注成功' };
  }

  // 取消关注
  async unfollow(followerId: string, followingId: string) {
    const result = await query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 RETURNING id',
      [followerId, followingId]
    );

    if (result.rows.length === 0) {
      throw new AppError('未关注该用户', 400);
    }

    return { message: '取消关注成功' };
  }

  // 获取粉丝列表
  async getFollowers(userId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const countResult = await query(
      'SELECT COUNT(*) FROM follows WHERE following_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT u.id, u.nickname, u.avatar, u.bio, f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    );

    return {
      list: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取关注列表
  async getFollowing(userId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const countResult = await query(
      'SELECT COUNT(*) FROM follows WHERE follower_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT u.id, u.nickname, u.avatar, u.bio, f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
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

export const followService = new FollowService();
