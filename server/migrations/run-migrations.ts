import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../src/config';

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🚀 开始执行数据库迁移...\n');

    // 获取所有迁移文件
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  没有找到迁移文件');
      return;
    }

    // 执行每个迁移文件
    for (const file of files) {
      console.log(`📄 执行迁移: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query(sql);
      console.log(`✅ ${file} 执行成功\n`);
    }

    console.log('🎉 所有迁移执行完成！');
  } catch (error) {
    console.error('❌ 迁移执行失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
