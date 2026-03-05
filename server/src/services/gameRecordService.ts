import { query } from '../config/database';

export interface GameRecord {
  id?: string;
  user_id: string;
  game_type: string;
  difficulty: string;
  score: number;
  time_spent: number;
  best_streak: number;
  accuracy: number;
  metadata?: any;
  created_at?: Date;
}

export interface GameStatistics {
  id?: string;
  user_id: string;
  game_type: string;
  total_plays: number;
  total_score: number;
  highest_score: number;
  average_score: number;
  total_time: number;
  best_streak: number;
  average_accuracy: number;
  last_played_at?: Date;
  updated_at?: Date;
}

export interface LeaderboardEntry {
  id?: string;
  user_id: string;
  username?: string;
  avatar?: string;
  game_type: string;
  difficulty: string;
  score: number;
  rank: number;
  achieved_at?: Date;
}

class GameRecordService {
  // 保存游戏记录
  async saveGameRecord(record: GameRecord): Promise<GameRecord> {
    const result = await query(
      `INSERT INTO game_records (user_id, game_type, difficulty, score, time_spent, best_streak, accuracy, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [record.user_id, record.game_type, record.difficulty, record.score, record.time_spent, record.best_streak, record.accuracy, record.metadata]
    );

    const savedRecord = result.rows[0];

    // 更新游戏统计
    await this.updateGameStatistics(record.user_id, record.game_type);

    // 更新排行榜
    await this.updateLeaderboard(record.user_id, record.game_type, record.difficulty, record.score);

    return savedRecord;
  }

  // 更新游戏统计
  async updateGameStatistics(userId: string, gameType: string): Promise<void> {
    // 获取该用户该游戏的所有记录
    const result = await query(
      'SELECT * FROM game_records WHERE user_id = $1 AND game_type = $2',
      [userId, gameType]
    );

    const records = result.rows;
    if (records.length === 0) return;

    // 计算统计数据
    const totalPlays = records.length;
    const totalScore = records.reduce((sum, r) => sum + r.score, 0);
    const highestScore = Math.max(...records.map(r => r.score));
    const averageScore = totalScore / totalPlays;
    const totalTime = records.reduce((sum, r) => sum + r.time_spent, 0);
    const bestStreak = Math.max(...records.map(r => r.best_streak));
    const averageAccuracy = records.reduce((sum, r) => sum + r.accuracy, 0) / totalPlays;

    // 检查是否已有统计记录
    const existingResult = await query(
      'SELECT * FROM game_statistics WHERE user_id = $1 AND game_type = $2',
      [userId, gameType]
    );

    if (existingResult.rows.length > 0) {
      // 更新统计数据
      await query(
        `UPDATE game_statistics
         SET total_plays = $1, total_score = $2, highest_score = $3, average_score = $4,
             total_time = $5, best_streak = $6, average_accuracy = $7,
             last_played_at = NOW(), updated_at = NOW()
         WHERE user_id = $8 AND game_type = $9`,
        [totalPlays, totalScore, highestScore, averageScore, totalTime, bestStreak, averageAccuracy, userId, gameType]
      );
    } else {
      // 插入新统计数据
      await query(
        `INSERT INTO game_statistics
         (user_id, game_type, total_plays, total_score, highest_score, average_score, total_time, best_streak, average_accuracy)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, gameType, totalPlays, totalScore, highestScore, averageScore, totalTime, bestStreak, averageAccuracy]
      );
    }
  }

  // 更新排行榜
  async updateLeaderboard(userId: string, gameType: string, difficulty: string, score: number): Promise<void> {
    // 检查是否已有记录
    const existingResult = await query(
      'SELECT * FROM global_leaderboard WHERE user_id = $1 AND game_type = $2 AND difficulty = $3',
      [userId, gameType, difficulty]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      // 如果新分数更高,更新记录
      if (score > existing.score) {
        await query(
          'UPDATE global_leaderboard SET score = $1, updated_at = NOW() WHERE user_id = $2 AND game_type = $3 AND difficulty = $4',
          [score, userId, gameType, difficulty]
        );
      }
    } else {
      // 插入新记录
      await query(
        'INSERT INTO global_leaderboard (user_id, game_type, difficulty, score, rank) VALUES ($1, $2, $3, $4, 0)',
        [userId, gameType, difficulty, score]
      );
    }

    // 重新计算排名
    await this.recalculateRanks(gameType, difficulty);
  }

  // 重新计算排名
  async recalculateRanks(gameType: string, difficulty: string): Promise<void> {
    const result = await query(
      'SELECT id, score FROM global_leaderboard WHERE game_type = $1 AND difficulty = $2 ORDER BY score DESC',
      [gameType, difficulty]
    );

    const entries = result.rows;

    // 更新排名
    for (let i = 0; i < entries.length; i++) {
      await query(
        'UPDATE global_leaderboard SET rank = $1 WHERE id = $2',
        [i + 1, entries[i].id]
      );
    }
  }

  // 获取用户游戏统计
  async getUserGameStatistics(userId: string, gameType?: string): Promise<GameStatistics[]> {
    let sql = 'SELECT * FROM game_statistics WHERE user_id = $1';
    const params: any[] = [userId];

    if (gameType) {
      sql += ' AND game_type = $2';
      params.push(gameType);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  // 获取游戏排行榜
  async getGameLeaderboard(
    gameType: string,
    difficulty: string,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const result = await query(
      `SELECT gl.*, u.username, u.avatar
       FROM global_leaderboard gl
       JOIN users u ON gl.user_id = u.id
       WHERE gl.game_type = $1 AND gl.difficulty = $2
       ORDER BY gl.rank ASC
       LIMIT $3`,
      [gameType, difficulty, limit]
    );

    return result.rows;
  }

  // 获取用户在排行榜中的排名
  async getUserRank(userId: string, gameType: string, difficulty: string): Promise<LeaderboardEntry | null> {
    const result = await query(
      `SELECT gl.*, u.username, u.avatar
       FROM global_leaderboard gl
       JOIN users u ON gl.user_id = u.id
       WHERE gl.user_id = $1 AND gl.game_type = $2 AND gl.difficulty = $3`,
      [userId, gameType, difficulty]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // 获取用户游戏记录
  async getUserGameRecords(
    userId: string,
    gameType?: string,
    limit: number = 50
  ): Promise<GameRecord[]> {
    let sql = 'SELECT * FROM game_records WHERE user_id = $1';
    const params: any[] = [userId];

    if (gameType) {
      sql += ' AND game_type = $2';
      params.push(gameType);
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  // 获取游戏类型列表
  async getGameTypes(): Promise<string[]> {
    const result = await query('SELECT DISTINCT game_type FROM game_records');
    return result.rows.map(row => row.game_type);
  }

  // 获取全局游戏统计
  async getGlobalGameStatistics(gameType: string): Promise<any> {
    const result = await query(
      `SELECT
        COUNT(*) as total_players,
        SUM(total_plays) as total_plays,
        MAX(highest_score) as highest_score,
        AVG(average_score) as average_score
       FROM game_statistics
       WHERE game_type = $1`,
      [gameType]
    );

    return result.rows[0];
  }
}

export default new GameRecordService();
