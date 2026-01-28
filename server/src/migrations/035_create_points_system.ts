import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_035_create_points_system: Migration = {
  id: '035',
  name: '035_create_points_system',

  up: async () => {
    // 1. 积分记录表
    await query(`
      CREATE TABLE IF NOT EXISTS points_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend')),
        amount INTEGER NOT NULL,
        balance INTEGER NOT NULL,
        reason VARCHAR(200) NOT NULL,
        source VARCHAR(100) NOT NULL,
        source_id VARCHAR(100),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_points_records_user_id ON points_records(user_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_points_records_created_at ON points_records(created_at DESC)
    `);

    // 2. 商城商品表
    await query(`
      CREATE TABLE IF NOT EXISTS shop_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        image_url TEXT,
        category VARCHAR(50) NOT NULL,
        price INTEGER NOT NULL,
        original_price INTEGER,
        stock INTEGER DEFAULT -1,
        sold_count INTEGER DEFAULT 0,
        type VARCHAR(50) NOT NULL CHECK (type IN ('virtual', 'reward', 'privilege', 'decoration')),
        effect JSONB,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_hot BOOLEAN DEFAULT false,
        is_new BOOLEAN DEFAULT false,
        start_at TIMESTAMP WITH TIME ZONE,
        end_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_shop_items_is_active ON shop_items(is_active)
    `);

    // 3. 用户兑换记录表
    await query(`
      CREATE TABLE IF NOT EXISTS user_exchanges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES shop_items(id),
        item_name VARCHAR(100) NOT NULL,
        item_price INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        total_price INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'used', 'expired')),
        used_at TIMESTAMP WITH TIME ZONE,
        expired_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_exchanges_user_id ON user_exchanges(user_id)
    `);

    // 4. 用户等级配置表
    await query(`
      CREATE TABLE IF NOT EXISTS level_configs (
        level INTEGER PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        min_points INTEGER NOT NULL,
        max_points INTEGER,
        icon VARCHAR(50),
        color VARCHAR(20),
        privileges JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. 成就表
    await query(`
      CREATE TABLE IF NOT EXISTS achievements_new (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        category VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        condition JSONB NOT NULL,
        reward_points INTEGER DEFAULT 0,
        reward_items JSONB,
        rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
        is_hidden BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. 用户成就记录表
    await query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id UUID NOT NULL REFERENCES achievements_new(id),
        progress INTEGER DEFAULT 0,
        target INTEGER NOT NULL,
        is_completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)
    `);

    // 7. 每日任务表
    await query(`
      CREATE TABLE IF NOT EXISTS daily_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        category VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        condition JSONB NOT NULL,
        reward_points INTEGER DEFAULT 0,
        reward_items JSONB,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. 用户每日任务记录表
    await query(`
      CREATE TABLE IF NOT EXISTS user_daily_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id UUID NOT NULL REFERENCES daily_tasks(id),
        task_date DATE NOT NULL DEFAULT CURRENT_DATE,
        progress INTEGER DEFAULT 0,
        target INTEGER NOT NULL,
        is_completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, task_id, task_date)
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_user_date ON user_daily_tasks(user_id, task_date)
    `);

    console.log('✅ 积分系统表创建成功');
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS user_daily_tasks CASCADE');
    await query('DROP TABLE IF EXISTS daily_tasks CASCADE');
    await query('DROP TABLE IF EXISTS user_achievements CASCADE');
    await query('DROP TABLE IF EXISTS achievements_new CASCADE');
    await query('DROP TABLE IF EXISTS level_configs CASCADE');
    await query('DROP TABLE IF EXISTS user_exchanges CASCADE');
    await query('DROP TABLE IF EXISTS shop_items CASCADE');
    await query('DROP TABLE IF EXISTS points_records CASCADE');
    console.log('❌ 积分系统表已删除');
  }
};
