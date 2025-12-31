import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_015_update_users_table: Migration = {
  id: '015',
  name: '015_update_users_table',

  up: async () => {
    // 添加age和gender字段
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS age INTEGER,
      ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
      ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255)
    `);

    console.log('✓ users table updated with additional fields');
  },

  down: async () => {
    await query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS age,
      DROP COLUMN IF EXISTS gender,
      DROP COLUMN IF EXISTS parent_phone,
      DROP COLUMN IF EXISTS parent_email
    `);
    console.log('✓ users table additional fields removed');
  }
};
