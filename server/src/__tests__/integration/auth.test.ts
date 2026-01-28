import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';

/**
 * 认证 API 集成测试
 *
 * 测试范围：
 * - 用户注册流程
 * - 用户登录流程
 * - Token 验证
 * - Token 刷新
 * - 请求和响应格式
 */

// Mock Express 应用
const createMockApp = () => {
  const express = require('express');
  const app = express();
  app.use(express.json());

  // Mock 数据库
  const users = new Map();
  const tokens = new Map();

  // 注册接口
  app.post('/api/auth/register', async (req: any, res: any) => {
    const { username, email, password, grade } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码为必填项',
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      });
    }

    // 检查邮箱是否已存在
    for (const user of users.values()) {
      if (user.email === email) {
        return res.status(409).json({
          success: false,
          message: '邮箱已被注册',
        });
      }
    }

    // 检查用户名是否已存在
    for (const user of users.values()) {
      if (user.username === username) {
        return res.status(409).json({
          success: false,
          message: '用户名已存在',
        });
      }
    }

    // 创建用户
    const userId = `user-${Date.now()}`;
    const newUser = {
      id: userId,
      username,
      email,
      password, // 实际应用中应该哈希
      grade: grade || 1,
      points: 0,
      level: 1,
      created_at: new Date(),
    };

    users.set(userId, newUser);

    return res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  });

  // 登录接口
  app.post('/api/auth/login', async (req: any, res: any) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码为必填项',
      });
    }

    // 查找用户
    let foundUser = null;
    for (const user of users.values()) {
      if (user.email === email) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser || foundUser.password !== password) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      });
    }

    // 生成 token
    const accessToken = `access-token-${Date.now()}`;
    const refreshToken = `refresh-token-${Date.now()}`;

    tokens.set(accessToken, {
      userId: foundUser.id,
      type: 'access',
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    tokens.set(refreshToken, {
      userId: foundUser.id,
      type: 'refresh',
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: foundUser.id,
          username: foundUser.username,
          email: foundUser.email,
          grade: foundUser.grade,
          points: foundUser.points,
          level: foundUser.level,
        },
      },
    });
  });

  // 验证 token 接口
  app.get('/api/auth/check', async (req: any, res: any) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
    }

    const token = authHeader.substring(7);
    const tokenData = tokens.get(token);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌',
      });
    }

    if (tokenData.expiresAt < Date.now()) {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期',
      });
    }

    const user = users.get(tokenData.userId);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    });
  });

  // 刷新 token 接口
  app.post('/api/auth/refresh', async (req: any, res: any) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '刷新令牌为必填项',
      });
    }

    const tokenData = tokens.get(refreshToken);

    if (!tokenData || tokenData.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: '无效的刷新令牌',
      });
    }

    if (tokenData.expiresAt < Date.now()) {
      return res.status(401).json({
        success: false,
        message: '刷新令牌已过期',
      });
    }

    // 生成新的 access token
    const newAccessToken = `access-token-${Date.now()}`;

    tokens.set(newAccessToken, {
      userId: tokenData.userId,
      type: 'access',
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  });

  return app;
};

describe('Auth API - 认证接口集成测试', () => {
  let app: any;

  beforeAll(() => {
    app = createMockApp();
  });

  describe('POST /api/auth/register - 用户注册', () => {
    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser1',
          email: 'test1@example.com',
          password: 'Password123!',
          grade: 3,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('注册成功');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data.username).toBe('testuser1');
      expect(response.body.data.email).toBe('test1@example.com');
    });

    it('应该返回正确的响应格式', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'Password123!',
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).not.toHaveProperty('password'); // 不应返回密码
    });

    it('边界条件：应该拒绝缺少必填字段', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('必填项');
    });

    it('边界条件：应该拒绝无效的邮箱格式', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser3',
          email: 'invalid-email',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱格式');
    });

    it('边界条件：应该拒绝重复的邮箱', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'duplicate@example.com',
          password: 'Pass123!',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'duplicate@example.com',
          password: 'Pass456!',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱已被注册');
    });

    it('边界条件：应该拒绝重复的用户名', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'email1@example.com',
          password: 'Pass123!',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'email2@example.com',
          password: 'Pass456!',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名已存在');
    });
  });

  describe('POST /api/auth/login - 用户登录', () => {
    beforeEach(async () => {
      // 注册测试用户
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'LoginPass123!',
        });
    });

    it('应该成功登录并返回 token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('登录成功');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('login@example.com');
    });

    it('应该返回用户信息（不包含密码）', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123!',
        });

      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('username');
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('边界条件：应该拒绝错误的密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱或密码错误');
    });

    it('边界条件：应该拒绝不存在的邮箱', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('边界条件：应该拒绝缺少邮箱或密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/check - Token 验证', () => {
    let accessToken: string;

    beforeEach(async () => {
      // 注册并登录获取 token
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'checkuser',
          email: 'check@example.com',
          password: 'CheckPass123!',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'check@example.com',
          password: 'CheckPass123!',
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('应该成功验证有效的 token', async () => {
      const response = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('check@example.com');
    });

    it('边界条件：应该拒绝缺少 Authorization 头', async () => {
      const response = await request(app)
        .get('/api/auth/check');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证令牌');
    });

    it('边界条件：应该拒绝无效的 token', async () => {
      const response = await request(app)
        .get('/api/auth/check')
        .set('Authorization', 'Bearer invalid-token-12345');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的认证令牌');
    });

    it('边界条件：应该拒绝错误的 Authorization 格式', async () => {
      const response = await request(app)
        .get('/api/auth/check')
        .set('Authorization', accessToken); // 缺少 "Bearer " 前缀

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh - Token 刷新', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'refreshuser',
          email: 'refresh@example.com',
          password: 'RefreshPass123!',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'RefreshPass123!',
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('应该成功刷新 access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.accessToken).toBeTruthy();
    });

    it('边界条件：应该拒绝无效的 refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的刷新令牌');
    });

    it('边界条件：应该拒绝缺少 refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('完整用户流程测试', () => {
    it('场景：新用户注册 -> 登录 -> 验证 token -> 刷新 token', async () => {
      // 1. 注册
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'flowuser',
          email: 'flow@example.com',
          password: 'FlowPass123!',
          grade: 5,
        });

      expect(registerResponse.status).toBe(201);
      const userId = registerResponse.body.data.userId;

      // 2. 登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'flow@example.com',
          password: 'FlowPass123!',
        });

      expect(loginResponse.status).toBe(200);
      const { accessToken, refreshToken } = loginResponse.body.data;

      // 3. 验证 token
      const checkResponse = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(checkResponse.status).toBe(200);
      expect(checkResponse.body.data.user.email).toBe('flow@example.com');

      // 4. 刷新 token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.data).toHaveProperty('accessToken');

      // 5. 使用新的 access token 验证
      const newAccessToken = refreshResponse.body.data.accessToken;
      const recheckResponse = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(recheckResponse.status).toBe(200);
    });
  });
});
