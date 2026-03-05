import { Migration } from './migrationRunner';

export const migration_046_create_game_records: Migration = {
  id: '046',
  name: '046_create_game_records',
  async up(client) {
    // 创建游戏记录表
    await client!.query(`
      CREATE TABLE IF NOT EXISTS game_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_type VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        time_spent INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0,
        accuracy DECIMAL(5, 2) DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_game_records_user_game ON game_records(user_id, game_type);
      CREATE INDEX IF NOT EXISTS idx_game_records_game_score ON game_records(game_type, score);
      CREATE INDEX IF NOT EXISTS idx_game_records_created ON game_records(created_at);
    `);

    // 创建游戏统计表
    await client!.query(`
      CREATE TABLE IF NOT EXISTS game_statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_type VARCHAR(50) NOT NULL,
        total_plays INTEGER NOT NULL DEFAULT 0,
        total_score BIGINT NOT NULL DEFAULT 0,
        highest_score INTEGER NOT NULL DEFAULT 0,
        average_score DECIMAL(10, 2) DEFAULT 0,
        total_time BIGINT NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0,
        average_accuracy DECIMAL(5, 2) DEFAULT 0,
        last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, game_type)
      );

      CREATE INDEX IF NOT EXISTS idx_game_statistics_game_score ON game_statistics(game_type, highest_score);
      CREATE INDEX IF NOT EXISTS idx_game_statistics_last_played ON game_statistics(last_played_at);
    `);

    // 创建全局排行榜表
    await client!.query(`
      CREATE TABLE IF NOT EXISTS global_leaderboard (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_type VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        score INTEGER NOT NULL,
        rank INTEGER NOT NULL,
        achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, game_type, difficulty)
      );

      CREATE INDEX IF NOT EXISTS idx_global_leaderboard_game_score ON global_leaderboard(game_type, difficulty, score);
      CREATE INDEX IF NOT EXISTS idx_global_leaderboard_game_rank ON global_leaderboard(game_type, difficulty, rank);
    `);

    console.log('✅ 游戏记录相关表创建成功');
  },

  async down(client) {
    await client!.query(`
      DROP TABLE IF EXISTS global_leaderboard;
      DROP TABLE IF EXISTS game_statistics;
      DROP TABLE IF EXISTS game_records;
    `);

    console.log('✅ 游戏记录相关表删除成功');
  }
};
