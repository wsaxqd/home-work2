// 测试数据库修复结果
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'admin',
  password: 'dev_password_123',
  database: 'qmzg'
});

async function testDatabaseFix() {
  const client = await pool.connect();
  try {
    console.log('🧪 测试数据库修复结果...\n');

    // 测试1: 检查bio字段
    console.log('1️⃣ 测试 bio 字段...');
    const bioTest = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'bio'
    `);
    if (bioTest.rows.length > 0) {
      console.log('   ✅ bio 字段存在:', bioTest.rows[0]);
    } else {
      console.log('   ❌ bio 字段不存在');
    }

    // 测试2: 检查username是否可空
    console.log('\n2️⃣ 测试 username 可空约束...');
    const usernameTest = await client.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'username'
    `);
    if (usernameTest.rows.length > 0) {
      console.log('   ✅ username 可空状态:', usernameTest.rows[0]);
    }

    // 测试3: 检查password_hash是否可空
    console.log('\n3️⃣ 测试 password_hash 可空约束...');
    const passwordTest = await client.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `);
    if (passwordTest.rows.length > 0) {
      console.log('   ✅ password_hash 可空状态:', passwordTest.rows[0]);
    }

    // 测试4: 检查email_verify_codes表
    console.log('\n4️⃣ 测试 email_verify_codes 表...');
    const tableTest = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'email_verify_codes'
    `);
    if (tableTest.rows.length > 0) {
      console.log('   ✅ email_verify_codes 表存在');

      // 检查表结构
      const columnsTest = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'email_verify_codes'
        ORDER BY ordinal_position
      `);
      console.log('   📋 表结构:', columnsTest.rows);
    } else {
      console.log('   ❌ email_verify_codes 表不存在');
    }

    // 测试5: 尝试插入一条邮箱登录的测试用户
    console.log('\n5️⃣ 测试邮箱登录用户插入...');
    try {
      const insertTest = await client.query(`
        INSERT INTO users (email, nickname)
        VALUES ('test@example.com', '测试用户')
        RETURNING id, email, nickname, username, password_hash, bio
      `);
      console.log('   ✅ 邮箱用户插入成功:', insertTest.rows[0]);

      // 清理测试数据
      await client.query(`DELETE FROM users WHERE email = 'test@example.com'`);
      console.log('   🧹 测试数据已清理');
    } catch (error) {
      console.log('   ❌ 插入失败:', error.message);
    }

    console.log('\n🎉 所有测试完成!');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testDatabaseFix().catch(console.error);
