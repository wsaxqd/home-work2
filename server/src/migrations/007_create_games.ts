import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_007_create_games: Migration = {
  id: '007',
  name: '007_create_games',

  up: async () => {
    // 创建游戏类型枚举
    await query(`
      DO $$ BEGIN
        CREATE TYPE game_type AS ENUM ('expression', 'image_recognition');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建游戏成绩表
    await query(`
      CREATE TABLE IF NOT EXISTS game_scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_type game_type NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        level INTEGER DEFAULT 1,
        accuracy DECIMAL(5, 2),
        duration INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建游戏进度表
    await query(`
      CREATE TABLE IF NOT EXISTS game_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_type game_type NOT NULL,
        progress DECIMAL(5, 2) DEFAULT 0,
        highest_score INTEGER DEFAULT 0,
        highest_level INTEGER DEFAULT 1,
        total_plays INTEGER DEFAULT 0,
        total_time INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, game_type)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC)`);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS game_progress CASCADE');
    await query('DROP TABLE IF EXISTS game_scores CASCADE');
    await query('DROP TYPE IF EXISTS game_type');
  }
};
