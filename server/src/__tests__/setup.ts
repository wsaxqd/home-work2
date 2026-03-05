/**
 * Jest测试环境设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'qmzg_test';
process.env.DB_USER = 'admin';
process.env.DB_PASSWORD = 'test-password';

// 设置测试超时
jest.setTimeout(10000);

// 全局测试钩子
beforeAll(async () => {
  // 测试前的全局设置
});

afterAll(async () => {
  // 测试后的全局清理
});
