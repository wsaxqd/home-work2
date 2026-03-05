# 系统架构与技术栈详细分析

## 项目概览

**项目名称：** 启蒙之光 (QMZG) - 儿童教育平台
**项目类型：** 全栈Web应用 + 移动端支持
**开发模式：** 前后端分离

---

## 一、技术栈总览

### 前端技术栈

#### 核心框架
- **React 19.2.0** - UI框架
- **React Router DOM 7.9.6** - 路由管理
- **TypeScript 5.9.3** - 类型系统

#### 构建工具
- **Vite 7.2.4** - 构建工具和开发服务器
- **Vitest 4.0.18** - 单元测试框架

#### 移动端支持
- **Capacitor 8.0.1** - 跨平台移动应用框架
  - 支持 Android
  - 支持 iOS

#### 状态管理
- **Context API** - 全局状态管理（认证、主题等）
- **localStorage** - 本地数据持久化

#### 开发配置
- **端口：** 5174
- **API代理：** `/api` → `http://localhost:3000`
- **路径别名：** `@`, `@components`, `@pages` 等

### 后端技术栈

#### 核心框架
- **Node.js** - 运行时环境
- **Express.js** - Web框架
- **TypeScript** - 类型系统

#### 数据库
- **PostgreSQL** - 关系型数据库
- **pg (node-postgres)** - PostgreSQL客户端
- **连接池配置：**
  - 最大连接数：20
  - 空闲超时：30秒
  - 连接超时：2秒

#### 认证与安全
- **JWT (jsonwebtoken)** - 身份认证
  - Access Token：7天有效期
  - Refresh Token：30天有效期
- **bcrypt** - 密码加密

#### AI集成
- **Dify API** - AI对话和内容生成
  - 聊天助手
  - 故事生成
  - 情感分析
  - 辅导评估
- **智谱AI (Zhipu)** - 备用AI服务

#### 日志系统
- **Winston** - 日志框架
- **winston-daily-rotate-file** - 日志轮转
- **日志级别：** error, warn, info, http, debug
- **日志保留：**
  - 错误日志：30天
  - 综合日志：30天
  - HTTP日志：7天
  - 单文件最大：20MB

#### 邮件服务
- **SMTP** - 邮件发送
- **支持：** Gmail, 自定义SMTP服务器

---

## 二、系统架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端层 (React)                       │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │  Web端   │ Android  │   iOS    │  Capacitor封装   │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                   API网关层 (Express)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  认证中间件 │ 限流中间件 │ 日志中间件 │ 错误处理  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    业务逻辑层 (Services)                  │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │ 学习系统 │ 游戏系统 │ AI助手   │  家长端          │  │
│  │ 社区系统 │ 积分系统 │ PK对战   │  作业辅导        │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    数据访问层 (DAL)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PostgreSQL连接池 │ 查询构建器 │ 事务管理        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  数据存储层 (PostgreSQL)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  107张数据表 │ 索引 │ 约束 │ 触发器              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 中间件架构

#### 1. 认证中间件 (auth.ts)

**功能：**
- JWT Token验证
- 用户身份识别
- 权限检查

**实现：**
```typescript
authenticateToken(req, res, next)
  ↓
提取 Authorization Header
  ↓
验证 JWT Token
  ↓
解析用户信息 (userId, email, role)
  ↓
注入到 req.user
  ↓
继续处理请求
```

**支持模式：**
- `authenticateToken` - 必须认证
- `optionalAuth` - 可选认证

#### 2. 限流中间件 (rateLimit.ts)

**功能：**
- 防止API滥用
- 保护服务器资源
- 防止暴力破解

**限流策略：**

| 策略 | 时间窗口 | 最大请求数 | 适用场景 |
|------|---------|-----------|---------|
| strictRateLimit | 1分钟 | 20次 | 敏感操作 |
| moderateRateLimit | 1分钟 | 60次 | 一般API |
| lenientRateLimit | 1分钟 | 120次 | 公开API |
| authRateLimit | 15分钟 | 5次 | 登录注册 |

**实现机制：**
- 基于内存的计数器
- 使用IP地址作为Key
- 自动清理过期记录（每分钟）
- 返回限流响应头：
  - `X-RateLimit-Limit` - 限制数
  - `X-RateLimit-Remaining` - 剩余次数
  - `X-RateLimit-Reset` - 重置时间

