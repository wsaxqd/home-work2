import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_012_create_learning_progress: Migration = {
  id: '012',
  name: '012_create_learning_progress',

  up: async () => {
    await query(`
      DO $$ BEGIN
        CREATE TYPE learning_module AS ENUM ('ai_basics', 'ai_application', 'ai_ethics', 'ai_future');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS learning_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module learning_module NOT NULL,
        progress DECIMAL(5, 2) DEFAULT 0,
        completed_lessons TEXT[],
        total_time INTEGER DEFAULT 0,
        last_lesson VARCHAR(100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, module)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id)`);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS learning_progress CASCADE');
    await query('DROP TYPE IF EXISTS learning_module');
  }
};
