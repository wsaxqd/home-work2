import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_006_create_diaries: Migration = {
  id: '006',
  name: '006_create_diaries',

  up: async () => {
    // 创建情绪类型枚举
    await query(`
      DO $$ BEGIN
        CREATE TYPE mood_type AS ENUM ('happy', 'sad', 'angry', 'anxious', 'calm', 'excited', 'tired', 'neutral');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS diaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        mood mood_type DEFAULT 'neutral',
        mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
        weather VARCHAR(20),
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_diaries_user_id ON diaries(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_diaries_created_at ON diaries(created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_diaries_mood ON diaries(mood)`);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS diaries CASCADE');
    await query('DROP TYPE IF EXISTS mood_type');
  }
};
