import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_009_create_wishes: Migration = {
  id: '009',
  name: '009_create_wishes',

  up: async () => {
    await query(`
      DO $$ BEGIN
        CREATE TYPE wish_status AS ENUM ('pending', 'in_progress', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS wishes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        status wish_status DEFAULT 'pending',
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_wishes_user_id ON wishes(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes(status)`);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS wishes CASCADE');
    await query('DROP TYPE IF EXISTS wish_status');
  }
};
