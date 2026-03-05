# 日志系统使用指南

## 📋 概述

本项目使用 **Winston** 作为专业日志库，提供结构化日志、日志分级、文件输出等功能。

---

## 🎯 日志级别

日志系统支持以下级别（按优先级从高到低）：

| 级别 | 用途 | 颜色 | 示例场景 |
|------|------|------|----------|
| `error` | 错误信息 | 🔴 红色 | 数据库连接失败、API调用错误 |
| `warn` | 警告信息 | 🟡 黄色 | 配置缺失、性能警告 |
| `info` | 一般信息 | 🟢 绿色 | 服务启动、请求处理 |
| `http` | HTTP请求 | 🟣 紫色 | API请求日志 |
| `debug` | 调试信息 | 🔵 蓝色 | 变量值、执行流程 |

### 环境配置

- **开发环境** (`NODE_ENV=development`): 输出所有级别（包括 debug）
- **生产环境** (`NODE_ENV=production`): 仅输出 info 及以上级别

---

## 🚀 使用方法

### 基础用法

```typescript
import { logger } from '../utils/logger';

// 调试信息（仅开发环境）
logger.debug('用户ID:', userId, '查询参数:', params);

// 一般信息
logger.info('用户登录成功:', username);

// 警告信息
logger.warn('缓存未命中，使用数据库查询');

// 错误信息
logger.error('数据库查询失败:', error.message);

// 成功信息
logger.success('数据导入完成，共', count, '条记录');

// HTTP请求
logger.http('GET /api/users - 200 - 45ms');
```

### 高级用法

如需更精细的控制，可以使用 Winston 实例：

```typescript
import winstonLogger from '../utils/logger';

// 带元数据的日志
winstonLogger.info('用户操作', {
  userId: 123,
  action: 'create_work',
  timestamp: new Date(),
});

// 带错误堆栈的日志
winstonLogger.error('处理失败', {
  error: error.stack,
  context: { userId, workId },
});
```

---

## 📁 日志文件

日志会自动写入以下文件：

```
server/logs/
├── combined.log      # 所有日志（info及以上）
├── error.log         # 仅错误日志
├── exceptions.log    # 未捕获的异常
└── rejections.log    # 未处理的Promise拒绝
```

### 日志格式

**控制台输出**（带颜色）：
```
2026-02-13 15:30:45 [info]: 服务器启动成功，端口: 3000
2026-02-13 15:30:46 [error]: 数据库连接失败
```

**文件输出**（JSON格式）：
```json
{
  "level": "info",
  "message": "服务器启动成功，端口: 3000",
  "timestamp": "2026-02-13 15:30:45"
}
```

---

## 🔄 迁移指南

### 从 console.log 迁移

**之前：**
```typescript
console.log('用户登录:', username);
console.error('错误:', error);
console.warn('警告:', message);
```

**之后：**
```typescript
import { logger } from '../utils/logger';

logger.info('用户登录:', username);
logger.error('错误:', error);
logger.warn('警告:', message);
```

### 批量替换建议

1. **简单替换**：
   - `console.log` → `logger.info`
   - `console.error` → `logger.error`
   - `console.warn` → `logger.warn`

2. **调试日志**：
   - 开发调试用的 `console.log` → `logger.debug`

3. **成功消息**：
   - 带 ✅ 的成功消息 → `logger.success`

---

## 📊 日志最佳实践

### 1. 选择合适的日志级别

```typescript
// ✅ 好的做法
logger.debug('查询参数:', params);           // 调试信息
logger.info('用户注册成功');                  // 业务信息
logger.warn('Redis连接超时，使用内存缓存');   // 警告
logger.error('支付接口调用失败:', error);     // 错误

// ❌ 不好的做法
logger.info('变量x的值:', x);                 // 应该用 debug
logger.error('用户登录成功');                 // 应该用 info
```

### 2. 提供足够的上下文

```typescript
// ✅ 好的做法
logger.error('创建作品失败', {
  userId: req.user.id,
  title: workData.title,
  error: error.message,
});

// ❌ 不好的做法
logger.error('失败');  // 缺少上下文
```

### 3. 避免敏感信息

```typescript
// ✅ 好的做法
logger.info('用户登录', { userId: user.id });

// ❌ 不好的做法
logger.info('用户登录', {
  password: user.password,  // 不要记录密码
  token: user.token,        // 不要记录token
});
```