#### 3. 错误处理中间件 (errorHandler.ts)

**功能：**
- 统一错误处理
- 错误分类和转换
- 日志记录
- 安全的错误响应

**错误类型处理：**

1. **数据库错误**
   - `23505` - 唯一约束违反 → 409 Conflict
   - `23503` - 外键约束违反 → 400 Bad Request
   - `23502` - 非空约束违反 → 400 Bad Request

2. **JWT错误**
   - `JsonWebTokenError` → 401 Unauthorized
   - `TokenExpiredError` → 401 Unauthorized

3. **验证错误**
   - `ValidationError` → 400 Bad Request

4. **自定义错误**
   - `AppError` - 操作性错误（可预期）
   - 其他 - 编程错误（不可预期）

**错误响应格式：**
```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE",
  "stack": "堆栈信息（仅开发环境）"
}
```

#### 4. 日志中间件 (requestLogger.ts)

**功能：**
- 记录所有HTTP请求
- 记录响应时间
- 记录用户信息
- 记录错误详情

**日志内容：**
- 请求方法和路径
- 请求参数（body, query, params）
- 响应状态码
- 响应时间
- 用户ID和IP地址
- User-Agent

#### 5. 缓存中间件 (cache.ts)

**功能：**
- API响应缓存
- 减少数据库查询
- 提升响应速度

---

## 三、数据库架构

### 数据库统计

- **数据库类型：** PostgreSQL
- **数据表数量：** 107张
- **迁移文件数量：** 46个
- **迁移代码行数：** 5272行

### 核心数据表分类

#### 1. 用户系统 (6张表)
- `users` - 用户基本信息
- `parents` - 家长账号
- `parent_children` - 家长-孩子关联
- `email_verify_codes` - 邮箱验证码
- `sms_verify_codes` - 短信验证码
- `follows` - 用户关注关系

#### 2. 学习系统 (25张表)
- `knowledge_graph` - 知识图谱
- `learning_behavior_analysis` - 学习行为分析
- `question_attempts` - 答题记录
- `learning_stages` - 学习关卡
- `stage_completions` - 关卡完成记录
- `user_learning_progress` - 用户学习进度
- `learning_maps` - 学习地图
- `learning_badges` - 学习勋章
- `user_badges` - 用户勋章
- `learning_plans` - 学习计划
- `plan_tasks` - 计划任务
- `learning_ability_assessment` - 能力评估
- `questions` - 题目库
- `assessments` - 评估记录
- `learning_progress` - 学习进度
- `skill_tree` - 技能树
- `user_skills` - 用户技能
- `learning_analytics` - 学习分析
- `knowledge_weakness` - 知识薄弱点
- `wrong_questions` - 错题本
- `wrong_question_reviews` - 错题复习记录
- `homework_questions` - 作业题目
- `homework_answers` - 作业答案
- `homework_favorites` - 作业收藏
- `bookmarks` - 书签

#### 3. 游戏系统 (10张表)
- `games` - 游戏记录
- `game_questions` - 游戏题目
- `game_records` - 游戏成绩
- `pk_rooms` - PK房间
- `pk_participants` - PK参与者
- `pk_questions` - PK题目
- `pk_answers` - PK答案
- `pk_results` - PK结果
- `user_pk_stats` - PK统计
- `achievements` - 成就系统

#### 4. 社区系统 (12张表)
- `works` - 作品
- `comments` - 评论
- `likes` - 点赞
- `community_posts` - 社区帖子
- `post_comments` - 帖子评论
- `post_likes` - 帖子点赞
- `community_topics` - 社区话题
- `wishes` - 心愿墙
- `wish_supports` - 心愿支持
- `diaries` - 日记
- `notes` - 笔记
- `favorites` - 收藏

#### 5. AI系统 (8张表)
- `ai_conversations` - AI对话
- `conversation_history` - 对话历史
- `ai_generations` - AI生成内容
- `ai_diagnoses` - AI诊断
- `ai_learning_plans` - AI学习计划
- `stories` - 故事
- `story_play_records` - 故事播放记录
- `reading_progress` - 阅读进度

#### 6. 积分系统 (8张表)
- `user_points` - 用户积分
- `points_records` - 积分记录
- `points_levels` - 等级配置
- `rewards` - 奖励
- `user_rewards` - 用户奖励
- `shop_items` - 商城商品
- `shop_exchanges` - 兑换记录
- `shop_categories` - 商品分类

