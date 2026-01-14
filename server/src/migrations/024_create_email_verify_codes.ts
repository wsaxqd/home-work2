import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 创建邮箱验证码表
    await client.query(`
      CREATE TABLE email_verify_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建索引
    await client.query('CREATE INDEX idx_email_verify_codes_email ON email_verify_codes(email)');
    await client.query('CREATE INDEX idx_email_verify_codes_expires_at ON email_verify_codes(expires_at)');

    await client.query('COMMIT');
    console.log('✅ 邮箱验证码表创建成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 创建邮箱验证码表失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function down(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS email_verify_codes CASCADE;');

    await client.query('COMMIT');
    console.log('✅ 邮箱验证码表删除成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 删除邮箱验证码表失败:', error);
    throw error;
  } finally {
    client.release();
  }
}
