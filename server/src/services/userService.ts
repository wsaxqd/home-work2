import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface UpdateProfileInput {
  nickname?: string;
  avatar?: string;
  bio?: string;
}

export class UserService {
  // 获取用户信息
  async getProfile(userId: string) {
    const result = await query(
      `SELECT id, phone, nickname, avatar, bio, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('用户不存在', 404);
    }

    const user = result.rows[0];

    // 获取用户统计数据
    const statsResult = await query(
      `SELECT
        (SELECT COUNT(*) FROM works WHERE user_id = $1) as works_count,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = $1) as achievements_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count`,
      [userId]
    );

    const stats = statsResult.rows[0];

    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      stats: {
        worksCount: parseInt(stats.works_count),
        achievementsCount: parseInt(stats.achievements_count),
        followersCount: parseInt(stats.followers_count),
        followingCount: parseInt(stats.following_count),
      },
    };
  }

  // 更新用户信息
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.nickname !== undefined) {
      updates.push(`nickname = $${paramIndex++}`);
      values.push(input.nickname);
    }

    if (input.avatar !== undefined) {
      updates.push(`avatar = $${paramIndex++}`);
      values.push(input.avatar);
    }

    if (input.bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      values.push(input.bio);
    }

    if (updates.length === 0) {
      throw new AppError('没有要更新的内容', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, phone, nickname, avatar, bio, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('用户不存在', 404);
    }

    return result.rows[0];
  }

  // 获取其他用户信息
  async getUserById(userId: string, currentUserId?: string) {
    const result = await query(
      `SELECT id, nickname, avatar, bio, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('用户不存在', 404);
    }

    const user = result.rows[0];

    // 获取统计数据
    const statsResult = await query(
      `SELECT
        (SELECT COUNT(*) FROM works WHERE user_id = $1 AND status = 'published') as works_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count`,
      [userId]
    );

    const stats = statsResult.rows[0];

    // 检查当前用户是否关注了该用户
    let isFollowing = false;
    if (currentUserId) {
      const followResult = await query(
        'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
        [currentUserId, userId]
      );
      isFollowing = followResult.rows.length > 0;
    }

    return {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.created_at,
      stats: {
        worksCount: parseInt(stats.works_count),
        followersCount: parseInt(stats.followers_count),
        followingCount: parseInt(stats.following_count),
      },
      isFollowing,
    };
  }

  // 获取用户统计数据
  async getUserStats(userId: string) {
    const result = await query(
      `SELECT
        (SELECT COUNT(*) FROM works WHERE user_id = $1) as total_works,
        (SELECT COUNT(*) FROM works WHERE user_id = $1 AND status = 'published') as published_works,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = $1) as achievements,
        (SELECT COALESCE(SUM(like_count), 0) FROM works WHERE user_id = $1) as total_likes,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following,
        (SELECT COUNT(*) FROM diaries WHERE user_id = $1) as diaries,
        (SELECT COALESCE(SUM(total_plays), 0) FROM game_progress WHERE user_id = $1) as game_plays`,
      [userId]
    );

    const stats = result.rows[0];

    return {
      totalWorks: parseInt(stats.total_works),
      publishedWorks: parseInt(stats.published_works),
      achievements: parseInt(stats.achievements),
      totalLikes: parseInt(stats.total_likes),
      followers: parseInt(stats.followers),
      following: parseInt(stats.following),
      diaries: parseInt(stats.diaries),
      gamePlays: parseInt(stats.game_plays),
    };
  }
}

export const userService = new UserService();