#### 7. 家长端系统 (6张表)
- `usage_records` - 使用记录
- `time_control_settings` - 时间控制设置
- `content_control_settings` - 内容控制设置
- `learning_reports` - 学习报告
- `parent_notifications` - 家长通知
- `parent_reminders` - 家长提醒

#### 8. 其他系统 (32张表)
- `notifications` - 通知
- `moderation_reports` - 举报记录
- `moderation_actions` - 审核操作
- `encyclopedia_entries` - 百科条目
- `encyclopedia_categories` - 百科分类
- `feedback` - 用户反馈
- `checkin_records` - 签到记录
- `ranking_records` - 排行榜记录
- 等等...

### 数据库设计特点

#### 1. 规范化设计
- 遵循第三范式
- 合理使用外键约束
- 避免数据冗余

#### 2. 索引优化
- 主键索引
- 外键索引
- 查询频繁字段索引
- 复合索引

#### 3. 数据完整性
- NOT NULL约束
- UNIQUE约束
- CHECK约束
- 外键约束

#### 4. 时间戳字段
- `created_at` - 创建时间
- `updated_at` - 更新时间
- `deleted_at` - 软删除时间（部分表）

#### 5. JSON字段
- 灵活存储复杂数据
- 如：`knowledge_points`、`question_data`、`settings`

---

## 四、API路由架构

### 路由统计

- **路由文件数量：** 46个
- **API端点数量：** 200+个
- **路由前缀：** `/api`

### 路由分类

#### 1. 认证与用户 (3个路由)
- `/api/auth` - 认证（登录、注册、刷新token）
- `/api/users` - 用户管理
- `/api/parent` - 家长端认证

#### 2. 学习系统 (10个路由)
- `/api/adaptive-learning` - 自适应学习
- `/api/learning-path` - 学习路径
- `/api/learning-plan` - 学习计划
- `/api/assessment` - 评估
- `/api/learning-analytics` - 学习分析
- `/api/skill-tree` - 技能树
- `/api/homework` - 作业辅导
- `/api/wrong-questions` - 错题本
- `/api/tutoring` - 辅导
- `/api/ai-assistant` - AI助手

#### 3. 游戏系统 (4个路由)
- `/api/games` - 游戏
- `/api/game-records` - 游戏记录
- `/api/pk` - PK对战
- `/api/ranking` - 排行榜

#### 4. 社区系统 (7个路由)
- `/api/community` - 社区
- `/api/works` - 作品
- `/api/diary` - 日记
- `/api/wishes` - 心愿墙
- `/api/bookmarks` - 书签
- `/api/notes` - 笔记
- `/api/favorites` - 收藏

#### 5. AI系统 (5个路由)
- `/api/ai` - AI对话
- `/api/generation` - 内容生成
- `/api/stories` - 故事
- `/api/conversation` - 对话历史
- `/api/encyclopedia` - 百科

#### 6. 积分系统 (4个路由)
- `/api/points` - 积分
- `/api/rewards` - 奖励
- `/api/shop` - 商城
- `/api/achievements` - 成就

#### 7. 家长端系统 (3个路由)
- `/api/parent` - 家长功能
- `/api/parental` - 家长控制
- `/api/usage` - 使用统计

#### 8. 其他系统 (10个路由)
- `/api/notifications` - 通知
- `/api/upload` - 文件上传
- `/api/home` - 首页
- `/api/creation` - 创作
- `/api/recommendations` - 推荐
- `/api/moderation` - 审核
- `/api/analytics` - 分析
- `/api/checkin` - 签到
- `/api/feedback` - 反馈
- `/health` - 健康检查

---

## 五、配置管理

### 环境变量配置

#### 服务器配置
```env
PORT=3000
NODE_ENV=development|production
```

#### 数据库配置
```env
DB_HOST=localhost
DB_PORT=5433
DB_NAME=qmzg
DB_USER=admin
DB_PASSWORD=secure_pass
```

#### JWT配置
```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d
```

#### 文件上传配置
```env
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
```

#### CORS配置
```env
CORS_ORIGIN=http://localhost:5173
```

