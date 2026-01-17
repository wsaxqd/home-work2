import { query } from '../config/database';
import { Migration } from './migrationRunner';

export const migration_025_create_reading_progress: Migration = {
  id: '025',
  name: '025_create_reading_progress',

  up: async () => {
    await query(`
      -- 创建阅读进度表
      CREATE TABLE IF NOT EXISTS reading_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        classic_id VARCHAR(100) NOT NULL,
        chapter_id INTEGER NOT NULL,
        last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, classic_id)
      );
    `);

    await query(`
      -- 创建索引
      CREATE INDEX idx_reading_progress_user_id ON reading_progress(user_id);
    `);

    await query(`
      CREATE INDEX idx_reading_progress_classic_id ON reading_progress(classic_id);
    `);

    await query(`
      CREATE INDEX idx_reading_progress_last_read_at ON reading_progress(last_read_at DESC);
    `);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS reading_progress CASCADE');
  }
};
