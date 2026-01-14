import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 先删除可能存在的旧表（以防之前迁移失败留下残留）
    await client.query('DROP TABLE IF EXISTS parental_controls CASCADE');
    await client.query('DROP TABLE IF EXISTS usage_logs CASCADE');
    await client.query('DROP TABLE IF EXISTS children CASCADE');
    await client.query('DROP TABLE IF EXISTS parents CASCADE');

    // 创建家长账号表
    await client.query(`
      CREATE TABLE parents (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        email VARCHAR(255),
        avatar VARCHAR(500),
        notification_settings JSONB DEFAULT '{"learningReminder": true, "timeoutWarning": true, "achievementNotify": true, "weeklyReport": true}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建孩子账号表（与users表关联）
    await client.query(`
      CREATE TABLE children (
        id SERIAL PRIMARY KEY,
        parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        nickname VARCHAR(100),
        age INTEGER,
        gender VARCHAR(10),
        grade VARCHAR(50),
        avatar VARCHAR(500),
        bind_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(parent_id, user_id)
      );
    `);

    // 创建使用记录表
    await client.query(`
      CREATE TABLE usage_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        activity_title VARCHAR(255),
        duration INTEGER NOT NULL,
        score INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建家长控制设置表
    await client.query(`
      CREATE TABLE parental_controls (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        daily_limit INTEGER DEFAULT 120,
        game_limit INTEGER DEFAULT 30,
        start_time TIME DEFAULT '08:00:00',
        end_time TIME DEFAULT '20:00:00',
        time_control_enabled BOOLEAN DEFAULT true,
        content_controls JSONB DEFAULT '{"games": true, "creation": true, "reading": true, "aiEncyclopedia": true}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建索引
    await client.query('CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id)');
    await client.query('CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at)');
    await client.query('CREATE INDEX idx_usage_logs_activity_type ON usage_logs(activity_type)');
    await client.query('CREATE INDEX idx_children_parent_id ON children(parent_id)');
    await client.query('CREATE INDEX idx_children_user_id ON children(user_id)');

    await client.query('COMMIT');
    console.log('✅ 家长端相关表创建成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 创建家长端表失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function down(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS parental_controls CASCADE;');
    await client.query('DROP TABLE IF EXISTS usage_logs CASCADE;');
    await client.query('DROP TABLE IF EXISTS children CASCADE;');
    await client.query('DROP TABLE IF EXISTS parents CASCADE;');

    await client.query('COMMIT');
    console.log('✅ 家长端相关表删除成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 删除家长端表失败:', error);
    throw error;
  } finally {
    client.release();
  }
}
