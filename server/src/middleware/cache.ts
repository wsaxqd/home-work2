import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache: Map<string, CacheEntry> = new Map();

// 定期清理过期缓存
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

export interface CacheOptions {
  ttl?: number; // 缓存时间(毫秒)
  keyGenerator?: (req: Request) => string; // 自定义key生成器
  condition?: (req: Request, res: Response) => boolean; // 缓存条件
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300000, // 默认5分钟
    keyGenerator = (req: Request) => {
      // 默认使用URL和查询参数作为key
      return `${req.method}:${req.originalUrl}`;
    },
    condition = (req: Request, res: Response) => {
      // 默认只缓存GET请求且状态码为200的响应
      return req.method === 'GET' && res.statusCode === 200;
    }
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // 只处理GET请求
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator(req);
    const cached = cache.get(key);

    // 检查缓存是否存在且未过期
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // 缓存未命中,继续处理请求
    res.setHeader('X-Cache', 'MISS');

    // 拦截res.json方法以缓存响应
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // 检查是否满足缓存条件
      if (condition(req, res)) {
        cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl
        });
      }
      return originalJson(data);
    };

    next();
  };
};

// 清除特定缓存
export const clearCache = (pattern?: string) => {
  if (!pattern) {
    cache.clear();
    return;
  }

  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
};

// 获取缓存统计信息
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
};

// 预设的缓存配置
export const shortCache = cacheMiddleware({
  ttl: 60000 // 1分钟
});

export const mediumCache = cacheMiddleware({
  ttl: 300000 // 5分钟
});

export const longCache = cacheMiddleware({
  ttl: 3600000 // 1小时
});

export default cacheMiddleware;
