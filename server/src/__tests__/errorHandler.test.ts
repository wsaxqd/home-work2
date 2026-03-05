import { describe, it, expect } from '@jest/globals';
import { AppError } from '../middleware/errorHandler';

describe('错误处理测试', () => {
  describe('AppError类', () => {
    it('应该创建带有正确属性的AppError', () => {
      const error = new AppError('测试错误', 400, 'TEST_ERROR');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('测试错误');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('应该捕获堆栈跟踪', () => {
      const error = new AppError('测试错误', 500);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });

    it('应该支持不带错误代码的创建', () => {
      const error = new AppError('测试错误', 404);

      expect(error.message).toBe('测试错误');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBeUndefined();
    });
  });

  describe('HTTP状态码', () => {
    it('应该支持400系列错误', () => {
      const badRequest = new AppError('错误请求', 400);
      const unauthorized = new AppError('未授权', 401);
      const forbidden = new AppError('禁止访问', 403);
      const notFound = new AppError('未找到', 404);

      expect(badRequest.statusCode).toBe(400);
      expect(unauthorized.statusCode).toBe(401);
      expect(forbidden.statusCode).toBe(403);
      expect(notFound.statusCode).toBe(404);
    });

    it('应该支持500系列错误', () => {
      const serverError = new AppError('服务器错误', 500);
      const notImplemented = new AppError('未实现', 501);

      expect(serverError.statusCode).toBe(500);
      expect(notImplemented.statusCode).toBe(501);
    });
  });
});
