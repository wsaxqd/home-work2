# 启蒙之光 - 启动和访问指南

## 📍 当前项目状态

**工作目录**: `D:\2025年AI\AI造物计划\项目库\qmzg - V1.0`

**项目版本对比**:
- ✅ `qmzg - V1.0` - **最新版本** (2025-12-31更新)
  - 后端迁移文件: 20个
  - 包含所有三阶段功能
  - 所有bug已修复

- ⚠️ `qmzg` - 旧版本 (2025-12-22)
  - 后端迁移文件: 12个
  - **建议不再使用**

---

## 🚀 启动步骤

### 第一步: 准备数据库

```bash
# 1. 启动PostgreSQL数据库
# 确保PostgreSQL服务正在运行

# 2. 创建数据库（如果还没有创建）
psql -U postgres
CREATE DATABASE qmzg;
CREATE USER admin WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE qmzg TO admin;
\q
```

### 第二步: 配置环境变量

检查 `server\.env` 文件，确保配置正确：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432        # PostgreSQL默认端口
DB_NAME=qmzg
DB_USER=admin
DB_PASSWORD=password # 修改为你的密码

# 服务器配置
PORT=3000

# CORS配置（前端地址）
CORS_ORIGIN=http://localhost:5174

# Dify AI配置（需要配置真实的密钥）
DIFY_API_URL=http://localhost/v1
DIFY_CHAT_APP_KEY=app-your-chat-app-key
DIFY_STORY_APP_KEY=app-your-story-app-key
# ... 其他配置
```

### 第三步: 安装依赖

```bash
cd "D:\2025年AI\AI造物计划\项目库\qmzg - V1.0\server"
npm install
```

### 第四步: 运行数据库迁移

```bash
# 在server目录下
npm run migrate
```

**期望输出**:
```
🚀 Starting migrations...

📋 Already executed: 0 migrations

📦 Pending migrations: 20

⏳ Running: 001_create_users
✓ Created users table
⏳ Running: 002_create_works
...
⏳ Running: 020_add_last_login
✓ Added last_login field to users table

✅ All migrations completed successfully!
```

### 第五步: 启动后端服务器

```bash
# 开发模式（推荐，支持热重载）
npm run dev

# 或生产模式
npm run build
npm start
```

**期望输出**:
```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🌟 启蒙之光 API服务器已启动                            ║
║                                                        ║
║   端口: 3000                                           ║
║   环境: development                                    ║
║   时间: 2025-12-31 ...                                ║
║                                                        ║
║   API文档: http://localhost:3000/health               ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## 🌐 访问地址

### 1. 后端API服务器

**基础地址**: `http://localhost:3000`

**健康检查**:
```
http://localhost:3000/health
```

**主要API端点**:
- `POST http://localhost:3000/api/auth/register` - 用户注册
- `POST http://localhost:3000/api/auth/login` - 用户登录
- `GET http://localhost:3000/api/users/profile` - 获取个人资料
- `POST http://localhost:3000/api/ai/chat` - AI对话
- `GET http://localhost:3000/api/analytics/dashboard/overview` - 数据仪表板

完整API列表见 `IMPLEMENTATION_SUMMARY.md`

---

### 2. 前端页面

⚠️ **重要**: 当前前端是静态HTML文件，需要启动本地服务器才能正常工作。

#### 方法A: 使用Live Server (推荐)

1. **使用VS Code Live Server插件**:
   ```
   1. 在VS Code中打开项目根目录
   2. 右键点击 index.html
   3. 选择 "Open with Live Server"
   4. 浏览器自动打开 http://localhost:5500
   ```

2. **访问页面**:
   - 首页: `http://localhost:5500/index.html`
   - 登录页: `http://localhost:5500/login.html`
   - 探索页: `http://localhost:5500/explore.html`
   - 创作页: `http://localhost:5500/create.html`
   - 社区页: `http://localhost:5500/community.html`

#### 方法B: 使用Python简单服务器

```bash
# 在项目根目录下
cd "D:\2025年AI\AI造物计划\项目库\qmzg - V1.0"

# Python 3
python -m http.server 5174

# 或 Python 2
python -m SimpleHTTPServer 5174
```

然后访问: `http://localhost:5174`

#### 方法C: 使用Node.js http-server

```bash
# 全局安装
npm install -g http-server

# 在项目根目录运行
cd "D:\2025年AI\AI造物计划\项目库\qmzg - V1.0"
http-server -p 5174
```

然后访问: `http://localhost:5174`

---

## 🧪 测试功能

### 1. 测试后端API

