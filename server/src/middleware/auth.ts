import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
  userType?: string;
}

// 用户认证中间件
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证token'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId || decoded.id;
    req.userType = decoded.type || 'user';

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '无效的token'
    });
  }
};

// 可选的认证中间件（token可以不存在）
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.userId = decoded.userId || decoded.id;
      req.userType = decoded.type || 'user';
    }

    next();
  } catch (error) {
    // Token无效时也继续，但不设置userId
    next();
  }
};
