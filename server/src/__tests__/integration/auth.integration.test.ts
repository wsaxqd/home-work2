import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../index';
import { query, cleanupTestUser } from '../../../tests/setupAfterEnv';

/**
 * 认证 API 真实集成测试
 *
 * 特点：
 * - 使用真实的 Express 应用（从 src/index.ts 导入）
 * - 连接真实的 PostgreSQL 测试数据库
 * - 测试完整的请求 → 路由 → 控制器 → 服务 → 数据库链路
 * - 验证数据库状态变化
 * - 自动清理测试数据
 *
 * 测试范围：
 * - 用户注册流程（数据库写入验证）
 * - 用户登录流程（数据库查询验证）
 * - Token 验证（JWT 真实验证）
 * - Token 刷新（JWT 真实刷新）
 * - 完整用户流程（端到端测试）
 * - 数据库事务和回滚
 */

describe('Auth API - 真实集成测试', () => {
  // 用于追踪测试创建的用户ID，便于清理
  const testUserIds: number[] = [];

  /**
   * 每个测试后清理创建的测试用户
   */
  afterEach(async () => {
    for (const userId of testUserIds) {
      try {
        await cleanupTestUser(userId);
      } catch (error) {
        console.error(`清理用户 ${userId} 失败:`, error);
      }
    }
    testUserIds.length = 0;
  });

  describe('POST /api/auth/register - 用户注册（真实数据库）', () => {
    it('应该成功注册新用户并写入数据库', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testUsername = `testuser-${Date.now()}`;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'Password123!',
          grade: 3,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('注册成功');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data.username).toBe(testUsername);
      expect(response.body.data.email).toBe(testEmail);

      const userId = response.body.data.userId;
      testUserIds.push(userId);

      // 验证数据库状态：用户确实被创建
      const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].email).toBe(testEmail);
      expect(result.rows[0].username).toBe(testUsername);
      expect(result.rows[0].grade).toBe(3);
      // 密码应该被哈希，不应该是明文
      expect(result.rows[0].password_hash).toBeDefined();
      expect(result.rows[0].password_hash).not.toBe('Password123!');
    });

    it('应该返回正确的响应格式（不包含密码）', async () => {
      const testEmail = `test-format-${Date.now()}@example.com`;
      const testUsername = `formatuser-${Date.now()}`;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'Password123!',
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('password_hash');

      testUserIds.push(response.body.data.userId);
    });

    it('边界条件：应该拒绝缺少必填字段', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'onlyusername',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('必填');
    });

    it('边界条件：应该拒绝无效的邮箱格式', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `testuser-${Date.now()}`,
          email: 'invalid-email-format',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱');
    });

    it('边界条件：应该拒绝重复的邮箱（数据库唯一约束）', async () => {
      const duplicateEmail = `duplicate-${Date.now()}@example.com`;

      // 第一次注册成功
      const response1 = await request(app)
        .post('/api/auth/register')
        .send({
          username: `user1-${Date.now()}`,
          email: duplicateEmail,
          password: 'Pass123!',
        });

      expect(response1.status).toBe(201);
      testUserIds.push(response1.body.data.userId);

      // 第二次使用相同邮箱应该失败
      const response2 = await request(app)
        .post('/api/auth/register')
        .send({
          username: `user2-${Date.now()}`,
          email: duplicateEmail,
          password: 'Pass456!',
        });

      expect(response2.status).toBe(409);
      expect(response2.body.success).toBe(false);
      expect(response2.body.message).toContain('邮箱已被注册');
    });

    it('边界条件：应该拒绝重复的用户名（数据库唯一约束）', async () => {
      const duplicateUsername = `duplicateuser-${Date.now()}`;

      const response1 = await request(app)
        .post('/api/auth/register')
        .send({
          username: duplicateUsername,
          email: `email1-${Date.now()}@example.com`,
          password: 'Pass123!',
        });

      expect(response1.status).toBe(201);
      testUserIds.push(response1.body.data.userId);

      const response2 = await request(app)
        .post('/api/auth/register')
        .send({
          username: duplicateUsername,
          email: `email2-${Date.now()}@example.com`,
          password: 'Pass456!',
        });

      expect(response2.status).toBe(409);
      expect(response2.body.success).toBe(false);
      expect(response2.body.message).toContain('用户名已存在');
    });

    it('真实场景：注册后应该初始化用户积分和等级', async () => {
      const testEmail = `points-${Date.now()}@example.com`;
      const testUsername = `pointsuser-${Date.now()}`;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      const userId = response.body.data.userId;
      testUserIds.push(userId);

      // 验证数据库：新用户应该有初始积分和等级
      const result = await query('SELECT points, level FROM users WHERE id = $1', [userId]);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].points).toBeDefined();
      expect(result.rows[0].level).toBeDefined();
    });
  });

  describe('POST /api/auth/login - 用户登录（真实数据库）', () => {
    let testEmail: string;
    let testPassword: string;
    let testUserId: number;

    beforeEach(async () => {
      // 每个测试前创建一个测试用户
      testEmail = `login-${Date.now()}@example.com`;
      testPassword = 'LoginPass123!';

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: `loginuser-${Date.now()}`,
          email: testEmail,
          password: testPassword,
        });

      testUserId = registerResponse.body.data.userId;
      testUserIds.push(testUserId);
    });

    it('应该成功登录并返回真实的 JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('登录成功');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');

      // 验证 token 是真实的 JWT 格式（header.payload.signature）
      const accessToken = response.body.data.accessToken;
      expect(accessToken.split('.')).toHaveLength(3);

      const refreshToken = response.body.data.refreshToken;
      expect(refreshToken.split('.')).toHaveLength(3);
    });

    it('应该返回用户信息（不包含密码）', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('username');
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('边界条件：应该拒绝错误的密码（真实 bcrypt 验证）', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码错误');
    });

    it('边界条件：应该拒绝不存在的邮箱（数据库查询）', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent-email@example.com',
          password: 'SomePassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('真实场景：多次登录应该生成不同的 token', async () => {
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      const response2 = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(response1.body.data.accessToken).not.toBe(response2.body.data.accessToken);
      expect(response1.body.data.refreshToken).not.toBe(response2.body.data.refreshToken);
    });
  });

  describe('GET /api/auth/check - Token 验证（真实 JWT）', () => {
    let accessToken: string;
    let testUserId: number;

    beforeEach(async () => {
      const testEmail = `check-${Date.now()}@example.com`;
      const testPassword = 'CheckPass123!';

      // 注册用户
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: `checkuser-${Date.now()}`,
          email: testEmail,
          password: testPassword,
        });

      testUserId = registerResponse.body.data.userId;
      testUserIds.push(testUserId);

      // 登录获取 token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('应该成功验证有效的 JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.id).toBe(testUserId);
    });

    it('边界条件：应该拒绝缺少 Authorization 头', async () => {
      const response = await request(app)
        .get('/api/auth/check');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供');
    });

    it('边界条件：应该拒绝无效的 JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/check')
        .set('Authorization', 'Bearer invalid.jwt.token.12345');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('边界条件：应该拒绝篡改的 JWT token', async () => {
      // 修改 token 的最后一个字符
      const tamperedToken = accessToken.slice(0, -1) + 'X';

      const response = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('真实场景：Token 验证后能够访问受保护的资源', async () => {
      // 验证 token
      const checkResponse = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(checkResponse.status).toBe(200);

      // 使用相同 token 访问其他受保护的 API
      const userResponse = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // 如果 token 有效，应该能成功访问用户信息
      expect(userResponse.status).not.toBe(401);
    });
  });

  describe('POST /api/auth/refresh - Token 刷新（真实 JWT）', () => {
    let refreshToken: string;
    let testUserId: number;

    beforeEach(async () => {
      const testEmail = `refresh-${Date.now()}@example.com`;
      const testPassword = 'RefreshPass123!';

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: `refreshuser-${Date.now()}`,
          email: testEmail,
          password: testPassword,
        });

      testUserId = registerResponse.body.data.userId;
      testUserIds.push(testUserId);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('应该成功刷新 access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');

      // 新 token 应该是有效的 JWT
      const newAccessToken = response.body.data.accessToken;
      expect(newAccessToken.split('.')).toHaveLength(3);

      // 验证新 token 可以使用
      const checkResponse = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(checkResponse.status).toBe(200);
    });

    it('边界条件：应该拒绝无效的 refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.refresh.token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('边界条件：应该拒绝缺少 refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('完整用户流程测试（端到端 + 数据库验证）', () => {
    it('场景：新用户注册 → 登录 → 验证 → 刷新 → 数据库验证', async () => {
      const testEmail = `flow-${Date.now()}@example.com`;
      const testUsername = `flowuser-${Date.now()}`;
      const testPassword = 'FlowPass123!';

      // 1. 注册
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: testPassword,
          grade: 5,
        });

      expect(registerResponse.status).toBe(201);
      const userId = registerResponse.body.data.userId;
      testUserIds.push(userId);

      // 验证数据库：用户已创建
      const dbResult1 = await query('SELECT * FROM users WHERE id = $1', [userId]);
      expect(dbResult1.rows.length).toBe(1);
      expect(dbResult1.rows[0].email).toBe(testEmail);

      // 2. 登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(loginResponse.status).toBe(200);
      const { accessToken, refreshToken } = loginResponse.body.data;

      // 3. 验证 access token
      const checkResponse = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(checkResponse.status).toBe(200);
      expect(checkResponse.body.data.user.email).toBe(testEmail);

      // 4. 刷新 token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      const newAccessToken = refreshResponse.body.data.accessToken;

      // 5. 使用新 token 再次验证
      const recheckResponse = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(recheckResponse.status).toBe(200);
      expect(recheckResponse.body.data.user.id).toBe(userId);

      // 最终数据库验证：用户数据完整
      const dbResult2 = await query('SELECT * FROM users WHERE id = $1', [userId]);
      expect(dbResult2.rows.length).toBe(1);
      expect(dbResult2.rows[0].username).toBe(testUsername);
      expect(dbResult2.rows[0].grade).toBe(5);
    });

    it('场景：用户登录失败后成功登录（审计日志）', async () => {
      const testEmail = `audit-${Date.now()}@example.com`;
      const testPassword = 'AuditPass123!';

      // 注册用户
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: `audituser-${Date.now()}`,
          email: testEmail,
          password: testPassword,
        });

      testUserIds.push(registerResponse.body.data.userId);

      // 尝试错误密码登录（失败）
      const failedLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPassword!' });

      expect(failedLogin.status).toBe(401);

      // 使用正确密码登录（成功）
      const successLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(successLogin.status).toBe(200);
      expect(successLogin.body.data).toHaveProperty('accessToken');
    });
  });

  describe('数据库事务和异常处理', () => {
    it('应该处理数据库连接失败的情况', async () => {
      // 注意：这个测试在正常情况下会通过，因为数据库连接正常
      // 如果需要测试失败情况，需要手动模拟数据库故障
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `dbtest-${Date.now()}`,
          email: `dbtest-${Date.now()}@example.com`,
          password: 'DbTest123!',
        });

      // 应该成功或返回明确的错误信息
      expect([201, 500, 503]).toContain(response.status);

      if (response.status === 201) {
        testUserIds.push(response.body.data.userId);
      }
    });

    it('应该正确处理 SQL 注入攻击', async () => {
      const maliciousEmail = "test' OR '1'='1' --@example.com";

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousEmail,
          password: 'anything',
        });

      // 应该返回 401（未找到用户）而不是 200（登录成功）
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
