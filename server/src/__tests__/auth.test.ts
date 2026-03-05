import { describe, it, expect } from '@jest/globals';
import jwt from 'jsonwebtoken';

describe('JWT认证测试', () => {
  const JWT_SECRET = 'test-jwt-secret-key';
  const testUser = {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: 'user',
  };

  it('应该能够生成有效的JWT token', () => {
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('应该能够验证有效的JWT token', () => {
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    expect(decoded.userId).toBe(testUser.userId);
    expect(decoded.email).toBe(testUser.email);
    expect(decoded.role).toBe(testUser.role);
  });

  it('应该拒绝无效的JWT token', () => {
    const invalidToken = 'invalid.token.here';

    expect(() => {
      jwt.verify(invalidToken, JWT_SECRET);
    }).toThrow();
  });

  it('应该拒绝过期的JWT token', () => {
    const expiredToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '0s' });

    // 等待token过期
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(() => {
          jwt.verify(expiredToken, JWT_SECRET);
        }).toThrow('jwt expired');
        resolve(true);
      }, 100);
    });
  });

  it('应该拒绝使用错误密钥签名的token', () => {
    const token = jwt.sign(testUser, 'wrong-secret', { expiresIn: '1h' });

    expect(() => {
      jwt.verify(token, JWT_SECRET);
    }).toThrow();
  });
});
