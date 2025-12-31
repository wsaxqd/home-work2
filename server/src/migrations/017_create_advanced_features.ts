import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_017_create_advanced_features: Migration = {
  id: '017',
  name: '017_create_advanced_features',

  up: async () => {
    // 创作模板表
    await query(`
      CREATE TABLE IF NOT EXISTS creation_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        template_data JSONB NOT NULL,
        thumbnail VARCHAR(255),
        difficulty INTEGER DEFAULT 1,
        tags TEXT[],
        is_featured BOOLEAN DEFAULT false,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 用户收藏表
    await query(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_type VARCHAR(50) NOT NULL,
        item_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_type, item_id)
      )
    `);

    // 话题表
    await query(`
      CREATE TABLE IF NOT EXISTS topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image VARCHAR(255),
        creator_id UUID REFERENCES users(id),
        participant_count INTEGER DEFAULT 0,
        work_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'active',
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 话题参与表
    await query(`
      CREATE TABLE IF NOT EXISTS topic_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(topic_id, work_id)
      )
    `);

    // AI辅导记录表
    await query(`
      CREATE TABLE IF NOT EXISTS ai_tutoring_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(50) NOT NULL,
        topic VARCHAR(255),
        conversation_data JSONB,
        difficulty_level INTEGER DEFAULT 1,
        duration INTEGER,
        effectiveness_score DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 家长控制设置表
    await query(`
      CREATE TABLE IF NOT EXISTS parental_controls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        daily_time_limit INTEGER DEFAULT 120,
        content_filter_level INTEGER DEFAULT 1,
        allowed_features JSONB DEFAULT '[]',
        blocked_features JSONB DEFAULT '[]',
        notification_settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // 使用时长记录表
    await query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feature_type VARCHAR(50) NOT NULL,
        duration INTEGER NOT NULL,
        activity_data JSONB,
        logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 成就进度表扩展
    await query(`
      ALTER TABLE user_achievements
      ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_required INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1
    `);

    // 插入示例创作模板
    await query(`
      INSERT INTO creation_templates (type, title, description, template_data, difficulty, tags) VALUES
      ('story', '冒险故事模板', '经典的冒险故事框架，适合创作探险类故事', '{"structure": ["开场", "遇到困难", "寻找帮助", "克服困难", "圆满结局"], "tips": ["描述主角性格", "设置有趣的冲突", "展现成长变化"]}', 1, ARRAY['故事', '冒险']),
      ('story', '童话故事模板', '温馨的童话故事结构', '{"structure": ["美好开场", "出现问题", "魔法帮助", "解决问题", "幸福结局"], "tips": ["加入魔法元素", "善良战胜邪恶"]}', 1, ARRAY['故事', '童话']),
      ('poem', '四季诗歌模板', '描写四季的诗歌框架', '{"structure": ["描述景色", "表达感受", "联想想象", "总结升华"], "rhyme": "AABB"}', 2, ARRAY['诗歌', '自然']),
      ('art', '风景画模板', '简单的风景画创作指导', '{"elements": ["天空", "地面", "主体物", "点缀"], "colors": ["warm", "cool"], "composition": "三分法"}', 1, ARRAY['绘画', '风景'])
    `);

    // 插入示例话题
    await query(`
      INSERT INTO topics (title, description, is_featured, start_date, end_date) VALUES
      ('我的梦想', '画出或写出你的梦想是什么', true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
      ('春天来了', '用你的方式记录春天的美好', true, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
      ('我的家人', '介绍你最爱的家人', false, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
    `);

    console.log('✓ Advanced features tables created');
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS usage_logs CASCADE');
    await query('DROP TABLE IF EXISTS parental_controls CASCADE');
    await query('DROP TABLE IF EXISTS ai_tutoring_sessions CASCADE');
    await query('DROP TABLE IF EXISTS topic_participants CASCADE');
    await query('DROP TABLE IF EXISTS topics CASCADE');
    await query('DROP TABLE IF EXISTS user_favorites CASCADE');
    await query('DROP TABLE IF EXISTS creation_templates CASCADE');
    console.log('✓ Advanced features tables dropped');
  }
};