### 4. 使用结构化日志

```typescript
// ✅ 好的做法
logger.info('API请求', {
  method: 'POST',
  path: '/api/works',
  userId: req.user.id,
  duration: Date.now() - startTime,
});

// ❌ 不好的做法
logger.info(`POST /api/works by ${req.user.id} took ${duration}ms`);
```

---

## 🔧 配置选项

### 修改日志级别

编辑 `src/utils/logger.ts`：

```typescript
const level = () => {
  // 始终输出 debug
  return 'debug';

  // 或根据环境变量
  return process.env.LOG_LEVEL || 'info';
};
```

### 添加新的日志传输

```typescript
// 添加每日轮转日志
import 'winston-daily-rotate-file';

const dailyRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
});

transports.push(dailyRotateTransport);
```

### 禁用文件日志（开发环境）

```typescript
const transports = [
  new winston.transports.Console({ format: consoleFormat }),
];

// 仅生产环境写入文件
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
}
```

---

## 🐛 调试技巧

### 1. 临时启用 debug 日志

```bash
# 启动时设置环境变量
NODE_ENV=development npm run dev

# 或在 .env 中设置
LOG_LEVEL=debug
```

### 2. 查看实时日志

```bash
# 查看所有日志
tail -f server/logs/combined.log

# 仅查看错误
tail -f server/logs/error.log

# 过滤特定关键词
tail -f server/logs/combined.log | grep "用户"
```

### 3. 分析日志

```bash
# 统计错误数量
grep "error" server/logs/combined.log | wc -l

# 查找特定用户的操作
grep "userId.*123" server/logs/combined.log

# 查看最近的错误
tail -100 server/logs/error.log
```

---

## 📈 性能考虑

### 1. 避免在循环中大量日志

```typescript
// ❌ 不好的做法
users.forEach(user => {
  logger.debug('处理用户:', user.id);  // 10000次日志
});

// ✅ 好的做法
logger.debug('开始处理用户，总数:', users.length);
users.forEach(user => {
  // 处理逻辑
});
logger.debug('用户处理完成');
```

### 2. 使用条件日志

```typescript
// 仅在需要时计算日志内容
if (process.env.NODE_ENV === 'development') {
  logger.debug('复杂对象:', JSON.stringify(complexObject, null, 2));
}
```

### 3. 异步日志

Winston 默认是异步的，不会阻塞主线程。但要注意：

```typescript
// 确保进程退出前日志写入完成
process.on('exit', () => {
  winstonLogger.end();
});
```

---

## 🔒 生产环境建议

### 1. 日志轮转

使用 `winston-daily-rotate-file` 避免日志文件过大：

```bash
npm install winston-daily-rotate-file
```

### 2. 日志聚合

考虑使用日志聚合服务：
- **ELK Stack** (Elasticsearch + Logstash + Kibana)
- **Grafana Loki**
- **Datadog**
- **Sentry** (错误追踪)

### 3. 监控告警

设置关键错误的告警：
- 数据库连接失败
- API 错误率超过阈值
- 内存/CPU 使用率过高

### 4. 日志保留策略

```typescript
// 保留最近14天的日志
maxFiles: '14d',

// 单个文件最大20MB
maxSize: '20m',
```

---

## 📞 常见问题

### Q1: 日志文件在哪里？

A: 所有日志文件在 `server/logs/` 目录下。该目录已添加到 `.gitignore`。

### Q2: 如何在生产环境查看日志？

A:
```bash
# SSH 到服务器
ssh user@server

# 查看实时日志
pm2 logs qmzg-server

# 或直接查看文件
tail -f /path/to/server/logs/combined.log
```

### Q3: 日志太多怎么办？

A:
1. 提高日志级别（info → warn）
2. 启用日志轮转
3. 减少不必要的日志输出
4. 使用日志采样（仅记录部分请求）

### Q4: 如何记录 HTTP 请求？

A: 使用 `morgan` 中间件（已集成）：

```typescript
import morgan from 'morgan';
import { logger } from './utils/logger';

// 将 morgan 输出到 winston
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));
```

---

## 🔗 相关资源

- [Winston 官方文档](https://github.com/winstonjs/winston)
- [日志最佳实践](https://www.loggly.com/ultimate-guide/node-logging-basics/)
- [生产环境日志管理](https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/)

---

**最后更新**: 2026-02-13
