// 运行作业助手数据库迁移
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

async function runMigration() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '../migrations/012_create_homework_helper_tables.sql'),
      'utf8'
    );

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('✅ 作业助手数据库表创建成功!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 创建失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
