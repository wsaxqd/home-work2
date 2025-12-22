import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_008_create_achievements: Migration = {
  id: '008',
  name: '008_create_achievements',

  up: async () => {
    // 创建成就类型枚举
    await query(`
      DO $$ BEGIN
        CREATE TYPE achievement_category AS ENUM ('creation', 'learning', 'social', 'game', 'special');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建成就定义表
    await query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category achievement_category NOT NULL,
        icon VARCHAR(255),
        points INTEGER DEFAULT 10,
        requirement JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建用户成就表
    await query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)`);

    // 插入默认成就
    await query(`
      INSERT INTO achievements (code, name, description, category, points) VALUES
      ('first_story', '初露锋芒', '创作第一个故事', 'creation', 10),
      ('first_music', '音乐小天才', '创作第一首音乐', 'creation', 10),
      ('first_art', '小画家', '创作第一幅画作', 'creation', 10),
      ('first_poem', '小诗人', '创作第一首诗词', 'creation', 10),
      ('creator_10', '创作达人', '累计创作10个作品', 'creation', 50),
      ('creator_50', '创作大师', '累计创作50个作品', 'creation', 100),
      ('game_master', '游戏高手', '在任意游戏中获得满分', 'game', 30),
      ('social_star', '社交之星', '获得100个点赞', 'social', 50),
      ('diary_keeper', '日记达人', '连续7天写日记', 'special', 30),
      ('explorer', '探索先锋', '完成所有AI知识学习', 'learning', 100)
      ON CONFLICT (code) DO NOTHING
    `);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS user_achievements CASCADE');
    await query('DROP TABLE IF EXISTS achievements CASCADE');
    await query('DROP TYPE IF EXISTS achievement_category');
  }
};
