import { query } from '../config/database';
import { Migration } from './migrationRunner';

export const migration_028_create_community_topics: Migration = {
  id: '028',
  name: '028_create_community_topics',

  up: async () => {
    // 创建话题表
    await query(`
      CREATE TABLE IF NOT EXISTS community_topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(100) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        post_count INTEGER DEFAULT 0,
        follower_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建帖子-话题关联表
    await query(`
      CREATE TABLE IF NOT EXISTS post_topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        topic_id UUID NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, topic_id)
      );
    `);

    // 创建用户关注话题表
    await query(`
      CREATE TABLE IF NOT EXISTS user_topic_follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id UUID NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, topic_id)
      );
    `);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS user_topic_follows CASCADE');
    await query('DROP TABLE IF EXISTS post_topics CASCADE');
    await query('DROP TABLE IF EXISTS community_topics CASCADE');
  }
};
