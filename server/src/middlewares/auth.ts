import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    role?: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('未提供认证令牌', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    req.userId = decoded.userId;
    req.user = { id: decoded.userId };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('无效的认证令牌', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('认证令牌已过期', 401));
    }
    next(error);
  }
};

// 别名导出
export const authenticateToken = authMiddleware;

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      req.userId = decoded.userId;
      req.user = { id: decoded.userId };
    }

    next();
  } catch (error) {
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('未授权', 401));
    }

    if (roles.length > 0 && req.user.role && !roles.includes(req.user.role)) {
      return next(new AppError('权限不足', 403));
    }

    next();
  };
};
