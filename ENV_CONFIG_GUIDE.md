# 🔧 环境变量配置指南

> **启蒙之光** 项目环境配置完整指南

---

## 📋 目录

- [快速开始](#快速开始)
- [必需配置](#必需配置)
- [可选配置](#可选配置)
- [配置验证](#配置验证)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 1. 复制环境变量模板

```bash
cd server
cp .env.template .env
```

### 2. 生成 JWT 密钥

```bash
# 生成 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成 JWT_REFRESH_SECRET (再执行一次,生成不同的密钥)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 编辑 .env 文件

使用文本编辑器打开 `server/.env`，填写必需的配置项。

### 4. 启动服务验证

```bash
npm run dev
```

启动时会自动检查配置,如有错误会显示提示。

---

## ✅ 必需配置

这些配置项是**必须设置**的,否则服务无法正常运行。

### 1. 数据库配置 (PostgreSQL)

```env
DB_HOST=localhost          # 数据库主机地址
DB_PORT=5432              # 数据库端口
DB_NAME=qmzg_db           # 数据库名称
DB_USER=postgres          # 数据库用户名
DB_PASSWORD=your_password # 数据库密码 (至少8位)
```

**获取方式:**
1. 本地安装 PostgreSQL: [下载链接](https://www.postgresql.org/download/)
2. 使用 Docker:
   ```bash
   docker run -d \
     --name qmzg-postgres \
     -e POSTGRES_DB=qmzg_db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=your_password \
     -p 5432:5432 \
     postgres:14
   ```

### 2. JWT 配置 (用户认证)

```env
# JWT 主密钥 (至少32个字符)
JWT_SECRET=your_generated_secret_here_xxxxxxxxxxxxxxxxxxxxxxx

# JWT 刷新密钥 (至少32个字符,必须与 JWT_SECRET 不同)
JWT_REFRESH_SECRET=your_refresh_secret_here_yyyyyyyyyyyyyyyyyy

# Token 过期时间
JWT_EXPIRES_IN=7d              # 7天
JWT_REFRESH_EXPIRES_IN=30d     # 30天
```

**安全要求:**
- ✅ 长度至少 32 个字符
- ✅ 使用随机生成的字符串
- ✅ JWT_SECRET 和 JWT_REFRESH_SECRET 必须不同
- ❌ 不要使用默认值或简单密码

---

## ⚙️ 可选配置

### 1. AI 服务配置

**方案一: 使用 Dify AI (推荐)**

```env
AI_PROVIDER=dify
DIFY_API_URL=https://api.dify.ai/v1
DIFY_CHAT_APP_KEY=app-xxxxxxxxxxxxxx
DIFY_STORY_APP_KEY=app-yyyyyyyyyyyyyy
DIFY_EMOTION_APP_KEY=app-zzzzzzzzzzzzzz
```

**获取 Dify API Key:**
1. 访问 [Dify 官网](https://dify.ai)
2. 注册账号并登录
3. 创建应用(聊天、故事生成、情感分析)
4. 复制每个应用的 API Key

详细配置: [DIFY_CONFIG_GUIDE.md](./DIFY_CONFIG_GUIDE.md)

**方案二: 使用智谱 AI**

```env
AI_PROVIDER=zhipu
ZHIPU_API_KEY=your-zhipu-api-key
```

**获取智谱 API Key:**
1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册账号并实名认证
3. 创建 API Key

详细配置: [ZHIPU_CONFIG_GUIDE.md](./ZHIPU_CONFIG_GUIDE.md)

### 2. 邮件服务配置

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@qmzg.com
```

**支持的邮箱服务商:**
- Gmail: `smtp.gmail.com:587`
- QQ邮箱: `smtp.qq.com:587`
- 163邮箱: `smtp.163.com:465`
- Outlook: `smtp.office365.com:587`

详细配置: [EMAIL_CONFIG_GUIDE.md](./EMAIL_CONFIG_GUIDE.md)

**如不配置:** 邮箱验证码功能将使用模拟模式(仅在开发环境)

### 3. CORS 配置

```env
CORS_ORIGIN=http://localhost:5174
```

**多域名支持:**
```env
CORS_ORIGIN=http://localhost:5174,https://your-domain.com
```

### 4. 文件上传配置

```env
UPLOAD_DIR=./uploads      # 上传目录
MAX_FILE_SIZE=10          # 最大文件大小 (MB)
```

---

## 🔍 配置验证

### 启动时自动验证

服务启动时会自动检查配置:

```
🔍 正在验证环境配置...

✅ Dify AI 配置已检测
✅ 邮件服务配置已检测
✅ 必需配置项验证通过

⚠️  配置警告:
   ⚠️  数据库密码太短，建议至少8个字符

──────────────────────────────────────────────────
```

### 验证等级

#### ✅ 通过
- 所有必需配置已设置
- 服务正常启动

#### ⚠️ 警告
- 配置存在但不够安全
- 可选配置未设置
- 开发环境可继续运行

#### ❌ 错误
- 缺少必需配置
- 配置格式错误
- **生产环境将拒绝启动**

---

## 📊 配置检查清单

使用此清单确保所有配置正确:

### 必需项

- [ ] `DB_HOST` - 数据库主机
- [ ] `DB_NAME` - 数据库名称
- [ ] `DB_USER` - 数据库用户
- [ ] `DB_PASSWORD` - 数据库密码 (≥8位)
- [ ] `JWT_SECRET` - JWT密钥 (≥32位)
- [ ] `JWT_REFRESH_SECRET` - 刷新密钥 (≥32位,与JWT_SECRET不同)

### 推荐项

- [ ] AI 服务 (Dify 或 智谱,至少一个)
  - [ ] `DIFY_CHAT_APP_KEY` 或
  - [ ] `ZHIPU_API_KEY`
- [ ] 邮件服务 (可选,但推荐)
  - [ ] `SMTP_USER`
  - [ ] `SMTP_PASSWORD`
  - [ ] `EMAIL_FROM`

### 安全检查

- [ ] JWT 密钥是随机生成的
- [ ] 数据库密码够强(包含字母数字符号)
- [ ] 不使用默认密码
- [ ] 生产环境已修改所有密钥

---

## ❓ 常见问题

### Q1: 服务启动失败,提示缺少环境变量?

**A:** 检查是否正确创建了 `.env` 文件:
```bash
cd server
ls -la .env  # 确认文件存在
cat .env     # 检查内容
```

### Q2: JWT_SECRET 错误: 长度不足32个字符?

**A:** 重新生成密钥:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
将输出的64位十六进制字符串填入 `.env`

### Q3: 数据库连接失败?

**A:** 检查:
1. PostgreSQL 服务是否运行
2. 数据库是否已创建: `CREATE DATABASE qmzg_db;`
3. 用户名密码是否正确
4. 端口是否正确(默认5432)

### Q4: AI 功能不可用?

**A:** 确保:
1. 已配置 `AI_PROVIDER` (dify 或 zhipu)
2. 相应的 API Key 已正确填写
3. API Key 有效且有额度

### Q5: 邮件发送失败?

**A:** 检查:
1. SMTP 配置是否正确
2. Gmail 需要使用[应用专用密码](https://support.google.com/accounts/answer/185833)
3. QQ/163 需要使用授权码
4. 防火墙是否阻止了 SMTP 端口

### Q6: 开发环境和生产环境配置有什么区别?

**A:**

| 环境 | 验证等级 | 错误处理 | AI服务 |
|------|---------|---------|--------|
| 开发 | 宽松 | 使用默认值继续运行 | 可使用模拟数据 |
| 生产 | 严格 | 配置错误拒绝启动 | 必须配置真实服务 |

---

## 📚 相关文档

- [快速开始指南](./QUICK_START.md)
- [Dify AI 配置](./DIFY_CONFIG_GUIDE.md)
- [智谱 AI 配置](./ZHIPU_CONFIG_GUIDE.md)
- [邮件服务配置](./EMAIL_CONFIG_GUIDE.md)

---

## 🆘 需要帮助?

如果配置过程中遇到问题:

1. 查看启动日志中的详细错误信息
2. 参考上述相关文档
3. 检查 `.env.template` 中的注释说明
4. 提交 Issue 到项目仓库

---

**配置完成后,您就可以开始使用启蒙之光项目了!** 🎉
