import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * HTTP请求日志中间件
 * 记录所有HTTP请求的详细信息
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // 记录请求信息
  const requestInfo = {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).userId,
  };

  // 监听响应完成事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      ...requestInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };

    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, logData);
    } else {
      logger.http(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, logData);
    }
  });

  next();
};

/**
 * 性能监控中间件
 * 记录慢请求
 */
export const performanceMonitor = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > threshold) {
        logger.warn(`Slow Request: ${req.method} ${req.path} took ${duration}ms`, {
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          query: req.query,
          userId: (req as any).userId,
        });
      }
    });

    next();
  };
};
