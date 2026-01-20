// 修复 users 表的字段问题
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'dev_password_123',
  database: 'qmzg'
});

async function fixUsersTable() {
  const client = await pool.connect();
  try {
    console.log('🔧 开始修复 users 表...\n');

    const sql = fs.readFileSync(
      path.join(__dirname, '../migrations/013_fix_users_table.sql'),
      'utf8'
    );

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('✅ users 表修复成功!');
    console.log('\n修复内容:');
    console.log('  1. ✅ 添加 bio 字段 (用户个人简介)');
    console.log('  2. ✅ 修改 username 为可空 (支持邮箱登录)');
    console.log('  3. ✅ 修改 password_hash 为可空 (支持验证码登录)');
    console.log('  4. ✅ 创建 email_verify_codes 表');
    console.log('  5. ✅ 添加必要的索引和约束\n');

    // 验证修复结果
    console.log('🔍 验证修复结果...\n');

    const bioCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'bio'
    `);

    if (bioCheck.rows.length > 0) {
      console.log('✅ bio 字段已添加:', bioCheck.rows[0]);
    }

    const usernameCheck = await client.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'username'
    `);

    if (usernameCheck.rows.length > 0) {
      console.log('✅ username 可空状态:', usernameCheck.rows[0]);
    }

    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'email_verify_codes'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ email_verify_codes 表已创建');
    }

    console.log('\n🎉 所有修复完成!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 修复失败:', error.message);
    console.error('\n详细错误:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixUsersTable().catch(console.error);
