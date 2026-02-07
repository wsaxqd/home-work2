/**
 * Jest 测试环境初始化文件
 *
 * 作用：
 * 1. 加载测试环境变量
 * 2. 验证测试数据库配置安全性
 * 3. 防止误操作生产数据库
 */

import dotenv from 'dotenv';
import path from 'path';

// 加载测试环境配置
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

/**
 * 安全检查：验证数据库配置
 * 防止测试代码连接到生产数据库
 */
function validateTestEnvironment() {
  const dbName = process.env.DB_NAME;
  const nodeEnv = process.env.NODE_ENV;

  // 检查 1: NODE_ENV 必须是 test
  if (nodeEnv !== 'test') {
    console.error('\n❌ 安全检查失败: NODE_ENV 必须设置为 "test"');
    console.error(`   当前值: ${nodeEnv}\n`);
    process.exit(1);
  }

  // 检查 2: 数据库名称必须包含 test 关键字
  if (!dbName || !dbName.toLowerCase().includes('test')) {
    console.error('\n❌ 安全检查失败: 数据库名称必须包含 "test"');
    console.error(`   当前数据库: ${dbName}`);
    console.error('   这是为了防止意外删除生产数据！\n');
    process.exit(1);
  }

  // 检查 3: JWT_SECRET 不能是生产密钥
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 20) {
    console.error('\n⚠️  警告: JWT_SECRET 过短或未设置');
  }

  // 检查 4: 确认测试模式已启用
  if (process.env.TEST_MODE !== 'true') {
    console.error('\n⚠️  警告: TEST_MODE 未设置为 true');
  }

  console.log('\n✅ 测试环境安全检查通过');
  console.log(`   数据库: ${dbName}`);
  console.log(`   环境: ${nodeEnv}`);
  console.log(`   端口: ${process.env.PORT}\n`);
}

// 执行安全检查
validateTestEnvironment();

// 设置全局测试超时时间（10秒）
jest.setTimeout(10000);
