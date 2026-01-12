# 启蒙之光 - 儿童AI教育应用

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org/)

一个专为6-12岁儿童设计的AI教育平台，通过游戏化学习和AI技术，帮助孩子们探索人工智能的奥秘。

## 🌟 项目简介

启蒙之光（Qimeng Zhiguang）是一个创新的儿童AI教育应用，旨在通过趣味性、互动性的方式，让孩子们了解和学习人工智能技术。

### 核心特色

- 🎮 **游戏化学习** - 通过AI游戏实验室，让孩子在玩中学
- 🎨 **创意创作** - AI辅助的故事、诗歌、绘画、音乐创作工具
- 🤖 **AI对话** - 与AI助手"启启"互动，解答AI相关问题
- 💝 **情感陪伴** - 心灵花园和愿望花园，关注孩子心理健康
- 👨‍👩‍👧 **家长监护** - 完善的家长监护系统，确保使用安全

## 📁 项目结构

```
qmzg-v1.0/
├── server/                 # 后端服务
│   ├── src/
│   │   ├── routes/        # API路由 (18个模块)
│   │   ├── services/      # 业务逻辑 (20个服务)
│   │   ├── migrations/    # 数据库迁移 (20个)
│   │   ├── middlewares/   # 中间件
│   │   └── index.ts       # 入口文件
│   └── package.json
├── *.html                 # 前端页面 (17个)
├── navigation-template.js # 导航模板
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm >= 9.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/wsaxqd/home-work2.git
cd home-work2
```

2. **安装后端依赖**
```bash
cd server
npm install
```

3. **配置环境变量**

创建 `server/.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qmzg
DB_USER=admin
DB_PASSWORD=your-password

# JWT配置
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Dify AI配置
DIFY_API_URL=http://localhost/v1
DIFY_CHAT_APP_KEY=app-xxx
DIFY_STORY_APP_KEY=app-xxx
DIFY_EMOTION_APP_KEY=app-xxx
DIFY_TUTORING_APP_KEY=app-xxx
DIFY_TUTORING_EVALUATE_APP_KEY=app-xxx
DIFY_TUTORING_SUMMARY_APP_KEY=app-xxx

# 服务器配置
PORT=3000
CORS_ORIGIN=http://localhost:5174
```

4. **初始化数据库**

创建数据库：
```bash
psql -U postgres
CREATE DATABASE qmzg;
CREATE USER admin WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE qmzg TO admin;
\q
```

运行迁移：
```bash
cd server
npm run migrate
```

5. **启动服务**

后端：
```bash
cd server
npm run dev
```

前端（使用Live Server或http-server）：
```bash
# 方式1: VS Code Live Server
# 右键 index.html -> Open with Live Server

# 方式2: http-server
npm install -g http-server
http-server -p 5174
```

6. **访问应用**
```
http://localhost:5174
```

## 📚 功能模块

### 第一阶段 - MVP核心功能 ✅

| 模块 | 功能 | 状态 |
|------|------|------|
| 用户系统 | 注册、登录、资料管理 | ✅ |
| AI服务 | 对话、故事生成、情感分析 | ✅ |
| 创作工具 | 故事、诗歌、音乐、绘画 | ✅ |
| 社区功能 | 作品、点赞、评论、关注 | ✅ |
| 游戏系统 | 图像识别、情绪识别 | ✅ |
| 评估系统 | AI能力评估 | ✅ |

### 第二阶段 - 功能增强 ✅

| 模块 | 功能 | 状态 |
|------|------|------|
| 创作模板 | 模板管理系统 | ✅ |
| 话题挑战 | 话题挑战系统 | ✅ |
| 家长监护 | 使用时长、内容审核 | ✅ |
| 游戏题库 | 30+题目 | ✅ |

### 第三阶段 - AI深化 ✅

| 模块 | 功能 | 状态 |
|------|------|------|
| 智能推荐 | 个性化内容推荐 | ✅ |
| AI辅导 | 5科目智能辅导 | ✅ |
| 内容生成 | 6种AI生成类型 | ✅ |
| 安全审核 | 3层内容审核 | ✅ |
| 数据分析 | 5类数据分析 | ✅ |

## 🎮 游戏模块

- **图像识别游戏** - 使用AI识别物体、动物、水果等
- **情绪识别游戏** - 识别不同的表情和情绪
- **AI知识问答** - 测试AI知识，支持多难度

## 🎨 创作工具

- **故事创作** - AI辅助故事生成
- **诗歌创作** - 儿歌和诗歌创作
- **音乐创作** - 简单作曲工具
- **绘画创作** - 画板工具，支持保存

## 📖 API文档

### 认证相关

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/refresh` | POST | 刷新Token |

### AI功能

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ai/chat` | POST | AI对话 |
| `/api/ai/story` | POST | 生成故事 |
| `/api/ai/emotion` | POST | 情感分析 |

### 游戏功能

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/games/questions` | GET | 获取游戏题目 |
| `/api/games/verify-answer` | POST | 验证答案 |
| `/api/games/score` | POST | 保存成绩 |
| `/api/games/leaderboard` | GET | 排行榜 |

### 作品管理

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/works` | GET | 获取作品列表 |
| `/api/works` | POST | 创建作品 |
| `/api/works/:id` | GET | 获取作品详情 |
| `/api/works/:id` | PUT | 更新作品 |
| `/api/works/:id` | DELETE | 删除作品 |
| `/api/works/:id/publish` | POST | 发布作品 |

完整API文档请查看项目文档。

## 🗄️ 数据库

### 表结构（25张表）

- **用户系统**: users, follows
- **作品系统**: works, likes, comments
- **AI功能**: ai_conversations, ai_generations
- **游戏系统**: games, game_questions, achievements
- **学习系统**: assessments, learning_progress
- **社交系统**: notifications
- **高级功能**: creation_templates, topic_challenges, parental_controls, content_recommendations, tutoring_sessions, content_moderation

## 🔧 技术栈

### 后端
- **框架**: Express.js + TypeScript
- **数据库**: PostgreSQL
- **认证**: JWT (access + refresh token)
- **AI服务**: Dify平台集成
- **迁移**: 自定义迁移系统

### 前端
- **框架**: HTML5 + CSS3 + JavaScript
- **UI**: 响应式设计，移动端优化
- **通信**: Fetch API

## 📊 开发进度

- [x] 第一阶段 - MVP核心功能 (100%)
- [x] 第二阶段 - 功能增强 (100%)
- [x] 第三阶段 - AI深化 (100%)
- [x] Bug修复 (2个)
- [x] 文档完善 (7份)
- [x] GitHub上传

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 LICENSE 文件

## 👥 团队

- **项目负责人**: wsaxqd
- **AI开发助手**: Claude Code

## 📞 联系方式

- GitHub: [@wsaxqd](https://github.com/wsaxqd)
- 项目地址: [https://github.com/wsaxqd/home-work2](https://github.com/wsaxqd/home-work2)

## 🙏 致谢

感谢所有为这个项目做出贡献的人！

特别感谢：
- Anthropic Claude - AI开发助手
- Dify平台 - AI服务支持
- PostgreSQL - 数据库支持

---

**⭐ 如果这个项目对你有帮助，请给我们一个星标！**

**🎓 让我们一起点亮孩子们的AI启蒙之光！**
