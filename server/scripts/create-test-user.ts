/**
 * 创建测试用户
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'qmzg',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'dev_password_123',
});

async function createTestUser() {
  const client = await pool.connect();

  try {
    console.log('🔄 开始创建测试用户...');

    // 检查用户是否已存在
    const checkResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['test_user']
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ 测试用户已存在,无需重复创建');
      console.log('👤 用户名: test_user');
      console.log('🔑 密码: test123456');
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash('test123456', 10);

    // 创建测试用户
    const result = await client.query(
      `INSERT INTO users (username, password_hash, nickname, age, gender)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, nickname`,
      ['test_user', hashedPassword, '测试小朋友', 8, 'other']
    );

    console.log('✅ 测试用户创建成功!');
    console.log('📋 用户信息:');
    console.log('   ID:', result.rows[0].id);
    console.log('   用户名: test_user');
    console.log('   密码: test123456');
    console.log('   昵称:', result.rows[0].nickname);

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTestUser()
  .then(() => {
    console.log('\n🎉 完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 错误:', error.message);
    process.exit(1);
  });
