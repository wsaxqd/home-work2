import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_004_create_likes: Migration = {
  id: '004',
  name: '004_create_likes',

  up: async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(work_id, user_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_likes_work_id ON likes(work_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)`);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS likes CASCADE');
  }
};
