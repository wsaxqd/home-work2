import { Request } from 'express';

/**
 * 认证请求接口
 * 扩展 Express Request，添加用户信息
 */
export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    userId: string;
    email?: string;
  };
}
