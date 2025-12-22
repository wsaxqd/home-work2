import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_002_create_works: Migration = {
  id: '002',
  name: '002_create_works',

  up: async () => {
    // 创建作品类型枚举
    await query(`
      DO $$ BEGIN
        CREATE TYPE work_type AS ENUM ('story', 'music', 'art', 'poem');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建作品状态枚举
    await query(`
      DO $$ BEGIN
        CREATE TYPE work_status AS ENUM ('draft', 'published', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建作品表
    await query(`
      CREATE TABLE IF NOT EXISTS works (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type work_type NOT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT,
        cover_image VARCHAR(255),
        audio_url VARCHAR(255),
        status work_status DEFAULT 'draft',
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        published_at TIMESTAMP
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_works_type ON works(type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_works_status ON works(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at DESC)`);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS works CASCADE');
    await query('DROP TYPE IF EXISTS work_type');
    await query('DROP TYPE IF EXISTS work_status');
  }
};
