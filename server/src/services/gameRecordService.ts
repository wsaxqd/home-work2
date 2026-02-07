import db from '../config/database';

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
    const [savedRecord] = await db('game_records')
      .insert(record)
      .returning('*');

    // 更新游戏统计
    await this.updateGameStatistics(record.user_id, record.game_type);

    // 更新排行榜
    await this.updateLeaderboard(record.user_id, record.game_type, record.difficulty, record.score);

    return savedRecord;
  }

  // 更新游戏统计
  async updateGameStatistics(userId: string, gameType: string): Promise<void> {
    // 获取该用户该游戏的所有记录
    const records = await db('game_records')
      .where({ user_id: userId, game_type: gameType })
      .select('*');

    if (records.length === 0) return;

    // 计算统计数据
    const totalPlays = records.length;
    const totalScore = records.reduce((sum, r) => sum + r.score, 0);
    const highestScore = Math.max(...records.map(r => r.score));
    const averageScore = totalScore / totalPlays;
    const totalTime = records.reduce((sum, r) => sum + r.time_spent, 0);
    const bestStreak = Math.max(...records.map(r => r.best_streak));
    const averageAccuracy = records.reduce((sum, r) => sum + r.accuracy, 0) / totalPlays;

    // 更新或插入统计数据
    const existing = await db('game_statistics')
      .where({ user_id: userId, game_type: gameType })
      .first();

    if (existing) {
      await db('game_statistics')
        .where({ user_id: userId, game_type: gameType })
        .update({
          total_plays: totalPlays,
          total_score: totalScore,
          highest_score: highestScore,
          average_score: averageScore,
          total_time: totalTime,
          best_streak: bestStreak,
          average_accuracy: averageAccuracy,
          last_played_at: db.fn.now(),
          updated_at: db.fn.now()
        });
    } else {
      await db('game_statistics').insert({
        user_id: userId,
        game_type: gameType,
        total_plays: totalPlays,
        total_score: totalScore,
        highest_score: highestScore,
        average_score: averageScore,
        total_time: totalTime,
        best_streak: bestStreak,
        average_accuracy: averageAccuracy
      });
    }
  }

  // 更新排行榜
  async updateLeaderboard(userId: string, gameType: string, difficulty: string, score: number): Promise<void> {
    // 检查是否已有记录
    const existing = await db('global_leaderboard')
      .where({ user_id: userId, game_type: gameType, difficulty: difficulty })
      .first();

    if (existing) {
      // 如果新分数更高,更新记录
      if (score > existing.score) {
        await db('global_leaderboard')
          .where({ user_id: userId, game_type: gameType, difficulty: difficulty })
          .update({
            score: score,
            updated_at: db.fn.now()
          });
      }
    } else {
      // 插入新记录
      await db('global_leaderboard').insert({
        user_id: userId,
        game_type: gameType,
        difficulty: difficulty,
        score: score,
        rank: 0 // 排名稍后计算
      });
    }

    // 重新计算排名
    await this.recalculateRanks(gameType, difficulty);
  }

  // 重新计算排名
  async recalculateRanks(gameType: string, difficulty: string): Promise<void> {
    const entries = await db('global_leaderboard')
      .where({ game_type: gameType, difficulty: difficulty })
      .orderBy('score', 'desc')
      .select('id', 'score');

    // 更新排名
    for (let i = 0; i < entries.length; i++) {
      await db('global_leaderboard')
        .where({ id: entries[i].id })
        .update({ rank: i + 1 });
    }
  }

  // 获取用户游戏统计
  async getUserGameStatistics(userId: string, gameType?: string): Promise<GameStatistics[]> {
    const query = db('game_statistics')
      .where({ user_id: userId });

    if (gameType) {
      query.where({ game_type: gameType });
    }

    return await query.select('*');
  }

  // 获取游戏排行榜
  async getGameLeaderboard(
    gameType: string,
    difficulty: string,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const entries = await db('global_leaderboard')
      .join('users', 'global_leaderboard.user_id', 'users.id')
      .where({
        'global_leaderboard.game_type': gameType,
        'global_leaderboard.difficulty': difficulty
      })
      .orderBy('global_leaderboard.rank', 'asc')
      .limit(limit)
      .select(
        'global_leaderboard.*',
        'users.username',
        'users.avatar'
      );

    return entries;
  }

  // 获取用户在排行榜中的排名
  async getUserRank(userId: string, gameType: string, difficulty: string): Promise<LeaderboardEntry | null> {
    const entry = await db('global_leaderboard')
      .join('users', 'global_leaderboard.user_id', 'users.id')
      .where({
        'global_leaderboard.user_id': userId,
        'global_leaderboard.game_type': gameType,
        'global_leaderboard.difficulty': difficulty
      })
      .first(
        'global_leaderboard.*',
        'users.username',
        'users.avatar'
      );

    return entry || null;
  }

  // 获取用户游戏记录
  async getUserGameRecords(
    userId: string,
    gameType?: string,
    limit: number = 50
  ): Promise<GameRecord[]> {
    const query = db('game_records')
      .where({ user_id: userId });

    if (gameType) {
      query.where({ game_type: gameType });
    }

    return await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .select('*');
  }

  // 获取游戏类型列表
  async getGameTypes(): Promise<string[]> {
    const types = await db('game_records')
      .distinct('game_type')
      .select('game_type');

    return types.map(t => t.game_type);
  }

  // 获取全局游戏统计
  async getGlobalGameStatistics(gameType: string): Promise<any> {
    const stats = await db('game_statistics')
      .where({ game_type: gameType })
      .select(
        db.raw('COUNT(*) as total_players'),
        db.raw('SUM(total_plays) as total_plays'),
        db.raw('MAX(highest_score) as highest_score'),
        db.raw('AVG(average_score) as average_score')
      )
      .first();

    return stats;
  }
}

export default new GameRecordService();
