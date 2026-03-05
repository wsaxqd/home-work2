import { Migration } from './migrationRunner';

export const migration_044_create_bookmarks_notes: Migration = {
  id: '044',
  name: '044_create_bookmarks_notes',
  async up(client) {
    // 创建书签表
    await client!.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('story', 'article', 'video', 'knowledge')),
        resource_id VARCHAR(100) NOT NULL,
        resource_title VARCHAR(200),
        position INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, resource_type, resource_id)
      );
    `);

    // 创建笔记表
    await client!.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(100),
        tags TEXT[],
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建索引
    await client!.query(`
      CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
    `);

    await client!.query(`
      CREATE INDEX IF NOT EXISTS idx_bookmarks_resource ON bookmarks(resource_type, resource_id);
    `);

    await client!.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    `);

    await client!.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
    `);

    await client!.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
    `);

    console.log('✅ 书签和笔记表创建成功');
  },

  async down(client) {
    await client!.query('DROP TABLE IF EXISTS notes CASCADE;');
    await client!.query('DROP TABLE IF EXISTS bookmarks CASCADE;');

    console.log('✅ 书签和笔记表删除成功');
  }
};
