import { query } from '../config/database';

async function createTopicsTables() {
  console.log('🚀 开始创建topics相关表...\n');

  try {
    // 创建话题表
    console.log('⏳ 创建 community_topics 表...');
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
    console.log('✅ community_topics 表创建成功\n');

    // 创建帖子-话题关联表
    console.log('⏳ 创建 post_topics 表...');
    await query(`
      CREATE TABLE IF NOT EXISTS post_topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        topic_id UUID NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, topic_id)
      );
    `);
    console.log('✅ post_topics 表创建成功\n');

    // 创建用户关注话题表
    console.log('⏳ 创建 user_topic_follows 表...');
    await query(`
      CREATE TABLE IF NOT EXISTS user_topic_follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id UUID NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, topic_id)
      );
    `);
    console.log('✅ user_topic_follows 表创建成功\n');

    // 创建索引
    console.log('⏳ 创建索引...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_community_topics_category ON community_topics(category);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_community_topics_is_active ON community_topics(is_active);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_community_topics_is_featured ON community_topics(is_featured);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_community_topics_sort_order ON community_topics(sort_order);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_post_topics_post_id ON post_topics(post_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_post_topics_topic_id ON post_topics(topic_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_topic_follows_user_id ON user_topic_follows(user_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_topic_follows_topic_id ON user_topic_follows(topic_id);
    `);
    console.log('✅ 索引创建成功\n');

    // 插入初始数据
    console.log('⏳ 插入初始话题数据...');
    await query(`
      INSERT INTO community_topics (title, icon, description, category, is_featured, sort_order)
      VALUES
        ('创意分享', '🎨', '分享你的创意作品和灵感', 'creation', true, 1),
        ('学习交流', '📚', '一起学习，共同进步', 'learning', true, 2),
        ('游戏乐园', '🎮', '游戏心得和高分秘籍', 'gaming', true, 3),
        ('故事天地', '📖', '分享有趣的故事', 'story', true, 4),
        ('问答互助', '❓', '有问题就来这里问', 'question', true, 5),
        ('日常生活', '🌈', '分享生活中的点点滴滴', 'daily', false, 6)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ 初始话题数据插入成功\n');

    console.log('🎉 所有表创建完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建表失败:', error);
    process.exit(1);
  }
}

createTopicsTables();
