/**
 * Jest 测试环境后置配置
 *
 * 作用：
 * 1. 管理测试数据库连接
 * 2. 提供全局的数据库清理函数
 * 3. 确保测试结束后正确关闭连接
 */

import { Pool } from 'pg';

// 创建测试数据库连接池
export const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'qmzg_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10, // 测试环境连接池较小
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * 全局数据库查询函数（供测试使用）
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await testPool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.LOG_QUERIES === 'true') {
      console.log('executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * 清理测试数据 - 按表清理
 */
export async function cleanupTestData() {
  try {
    // 按照外键依赖顺序删除数据
    await query('DELETE FROM point_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')');
    await query('DELETE FROM shop_orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')');
    await query('DELETE FROM learning_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')');
    await query('DELETE FROM learning_plans WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')');
    await query('DELETE FROM users WHERE email LIKE \'%test%\'');
  } catch (error) {
    console.error('清理测试数据失败:', error);
    throw error;
  }
}

/**
 * 清理特定用户的测试数据
 */
export async function cleanupTestUser(userId: number) {
  try {
    await query('DELETE FROM point_transactions WHERE user_id = $1', [userId]);
    await query('DELETE FROM shop_orders WHERE user_id = $1', [userId]);
    await query('DELETE FROM learning_progress WHERE user_id = $1', [userId]);
    await query('DELETE FROM learning_plans WHERE user_id = $1', [userId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);
  } catch (error) {
    console.error(`清理用户 ${userId} 数据失败:`, error);
    throw error;
  }
}

/**
 * 验证数据库连接
 */
export async function verifyDatabaseConnection() {
  try {
    const result = await query('SELECT NOW() as now, current_database() as db');
    console.log(`✅ 数据库连接成功: ${result.rows[0].db}`);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

/**
 * 全局测试前置 - 验证数据库连接
 */
beforeAll(async () => {
  console.log('\n🔧 初始化测试环境...');
  const connected = await verifyDatabaseConnection();
  if (!connected) {
    console.error('数据库连接失败，测试将被中止');
    process.exit(1);
  }
});

/**
 * 全局测试后置 - 关闭数据库连接
 */
afterAll(async () => {
  console.log('\n🧹 清理测试环境...');
  try {
    // 关闭连接池
    await testPool.end();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error);
  }
});

// 全局异常处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', promise, 'reason:', reason);
});
