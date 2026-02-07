import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 创建反馈表
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature', 'other')),
        content TEXT NOT NULL,
        images TEXT[], -- 图片URL数组
        contact VARCHAR(100), -- 联系方式
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'closed')),
        admin_reply TEXT,
        replied_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_user_id
      ON feedback(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_status
      ON feedback(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_created_at
      ON feedback(created_at DESC);
    `);

    await client.query('COMMIT');
    console.log('✅ 反馈表创建成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 反馈表创建失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function down(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS feedback CASCADE;');

    await client.query('COMMIT');
    console.log('✅ 反馈表删除成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 反馈表删除失败:', error);
    throw error;
  } finally {
    client.release();
  }
}
