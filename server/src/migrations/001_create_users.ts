import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_001_create_users: Migration = {
  id: '001',
  name: '001_create_users',

  up: async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(50),
        avatar VARCHAR(255),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)
    `);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS users CASCADE');
  }
};
