import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export type GameType = 'expression' | 'image_recognition';

export interface SaveScoreInput {
  gameType: GameType;
  score: number;
  level?: number;
  accuracy?: number;
  duration?: number;
}

export class GameService {
  // 保存游戏成绩
  async saveScore(userId: string, input: SaveScoreInput) {
    const { gameType, score, level, accuracy, duration } = input;

    // 保存成绩记录
    const result = await query(
      `INSERT INTO game_scores (user_id, game_type, score, level, accuracy, duration)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, gameType, score, level || 1, accuracy, duration]
    );

    // 更新游戏进度
    await this.updateProgress(userId, gameType, score, level || 1, duration || 0);

    return result.rows[0];
  }

  // 更新游戏进度
  private async updateProgress(userId: string, gameType: GameType, score: number, level: number, duration: number) {
    // 检查是否存在进度记录
    const existingProgress = await query(
      'SELECT * FROM game_progress WHERE user_id = $1 AND game_type = $2',
      [userId, gameType]
    );

    if (existingProgress.rows.length === 0) {
      // 创建新进度记录
      await query(
        `INSERT INTO game_progress (user_id, game_type, highest_score, highest_level, total_plays, total_time)
         VALUES ($1, $2, $3, $4, 1, $5)`,
        [userId, gameType, score, level, duration]
      );
    } else {
      const current = existingProgress.rows[0];
      // 更新进度
      await query(
        `UPDATE game_progress SET
         highest_score = GREATEST(highest_score, $1),
         highest_level = GREATEST(highest_level, $2),
         total_plays = total_plays + 1,
         total_time = total_time + $3,
         progress = LEAST(100, progress + 5),
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4 AND game_type = $5`,
        [score, level, duration, userId, gameType]
      );
    }
  }

  // 获取游戏进度
  async getProgress(userId: string, gameType?: GameType) {
    if (gameType) {
      const result = await query(
        'SELECT * FROM game_progress WHERE user_id = $1 AND game_type = $2',
        [userId, gameType]
      );

      if (result.rows.length === 0) {
        return {
          gameType,
          progress: 0,
          highestScore: 0,
          highestLevel: 1,
          totalPlays: 0,
          totalTime: 0,
        };
      }

      const row = result.rows[0];
      return {
        gameType: row.game_type,
        progress: parseFloat(row.progress),
        highestScore: row.highest_score,
        highestLevel: row.highest_level,
        totalPlays: row.total_plays,
        totalTime: row.total_time,
      };
    }

    // 获取所有游戏进度
    const result = await query(
      'SELECT * FROM game_progress WHERE user_id = $1',
      [userId]
    );

    const progressMap: Record<string, any> = {};
    for (const row of result.rows) {
      progressMap[row.game_type] = {
        progress: parseFloat(row.progress),
        highestScore: row.highest_score,
        highestLevel: row.highest_level,
        totalPlays: row.total_plays,
        totalTime: row.total_time,
      };
    }

    return progressMap;
  }

  // 获取排行榜
  async getLeaderboard(gameType: GameType, limit: number = 10) {
    const result = await query(
      `SELECT gp.*, u.nickname, u.avatar
       FROM game_progress gp
       JOIN users u ON gp.user_id = u.id
       WHERE gp.game_type = $1
       ORDER BY gp.highest_score DESC
       LIMIT $2`,
      [gameType, limit]
    );

    return result.rows.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      nickname: row.nickname,
      avatar: row.avatar,
      highestScore: row.highest_score,
      highestLevel: row.highest_level,
    }));
  }

  // 获取用户排名
  async getUserRank(userId: string, gameType: GameType) {
    const result = await query(
      `SELECT COUNT(*) + 1 as rank
       FROM game_progress
       WHERE game_type = $1 AND highest_score > (
         SELECT COALESCE(highest_score, 0)
         FROM game_progress
         WHERE user_id = $2 AND game_type = $1
       )`,
      [gameType, userId]
    );

    return parseInt(result.rows[0].rank);
  }

  // 获取用户游戏历史记录
  async getHistory(userId: string, gameType?: GameType, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (gameType) {
      whereClause += ` AND game_type = $${paramIndex++}`;
      params.push(gameType);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM game_scores ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(pageSize, offset);
    const result = await query(
      `SELECT * FROM game_scores ${whereClause}
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
}

export const gameService = new GameService();
