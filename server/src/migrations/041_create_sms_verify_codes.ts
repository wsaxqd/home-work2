import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 创建短信验证码表
    await client.query(`
      CREATE TABLE IF NOT EXISTS sms_verify_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        purpose VARCHAR(50) NOT NULL DEFAULT 'login',
        ip_address VARCHAR(50),
        user_agent TEXT,
        is_used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_phone_format CHECK (phone ~ '^1[3-9]\\d{9}$')
      );
    `);

    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_verify_codes_phone
      ON sms_verify_codes(phone);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_verify_codes_expires_at
      ON sms_verify_codes(expires_at);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_verify_codes_created_at
      ON sms_verify_codes(created_at);
    `);

    // 创建短信发送记录表(用于统计和防刷)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sms_send_logs (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        error_message TEXT,
        ip_address VARCHAR(50),
        cost DECIMAL(10, 4),
        provider VARCHAR(50) DEFAULT 'tencent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_send_logs_phone
      ON sms_send_logs(phone);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_send_logs_created_at
      ON sms_send_logs(created_at);
    `);

    await client.query('COMMIT');
    console.log('✅ 短信验证码表创建成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 短信验证码表创建失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function down(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS sms_send_logs CASCADE;');
    await client.query('DROP TABLE IF EXISTS sms_verify_codes CASCADE;');

    await client.query('COMMIT');
    console.log('✅ 短信验证码表删除成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 短信验证码表删除失败:', error);
    throw error;
  } finally {
    client.release();
  }
}
