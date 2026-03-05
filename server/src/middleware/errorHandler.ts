import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 处理数据库错误
const handleDatabaseError = (err: any): AppError => {
  if (err.code === '23505') {
    // 唯一约束违反
    return new AppError('该数据已存在', 409, 'DUPLICATE_ENTRY');
  }
  if (err.code === '23503') {
    // 外键约束违反
    return new AppError('关联数据不存在', 400, 'FOREIGN_KEY_VIOLATION');
  }
  if (err.code === '23502') {
    // 非空约束违反
    return new AppError('缺少必填字段', 400, 'NOT_NULL_VIOLATION');
  }
  return new AppError('数据库操作失败', 500, 'DATABASE_ERROR');
};

// 处理JWT错误
const handleJWTError = (): AppError => {
  return new AppError('无效的认证令牌', 401, 'INVALID_TOKEN');
};

const handleJWTExpiredError = (): AppError => {
  return new AppError('认证令牌已过期', 401, 'TOKEN_EXPIRED');
};

// 处理验证错误
const handleValidationError = (err: any): AppError => {
  const message = err.message || '数据验证失败';
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // 处理特定类型的错误
  if ((err as any).code === '23505' || (err as any).code === '23503' || (err as any).code === '23502') {
    error = handleDatabaseError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  // 如果是操作性错误（AppError）
  if (error instanceof AppError && error.isOperational) {
    logger.warn(`Operational Error: ${error.message}`, {
      statusCode: error.statusCode,
      code: error.code,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: (req as any).userId,
    });

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // 未知错误（编程错误）
  logger.error('Unexpected Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userId: (req as any).userId,
  });

  // 生产环境不暴露错误详情
  const message = process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : err.message || '服务器内部错误';

  return res.status(500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    }),
  });
};

// 404错误处理
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    code: 'NOT_FOUND',
    path: req.path,
  });
};