#### AI服务配置
```env
AI_PROVIDER=dify|zhipu
DIFY_API_URL=http://localhost/v1
DIFY_API_KEY=your-api-key
DIFY_CHAT_APP_KEY=...
DIFY_STORY_APP_KEY=...
DIFY_EMOTION_APP_KEY=...
DIFY_TUTORING_APP_KEY=...
ZHIPU_API_KEY=your-zhipu-key
```

#### 邮件配置
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@qmzg.com
```

### 配置验证

**功能：**
- 启动时验证必需配置
- 生产环境强制验证
- 提供配置帮助信息

---

## 六、部署架构

### 开发环境

```
前端: http://localhost:5174 (Vite Dev Server)
后端: http://localhost:3000 (Express Server)
数据库: localhost:5433 (PostgreSQL)
```

### 生产环境建议

```
┌─────────────────────────────────────────┐
│          负载均衡器 (Nginx)              │
│         HTTPS (SSL/TLS)                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      前端静态文件 (CDN/Nginx)            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│    API服务器集群 (PM2/Docker)            │
│    Node.js + Express (多实例)            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│    数据库主从 (PostgreSQL)               │
│    主库(写) + 从库(读)                   │
└─────────────────────────────────────────┘
```

### 推荐部署工具

- **进程管理：** PM2
- **容器化：** Docker + Docker Compose
- **反向代理：** Nginx
- **SSL证书：** Let's Encrypt
- **监控：** Prometheus + Grafana
- **日志：** ELK Stack (Elasticsearch + Logstash + Kibana)

---

## 七、性能优化

### 前端优化

1. **代码分割**
   - React.lazy 路由级懒加载
   - 按功能模块分包

2. **性能优化**
   - React.memo 减少重渲染
   - useCallback 缓存函数
   - useMemo 缓存计算结果

3. **资源优化**
   - 图片懒加载
   - 资源压缩
   - CDN加速

### 后端优化

1. **数据库优化**
   - 连接池管理（最大20连接）
   - 索引优化
   - 查询优化

2. **缓存策略**
   - API响应缓存
   - 数据库查询缓存

3. **限流保护**
   - 全局限流（60次/分钟）
   - 敏感操作限流（5次/15分钟）

4. **日志优化**
   - 日志轮转（按日期）
   - 日志压缩
   - 自动清理（7-30天）

---

## 八、安全措施

### 认证安全
- JWT Token认证
- Token过期机制
- Refresh Token刷新

### 密码安全
- bcrypt加密
- 盐值随机生成
- 不存储明文密码

### API安全
- 限流防护
- CORS跨域控制
- SQL注入防护（参数化查询）
- XSS防护

### 数据安全
- 数据库约束
- 事务管理
- 备份策略

---

## 九、监控与日志

### 日志系统

**日志级别：**
- error - 错误日志
- warn - 警告日志
- info - 信息日志
- http - HTTP请求日志
- debug - 调试日志

**日志文件：**
- `error-YYYY-MM-DD.log` - 错误日志（保留30天）
- `combined-YYYY-MM-DD.log` - 综合日志（保留30天）
- `http-YYYY-MM-DD.log` - HTTP日志（保留7天）
- `exceptions.log` - 未捕获异常
- `rejections.log` - 未处理的Promise拒绝

**日志特性：**
- 按日期自动轮转
- 单文件最大20MB
- 自动压缩归档
- 彩色控制台输出

### 健康检查

**端点：**
- `GET /health`
- `GET /api/health`

**返回：**
```json
{
  "success": true,
  "message": "服务运行正常",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 十、总结

### 项目规模

- **前端：**
  - 100个页面组件
  - 20个通用组件
  - 20个API服务模块

- **后端：**
  - 46个路由文件
  - 200+个API端点
  - 107张数据表
  - 5272行迁移代码

### 技术亮点

1. **完整的学习系统**
   - 知识图谱
   - 自适应推荐
   - AI辅导

2. **游戏化设计**
   - 关卡系统
   - 成就系统
   - PK对战

3. **家长控制**
   - 时间管理
   - 内容控制
   - 学习监控

4. **AI集成**
   - 智能对话
   - 内容生成
   - 学习诊断

5. **完善的架构**
   - 前后端分离
   - 中间件体系
   - 错误处理
   - 日志系统

这是一个功能完整、架构清晰、技术先进的儿童教育平台！
