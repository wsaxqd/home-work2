import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_005_create_follows: Migration = {
  id: '005',
  name: '005_create_follows',

  up: async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id),
        CHECK(follower_id != following_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)`);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS follows CASCADE');
  }
};
