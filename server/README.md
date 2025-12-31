# 启蒙之光 - 儿童AI教育应用 (后端)

## 🌟 项目简介

启蒙之光是一个专为6-12岁儿童设计的AI教育应用，通过游戏化学习、AI辅助创作等方式，帮助儿童快乐地学习AI知识和培养创造力。

**本仓库为后端API服务**

---

## ✨ 核心功能

### 🎯 已实现的功能（MVP V1.0）

- ✅ **用户系统** - 注册、登录、资料管理、关注系统
- ✅ **AI对话** - 与AI助手"小光"聊天
- ✅ **AI创作** - 故事生成、情感分析
- ✅ **作品系统** - 创作、发布、浏览作品
- ✅ **社交互动** - 点赞、评论、心愿墙
- ✅ **游戏系统** - 图像识别、情绪识别游戏（含题库）
- ✅ **学习追踪** - 进度记录、成就系统
- ✅ **评估系统** - 能力评估、学习报告

### 📊 技术栈

- **语言**: TypeScript
- **框架**: Express.js
- **数据库**: PostgreSQL
- **认证**: JWT
- **AI集成**: Dify平台
- **文件上传**: Multer

---

## 🚀 快速开始

### 1. 环境要求

- Node.js 16+
- PostgreSQL 12+
- npm 或 yarn

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，并填写配置：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qmzg
DB_USER=admin
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS配置
CORS_ORIGIN=http://localhost:5174

# Dify AI配置（需要配置）
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-your-api-key
DIFY_CHAT_APP_KEY=app-your-chat-app-key
DIFY_STORY_APP_KEY=app-your-story-app-key
DIFY_EMOTION_APP_KEY=app-your-emotion-app-key
DIFY_TIMEOUT=30000
```

### 4. 创建数据库

```bash
createdb qmzg
```

### 5. 运行数据库迁移

```bash
npm run migrate
```

### 6. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

---

## 📝 API文档

### 完整API列表（64个接口）

查看详细文档：[MVP_COMPLETE_SUMMARY.md](./MVP_COMPLETE_SUMMARY.md)

### 快速测试

#### 方式1：使用测试脚本

```bash
# Linux/Mac
chmod +x test-api.sh
./test-api.sh

# Windows
test-api.bat
```

#### 方式2：手动测试

```bash
# 1. 健康检查
curl http://localhost:3000/health

# 2. 注册用户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "Test1234",
    "nickname": "测试用户",
    "age": 10
  }'

# 3. 登录获取token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "Test1234"
  }'

# 4. 使用token访问API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users/profile
```

---

## 🔧 Dify配置

AI功能需要配置Dify平台。详细步骤：

1. 访问 [Dify Cloud](https://cloud.dify.ai) 或自建Dify
2. 创建3个应用（详见 [DIFY_SETUP.md](./DIFY_SETUP.md)）：
   - AI聊天助手（Chat App）
   - 故事生成器（Completion App）
   - 情感分析（Completion App）
3. 获取API密钥并配置到 `.env`
4. 测试AI功能：`curl http://localhost:3000/api/ai/health`

**快速开始**: [AI_QUICK_START.md](./AI_QUICK_START.md)

---

## 📂 项目结构

```
server/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器层
│   ├── middlewares/     # 中间件
│   ├── migrations/      # 数据库迁移（16个）
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑层
│   └── utils/           # 工具函数
├── uploads/             # 文件上传目录
├── .env                 # 环境变量
├── package.json         # 依赖管理
├── tsconfig.json        # TypeScript配置
├── test-api.sh          # API测试脚本（Linux/Mac）
├── test-api.bat         # API测试脚本（Windows）
└── docs/                # 文档目录
    ├── MVP_COMPLETE_SUMMARY.md      # MVP完整总结
    ├── AI_INTEGRATION_SUMMARY.md    # AI集成总结
    ├── AI_QUICK_START.md            # AI快速开始
    └── DIFY_SETUP.md                # Dify配置指南
```

---

## 🗄️ 数据库架构

