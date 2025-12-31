import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_020_add_last_login: Migration = {
  id: '020',
  name: '020_add_last_login',

  up: async () => {
    // 添加last_login字段到users表
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // 创建索引以提高查询性能
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC)
    `);

    console.log('✓ Added last_login field to users table');
  },

  down: async () => {
    await query(`
      DROP INDEX IF EXISTS idx_users_last_login
    `);

    await query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS last_login
    `);

    console.log('✓ Removed last_login field from users table');
  }
};
