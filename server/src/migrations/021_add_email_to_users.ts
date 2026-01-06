import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_021_add_email_to_users: Migration = {
  id: '021',
  name: '021_add_email_to_users',

  up: async () => {
    // 添加email字段
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE
    `);

    // 创建email索引以提高查询性能
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    // 修改phone字段,允许为NULL(因为现在可以用email注册)
    await query(`
      ALTER TABLE users
      ALTER COLUMN phone DROP NOT NULL
    `);

    // 添加约束:phone和email至少有一个不为空
    await query(`
      ALTER TABLE users
      ADD CONSTRAINT check_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL)
    `);

    console.log('✓ users table updated: email column added, phone made optional');
  },

  down: async () => {
    // 移除约束
    await query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS check_phone_or_email
    `);

    // 恢复phone为必填
    await query(`
      ALTER TABLE users
      ALTER COLUMN phone SET NOT NULL
    `);

    // 删除email索引
    await query(`
      DROP INDEX IF EXISTS idx_users_email
    `);

    // 删除email字段
    await query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS email
    `);

    console.log('✓ users table rolled back: email column removed');
  }
};
