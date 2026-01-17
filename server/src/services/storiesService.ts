import { query } from '../config/database';

// 故事播放记录接口
interface PlayRecord {
  id: string;
  userId?: string;
  storyId: string;
  duration: number;
  playedAt: string;
  createdAt: string;
}

// 格式化播放记录
function formatPlayRecord(row: any): PlayRecord {
  return {
    id: row.id,
    userId: row.user_id,
    storyId: row.story_id,
    duration: row.duration,
    playedAt: row.played_at,
    createdAt: row.created_at,
  };
}

export class StoriesService {
  /**
   * 记录故事播放
   */
  async recordPlay(userId: string | undefined, storyId: string, duration?: number): Promise<PlayRecord> {
    const sql = `
      INSERT INTO story_play_records (user_id, story_id, duration)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await query(sql, [userId || null, storyId, duration || 0]);
    return formatPlayRecord(result.rows[0]);
  }

  /**
   * 获取播放历史
   */
  async getPlayHistory(userId: string, limit: number = 50): Promise<PlayRecord[]> {
    const sql = `
      SELECT * FROM story_play_records
      WHERE user_id = $1
      ORDER BY played_at DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows.map(formatPlayRecord);
  }

  /**
   * 获取推荐故事（基于播放历史）
   */
  async getRecommendedStories(userId: string, limit: number = 10): Promise<string[]> {
    const sql = `
      SELECT story_id, COUNT(*) as play_count
      FROM story_play_records
      WHERE user_id = $1
      GROUP BY story_id
      ORDER BY play_count DESC, MAX(played_at) DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows.map(row => row.story_id);
  }

  /**
   * 获取热门故事
   */
  async getHotStories(limit: number = 10): Promise<{ storyId: string; playCount: number }[]> {
    const sql = `
      SELECT story_id, COUNT(*) as play_count
      FROM story_play_records
      WHERE played_at > NOW() - INTERVAL '7 days'
      GROUP BY story_id
      ORDER BY play_count DESC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows.map(row => ({
      storyId: row.story_id,
      playCount: parseInt(row.play_count)
    }));
  }
}

export const storiesService = new StoriesService();