```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试用户注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"13800138000\",\"password\":\"Test123456\",\"nickname\":\"测试用户\"}"

# 测试用户登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"13800138000\",\"password\":\"Test123456\"}"
```

### 2. 使用Postman测试

导入以下环境变量:
```json
{
  "baseUrl": "http://localhost:3000",
  "token": "your-jwt-token-here"
}
```

### 3. 浏览器测试

1. **打开登录页**: `http://localhost:5174/login.html`
2. **注册新用户**
3. **登录系统**
4. **浏览各个功能页面**

---

## 📂 项目文件同步状态

### ✅ 最新版本 (qmzg - V1.0)

**已更新的文件**:
- ✅ `IMPLEMENTATION_SUMMARY.md` - 完整实现总结
- ✅ `FEATURE_CHECK_REPORT.md` - 功能检查报告
- ✅ `server/src/migrations/020_add_last_login.ts` - 新增迁移
- ✅ `server/src/migrations/014_create_ai_generations.ts` - 已修复
- ✅ `server/src/services/authService.ts` - 已更新
- ✅ `server/src/services/aiService.ts` - 已修复
- ✅ `server/.env` - 配置完整

**迁移文件清单** (20个):
```
001_create_users.ts
002_create_works.ts
003_create_comments.ts
004_create_likes.ts
005_create_follows.ts
006_create_diaries.ts
007_create_games.ts
008_create_achievements.ts
009_create_wishes.ts
010_create_notifications.ts
011_create_assessments.ts
012_create_learning_progress.ts
013_create_ai_conversations.ts
014_create_ai_generations.ts ✨ (已修复)
015_update_users_table.ts
016_create_game_questions.ts
017_create_advanced_features.ts
018_add_more_game_questions.ts
019_create_moderation_system.ts
020_add_last_login.ts 🆕 (新增)
```

### ⚠️ 旧版本 (qmzg)

**状态**: 不建议使用
**原因**: 缺少最新功能和bug修复

**建议操作**:
```bash
# 备份旧版本（如果需要）
cd "D:\2025年AI\AI造物计划\项目库"
mv qmzg qmzg-backup-20251231

# 或者直接删除（谨慎操作）
# rm -rf qmzg
```

---

## 🔧 常见问题

### Q1: 端口被占用

**错误**: `Error: listen EADDRINUSE :::3000`

**解决**:
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束该进程（Windows）
taskkill /PID <进程ID> /F

# 或修改.env中的PORT
PORT=3001
```

### Q2: 数据库连接失败

**错误**: `Error: connect ECONNREFUSED`

**检查**:
1. PostgreSQL服务是否启动
2. 数据库配置是否正确
3. 用户权限是否足够

### Q3: CORS错误

**错误**: `Access to fetch at ... from origin ... has been blocked by CORS`

**解决**: 确保 `.env` 中的 `CORS_ORIGIN` 与前端地址一致
```env
# 如果使用Live Server (默认5500)
CORS_ORIGIN=http://localhost:5500

# 如果使用http-server (配置为5174)
CORS_ORIGIN=http://localhost:5174
```

### Q4: Dify AI功能无法使用

**原因**: Dify应用密钥未配置

**解决**:
1. 搭建Dify平台
2. 创建7个应用
3. 在 `.env` 中配置对应的APP KEY

---

## 📊 验证清单

- [ ] PostgreSQL数据库已启动
- [ ] 数据库 `qmzg` 已创建
- [ ] 环境变量已正确配置
- [ ] npm依赖已安装
- [ ] 数据库迁移已成功运行（20个）
- [ ] 后端服务器已启动（端口3000）
- [ ] 前端服务器已启动（端口5174或5500）
- [ ] 健康检查API可访问
- [ ] 可以打开登录页面
- [ ] 可以注册新用户
- [ ] 可以登录系统

---

## 🎯 推荐测试流程

1. **启动后端**: `npm run dev` (在server目录)
2. **启动前端**: 使用Live Server打开index.html
3. **打开浏览器**: 访问 `http://localhost:5500/login.html`
4. **注册账号**: 手机号 + 密码（需符合要求）
5. **登录系统**: 使用刚注册的账号
6. **测试功能**:
   - 首页 → 查看推荐内容
   - 探索页 → AI功能
   - 创作页 → 创建作品
   - 社区页 → 浏览作品
   - 游戏页 → 玩游戏
   - 个人页 → 查看资料

---

**最后更新**: 2025-12-31
**文档版本**: 1.0
**项目状态**: ✅ 可以启动和测试
