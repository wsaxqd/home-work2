import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_001_create_users: Migration = {
  id: '001',
  name: '001_create_users',

  up: async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        password_hash VARCHAR(255),
        nickname VARCHAR(50),
        avatar VARCHAR(10),
        avatar_url TEXT,
        age INTEGER,
        gender VARCHAR(10),
        grade VARCHAR(20),
        bio TEXT,
        parent_id UUID,
        points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP WITH TIME ZONE
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS users CASCADE');
  }
};
