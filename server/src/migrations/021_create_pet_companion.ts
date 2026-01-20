import { Pool } from 'pg'

/**
 * 迁移：创建AI学习伙伴(虚拟宠物)系统表
 *
 * 功能说明：
 * - 用户可以拥有虚拟宠物作为学习伙伴
 * - 宠物会根据学习进度成长
 * - 宠物可以通过学习积分喂养和互动
 * - 支持多种宠物类型和皮肤
 */

export async function up(pool: Pool): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. 宠物类型配置表
    await client.query(`
      CREATE TABLE IF NOT EXISTS pet_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,              -- 宠物名称（如：小龙、小猫、小兔）
        emoji VARCHAR(10) NOT NULL,              -- 表情符号
        description TEXT,                        -- 描述
        base_hunger_rate INTEGER DEFAULT 10,     -- 基础饥饿速度（每小时）
        base_energy_rate INTEGER DEFAULT 5,      -- 基础能量消耗速度
        unlock_condition JSONB,                  -- 解锁条件 {type: 'points', value: 100}
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 2. 用户宠物表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_pets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pet_type_id INTEGER NOT NULL REFERENCES pet_types(id),
        nickname VARCHAR(50),                    -- 宠物昵称
        level INTEGER DEFAULT 1,                 -- 等级（1-100）
        experience INTEGER DEFAULT 0,            -- 经验值
        hunger INTEGER DEFAULT 100,              -- 饥饿值（0-100）
        energy INTEGER DEFAULT 100,              -- 能量值（0-100）
        happiness INTEGER DEFAULT 100,           -- 快乐值（0-100）
        total_study_time INTEGER DEFAULT 0,      -- 总学习时长（分钟）
        total_interaction INTEGER DEFAULT 0,     -- 总互动次数
        skin VARCHAR(50) DEFAULT 'default',      -- 当前皮肤
        is_active BOOLEAN DEFAULT true,          -- 是否激活（当前陪伴的宠物）
        last_fed_at TIMESTAMP,                   -- 上次喂养时间
        last_interaction_at TIMESTAMP,           -- 上次互动时间
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_active_pet_per_user UNIQUE (user_id, is_active)
          WHERE is_active = true
      )
    `)

    // 3. 宠物互动记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS pet_interactions (
        id SERIAL PRIMARY KEY,
        user_pet_id INTEGER NOT NULL REFERENCES user_pets(id) ON DELETE CASCADE,
        interaction_type VARCHAR(50) NOT NULL,   -- 互动类型：feed喂养, play玩耍, study学习, talk对话
        reward_exp INTEGER DEFAULT 0,            -- 获得经验
        cost_points INTEGER DEFAULT 0,           -- 消耗积分
        result JSONB,                            -- 互动结果数据
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 4. 宠物对话历史表
    await client.query(`
      CREATE TABLE IF NOT EXISTS pet_conversations (
        id SERIAL PRIMARY KEY,
        user_pet_id INTEGER NOT NULL REFERENCES user_pets(id) ON DELETE CASCADE,
        user_message TEXT NOT NULL,
        pet_response TEXT NOT NULL,
        context_type VARCHAR(50),                -- 对话场景：study学习, emotion情感, daily日常
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 5. 宠物物品/皮肤表
    await client.query(`
      CREATE TABLE IF NOT EXISTS pet_items (
        id SERIAL PRIMARY KEY,
        item_type VARCHAR(50) NOT NULL,          -- 物品类型：food食物, toy玩具, skin皮肤
        name VARCHAR(100) NOT NULL,
        emoji VARCHAR(10),
        description TEXT,
        effect JSONB,                            -- 效果 {hunger: +20, happiness: +10}
        price INTEGER DEFAULT 0,                 -- 价格（积分）
        unlock_level INTEGER DEFAULT 1,          -- 解锁等级
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 6. 用户物品库存表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_pet_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pet_item_id INTEGER NOT NULL REFERENCES pet_items(id),
        quantity INTEGER DEFAULT 1,
        acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_item UNIQUE (user_id, pet_item_id)
      )
    `)

    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_pets_user_id ON user_pets(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_pet_interactions_user_pet_id ON pet_interactions(user_pet_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_pet_conversations_user_pet_id ON pet_conversations(user_pet_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_pet_items_user_id ON user_pet_items(user_id)')

    // 插入初始宠物类型数据
    await client.query(`
      INSERT INTO pet_types (name, emoji, description, unlock_condition) VALUES
      ('小龙', '🐲', '聪明好学的小龙，最喜欢和你一起探索知识', '{"type": "default", "value": 0}'),
      ('小猫', '🐱', '可爱活泼的小猫，喜欢陪你阅读', '{"type": "points", "value": 100}'),
      ('小兔', '🐰', '温柔善良的小兔，是你最好的倾听者', '{"type": "points", "value": 200}'),
      ('小熊', '🐻', '憨厚可靠的小熊，喜欢和你一起做作业', '{"type": "level", "value": 5}'),
      ('小狐', '🦊', '机智聪慧的小狐，擅长解答难题', '{"type": "level", "value": 10}')
      ON CONFLICT DO NOTHING
    `)

    // 插入初始物品数据
    await client.query(`
      INSERT INTO pet_items (item_type, name, emoji, description, effect, price) VALUES
      ('food', '苹果', '🍎', '新鲜的苹果，恢复饥饿值', '{"hunger": 20, "happiness": 5}', 10),
      ('food', '蛋糕', '🍰', '美味的蛋糕，大幅恢复饥饿值', '{"hunger": 50, "happiness": 15}', 30),
      ('food', '能量饮料', '🥤', '恢复能量值', '{"energy": 30, "happiness": 10}', 20),
      ('toy', '皮球', '⚽', '和宠物玩皮球，增加快乐值', '{"happiness": 20, "energy": -10}', 15),
      ('toy', '魔方', '🎲', '智力玩具，增加经验和快乐', '{"happiness": 15, "exp": 10}', 25),
      ('skin', '博士帽', '🎓', '学霸造型皮肤', '{}', 100),
      ('skin', '圣诞帽', '🎅', '节日限定皮肤', '{}', 150)
      ON CONFLICT DO NOTHING
    `)

    await client.query('COMMIT')
    console.log('✅ 迁移 021: AI学习伙伴系统表创建成功')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 迁移 021 失败:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function down(pool: Pool): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query('DROP TABLE IF EXISTS user_pet_items CASCADE')
    await client.query('DROP TABLE IF EXISTS pet_items CASCADE')
    await client.query('DROP TABLE IF EXISTS pet_conversations CASCADE')
    await client.query('DROP TABLE IF EXISTS pet_interactions CASCADE')
    await client.query('DROP TABLE IF EXISTS user_pets CASCADE')
    await client.query('DROP TABLE IF EXISTS pet_types CASCADE')

    await client.query('COMMIT')
    console.log('✅ 迁移 021 回滚成功')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 迁移 021 回滚失败:', error)
    throw error
  } finally {
    client.release()
  }
}