16张表，包括：
- **核心表**: users, works, comments, likes, follows
- **AI表**: ai_conversations, ai_generations
- **游戏表**: game_questions, game_progress, user_achievements
- **学习表**: learning_progress, assessments
- **其他**: diaries, wishes, notifications

查看详细架构：[MVP_COMPLETE_SUMMARY.md#数据库架构](./MVP_COMPLETE_SUMMARY.md#数据库架构)

---

## 📚 主要模块

### 1. 认证模块（Auth）
- 用户注册/登录
- JWT Token管理
- 密码加密

### 2. AI模块
- Dify平台集成
- AI对话（小光助手）
- 故事生成
- 情感分析
- 对话上下文管理

### 3. 作品模块（Works）
- 创作作品（故事/绘画/音乐/诗歌）
- 发布/取消发布
- 作品画廊
- 热门推荐

### 4. 社交模块（Community）
- 点赞/评论
- 关注/粉丝
- 心愿墙

### 5. 游戏模块（Games）
- 题库管理（13道示例题）
- 图像识别游戏
- 情绪识别游戏
- 排行榜系统

### 6. 学习模块
- 学习进度追踪
- 成就系统
- 能力评估

---

## 🧪 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行数据库迁移
npm run migrate

# 回滚最后一次迁移
npm run migrate:rollback

# 运行测试（待添加）
npm test
```

---

## 🔍 API响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

### 分页响应

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 🛡️ 安全特性

- ✅ JWT身份验证
- ✅ 密码bcrypt加密
- ✅ CORS跨域配置
- ✅ SQL注入防护（参数化查询）
- ✅ 文件上传验证
- ✅ 错误信息安全处理

---

## 📈 性能优化

- ✅ 数据库索引优化
- ✅ 分页查询
- ✅ 连接池管理
- ⏳ Redis缓存（待添加）
- ⏳ CDN静态资源（待添加）

---

## 🐛 常见问题

### Q1: 数据库连接失败
**A**: 检查PostgreSQL是否运行，`.env`配置是否正确

### Q2: AI功能不可用
**A**: 检查Dify配置，查看 [AI_QUICK_START.md](./AI_QUICK_START.md)

### Q3: Token验证失败
**A**: 确保Token未过期，检查JWT_SECRET配置

### Q4: 文件上传失败
**A**: 检查uploads目录权限，文件大小是否超限

---

## 📖 相关文档

- [MVP完整总结](./MVP_COMPLETE_SUMMARY.md) - 64个API详细说明
- [AI集成总结](./AI_INTEGRATION_SUMMARY.md) - Dify集成技术细节
- [AI快速开始](./AI_QUICK_START.md) - 5分钟配置AI功能
- [Dify配置指南](./DIFY_SETUP.md) - 应用创建和提示词模板

---

## 🎯 下一步计划

### 短期（1-2周）
- [ ] 前后端联调
- [ ] 单元测试
- [ ] API文档（Swagger）
- [ ] 性能优化

### 中期（3-4周）
- [ ] Redis缓存
- [ ] 日志系统
- [ ] 监控告警
- [ ] 内容审核

### 长期（1-2月）
- [ ] 微服务拆分
- [ ] 容器化部署
- [ ] CI/CD流程
- [ ] 负载均衡

---

## 👥 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 📄 许可证

MIT License

---

## 📞 联系方式

- 项目主页: [GitHub](#)
- 问题反馈: [Issues](#)
- 邮箱: [your-email@example.com]

---

## 🙏 致谢

- [Dify](https://dify.ai) - AI应用平台
- [Express.js](https://expressjs.com) - Web框架
- [PostgreSQL](https://www.postgresql.org) - 数据库
- [TypeScript](https://www.typescriptlang.org) - 类型安全

---

**当前版本**: V1.0 MVP
**最后更新**: 2025-12-30
**开发状态**: ✅ MVP已完成，待前端集成

---

## 🎉 开始使用

```bash
# 克隆仓库
git clone <repository-url>

# 进入项目目录
cd qmzg/server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 运行迁移
npm run migrate

# 启动开发服务器
npm run dev

# 测试API
./test-api.sh
```

**祝您开发愉快！** 🚀
