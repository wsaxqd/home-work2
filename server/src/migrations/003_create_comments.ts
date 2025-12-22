import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_003_create_comments: Migration = {
  id: '003',
  name: '003_create_comments',

  up: async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_comments_work_id ON comments(work_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS comments CASCADE');
  }
};
