import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// 清理过期的记录
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // 每分钟清理一次

export interface RateLimitOptions {
  windowMs?: number; // 时间窗口(毫秒)
  max?: number; // 最大请求数
  message?: string; // 超限提示信息
  statusCode?: number; // 超限状态码
  skipSuccessfulRequests?: boolean; // 是否跳过成功的请求
  skipFailedRequests?: boolean; // 是否跳过失败的请求
  keyGenerator?: (req: Request) => string; // 自定义key生成器
}

export const rateLimit = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 60000, // 默认1分钟
    max = 100, // 默认100次
    message = '请求过于频繁,请稍后再试',
    statusCode = 429,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req: Request) => {
      // 默认使用IP作为key
      return req.ip || req.socket.remoteAddress || 'unknown';
    }
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // 初始化或重置计数器
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // 增加计数
    store[key].count++;

    // 设置响应头
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    // 检查是否超限
    if (store[key].count > max) {
      return res.status(statusCode).json({
        success: false,
        message,
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      });
    }

    // 如果需要,在响应后调整计数
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalSend = res.send;
      res.send = function(data: any) {
        const statusCode = res.statusCode;
        const isSuccessful = statusCode >= 200 && statusCode < 300;
        const isFailed = statusCode >= 400;

        if ((skipSuccessfulRequests && isSuccessful) || (skipFailedRequests && isFailed)) {
          store[key].count--;
        }

        return originalSend.call(this, data);
      };
    }

    next();
  };
};

// 预设的限流配置
export const strictRateLimit = rateLimit({
  windowMs: 60000, // 1分钟
  max: 20, // 20次
  message: '请求过于频繁,请稍后再试'
});

export const moderateRateLimit = rateLimit({
  windowMs: 60000, // 1分钟
  max: 60, // 60次
  message: '请求过于频繁,请稍后再试'
});

export const lenientRateLimit = rateLimit({
  windowMs: 60000, // 1分钟
  max: 120, // 120次
  message: '请求过于频繁,请稍后再试'
});

// 针对登录等敏感操作的严格限流
export const authRateLimit = rateLimit({
  windowMs: 900000, // 15分钟
  max: 5, // 5次
  message: '登录尝试次数过多,请15分钟后再试',
  skipSuccessfulRequests: true // 成功的请求不计数
});

export default rateLimit;
