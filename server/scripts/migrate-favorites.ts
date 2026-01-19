/**
 * 执行 favorites 表迁移脚本
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'qmzg',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'dev_password_123',
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 开始执行数据库迁移...');

    // 读取迁移文件
    const migrationPath = path.join(__dirname, '../migrations/009_update_favorites_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // 执行迁移
    await client.query(sql);

    console.log('✅ 数据库迁移执行成功!');
    console.log('📋 favorites 表结构已更新');

  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('🎉 迁移完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 迁移失败:', error);
    process.exit(1);
  });
