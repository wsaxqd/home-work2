import { Pool } from 'pg'

/**
 * 迁移：创建闯关式学习路径系统表
 */

export async function up(pool: Pool): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. 学习地图配置表
    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_maps (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(50) NOT NULL,
        map_name VARCHAR(100) NOT NULL,
        description TEXT,
        total_stages INTEGER DEFAULT 0,
        difficulty_level VARCHAR(20),
        recommended_grade VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 2. 关卡配置表
    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_stages (
        id SERIAL PRIMARY KEY,
        map_id INTEGER NOT NULL REFERENCES learning_maps(id) ON DELETE CASCADE,
        stage_number INTEGER NOT NULL,
        stage_name VARCHAR(100) NOT NULL,
        stage_type VARCHAR(50) NOT NULL,
        description TEXT,
        knowledge_points JSONB,
        difficulty_stars INTEGER DEFAULT 1,
        unlock_condition JSONB,
        content_data JSONB,
        pass_score INTEGER DEFAULT 60,
        rewards JSONB,
        position_x INTEGER,
        position_y INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_map_stage UNIQUE (map_id, stage_number)
      )
    `)

    // 3. 用户学习进度表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_learning_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        map_id INTEGER NOT NULL REFERENCES learning_maps(id) ON DELETE CASCADE,
        current_stage INTEGER DEFAULT 1,
        total_stars_earned INTEGER DEFAULT 0,
        completion_rate DECIMAL(5,2) DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_map UNIQUE (user_id, map_id)
      )
    `)

    // 4. 关卡通关记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS stage_completions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stage_id INTEGER NOT NULL REFERENCES learning_stages(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        stars_earned INTEGER DEFAULT 0,
        time_spent INTEGER,
        is_perfect BOOLEAN DEFAULT false,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 5. 勋章系统表
    await client.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        badge_code VARCHAR(50) UNIQUE NOT NULL,
        badge_name VARCHAR(100) NOT NULL,
        description TEXT,
        badge_type VARCHAR(50),
        rarity VARCHAR(20),
        points_reward INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 6. 用户勋章表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
      )
    `)

    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_learning_stages_map_id ON learning_stages(map_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user_id ON user_learning_progress(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_stage_completions_user_id ON stage_completions(user_id)')

    // 插入示例数据
    await client.query(`
      INSERT INTO learning_maps (subject, map_name, description, total_stages, difficulty_level, recommended_grade) VALUES
      ('math', '数学王国探险', '从基础运算到高级数学', 30, 'beginner', '小学1-3年级'),
      ('chinese', '文字森林历险', '汉字识读、拼音、词语', 28, 'beginner', '小学1-3年级')
      ON CONFLICT DO NOTHING
    `)

    await client.query(`
      INSERT INTO learning_stages (map_id, stage_number, stage_name, stage_type, description, knowledge_points, difficulty_stars, unlock_condition, content_data, rewards, position_x, position_y) VALUES
      (1, 1, '认识数字1-10', 'lesson', '学习数字的书写和认读', '["数字认知"]', 1, '{"type": "always"}', '{"questions": 5}', '{"stars": 3, "points": 10}', 100, 100),
      (1, 2, '数字大小比较', 'quiz', '比较数字大小', '["比较"]', 1, '{"type": "previous_stage", "stage": 1}', '{"questions": 8}', '{"stars": 3, "points": 15}', 200, 120)
      ON CONFLICT DO NOTHING
    `)

    await client.query(`
      INSERT INTO badges (badge_code, badge_name, description, badge_type, rarity, points_reward) VALUES
      ('first_step', '第一步', '完成第一个关卡', 'milestone', 'common', 10),
      ('perfect_player', '完美主义者', '获得10个满星通关', 'achievement', 'rare', 100)
      ON CONFLICT DO NOTHING
    `)

    await client.query('COMMIT')
    console.log('✅ 迁移 023: 闯关式学习路径系统表创建成功')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 迁移 023 失败:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function down(pool: Pool): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query('DROP TABLE IF EXISTS user_badges CASCADE')
    await client.query('DROP TABLE IF EXISTS badges CASCADE')
    await client.query('DROP TABLE IF EXISTS stage_completions CASCADE')
    await client.query('DROP TABLE IF EXISTS user_learning_progress CASCADE')
    await client.query('DROP TABLE IF EXISTS learning_stages CASCADE')
    await client.query('DROP TABLE IF EXISTS learning_maps CASCADE')

    await client.query('COMMIT')
    console.log('✅ 迁移 023 回滚成功')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 迁移 023 回滚失败:', error)
    throw error
  } finally {
    client.release()
  }
}
