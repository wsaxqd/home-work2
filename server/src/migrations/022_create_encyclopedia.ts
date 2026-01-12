import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_022_create_encyclopedia: Migration = {
  id: '022',
  name: '022_create_encyclopedia',

  up: async () => {
    // 创建百科知识分类表
    await query(`
      CREATE TABLE IF NOT EXISTS encyclopedia_categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10) NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建百科问答题库表
    await query(`
      CREATE TABLE IF NOT EXISTS encyclopedia_questions (
        id SERIAL PRIMARY KEY,
        category_id VARCHAR(50) REFERENCES encyclopedia_categories(id),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        difficulty VARCHAR(20) DEFAULT '简单',
        tags TEXT[],
        related_question_ids INTEGER[],
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 用户收藏的问题表
    await query(`
      CREATE TABLE IF NOT EXISTS user_favorite_questions (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES encyclopedia_questions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, question_id)
      )
    `);

    // 用户问题浏览记录表
    await query(`
      CREATE TABLE IF NOT EXISTS user_question_views (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES encyclopedia_questions(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await query(`
      CREATE INDEX IF NOT EXISTS idx_encyclopedia_category ON encyclopedia_questions(category_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_encyclopedia_difficulty ON encyclopedia_questions(difficulty)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_favorites ON user_favorite_questions(user_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_question_views ON user_question_views(user_id, question_id)
    `);

    // 插入分类数据
    await query(`
      INSERT INTO encyclopedia_categories (id, name, icon, description, sort_order) VALUES
      ('ai', '人工智能', '🤖', '认识AI，了解人工智能的奥秘', 1),
      ('space', '太空宇宙', '🚀', '探索浩瀚宇宙，发现星空奥秘', 2),
      ('astronomy', '天文知识', '🌟', '观察星空，学习天文现象', 3),
      ('science', '科学原理', '🔬', '探索科学，发现生活中的原理', 4),
      ('nature', '自然世界', '🌍', '认识大自然，了解地球家园', 5),
      ('biology', '生物知识', '🦋', '探索生命的奥秘', 6)
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('✓ Encyclopedia tables and categories created successfully');
  },

  down: async () => {
    await query(`DROP TABLE IF EXISTS user_question_views`);
    await query(`DROP TABLE IF EXISTS user_favorite_questions`);
    await query(`DROP TABLE IF EXISTS encyclopedia_questions`);
    await query(`DROP TABLE IF EXISTS encyclopedia_categories`);

    console.log('✓ Encyclopedia tables dropped');
  }
};
