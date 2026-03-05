# 🔒 安全配置指南

## 📋 目录
- [生产环境密钥配置](#生产环境密钥配置)
- [环境变量安全检查清单](#环境变量安全检查清单)
- [第三方服务配置](#第三方服务配置)
- [密钥管理最佳实践](#密钥管理最佳实践)

---

## 🔐 生产环境密钥配置

### 1. 生成新的密钥

**重要：** 以下密钥已为您生成，请妥善保管并配置到生产环境：

```bash
# JWT 密钥（已生成强随机密钥）
JWT_SECRET=def3eac086fd39b975998e057d9dcc5efba4ef28139de690dd53ff275584c56039a0bffdd6bcfbfb6144c459666ccc097f3061c9603b8223eed06a5fb0c4fb47
JWT_REFRESH_SECRET=730f1ed18ac33e2e9bdee6a67549d5825a0a1f938bac730adde88f667858af0d27393dbed685b44637ea7838d0795a1d1aa244c5934e39bd9fdd0d24c5cff6ce

# 数据库密码（已生成强随机密码）
DB_PASSWORD=jGrzuc+ktFrgPhN5aJTRW7zYctewXbazR9RQ5eHbpgw=
```

### 2. 创建生产环境配置文件

在服务器上创建 `.env.production` 文件（**不要提交到 Git**）：

```bash
# 复制模板
cp .env.production.example .env.production

# 编辑配置
nano .env.production
```

### 3. 必须配置的环境变量

```bash
# ==================== 基础配置 ====================
NODE_ENV=production
PORT=3001

# ==================== 数据库配置 ====================
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=qmzg_production
DB_USER=qmzg_admin
DB_PASSWORD=jGrzuc+ktFrgPhN5aJTRW7zYctewXbazR9RQ5eHbpgw=

# ==================== JWT 配置 ====================
JWT_SECRET=def3eac086fd39b975998e057d9dcc5efba4ef28139de690dd53ff275584c56039a0bffdd6bcfbfb6144c459666ccc097f3061c9603b8223eed06a5fb0c4fb47
JWT_REFRESH_SECRET=730f1ed18ac33e2e9bdee6a67549d5825a0a1f938bac730adde88f667858af0d27393dbed685b44637ea7838d0795a1d1aa244c5934e39bd9fdd0d24c5cff6ce
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ==================== CORS 配置 ====================
CORS_ORIGIN=https://your-production-domain.com

# ==================== 文件上传配置 ====================
UPLOAD_DIR=/var/app/uploads
MAX_FILE_SIZE=20971520

# ==================== Dify AI 配置 ====================
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-YOUR-PRODUCTION-KEY
DIFY_CHAT_APP_KEY=app-YOUR-CHAT-KEY
DIFY_STORY_APP_KEY=app-YOUR-STORY-KEY
DIFY_EMOTION_APP_KEY=app-YOUR-EMOTION-KEY
DIFY_TUTORING_APP_KEY=app-YOUR-TUTORING-KEY
DIFY_TUTORING_EVALUATE_APP_KEY=app-YOUR-EVALUATE-KEY
DIFY_TUTORING_SUMMARY_APP_KEY=app-YOUR-SUMMARY-KEY
DIFY_TIMEOUT=30000

# ==================== 腾讯云配置 ====================
TENCENT_SECRET_ID=YOUR-SECRET-ID
TENCENT_SECRET_KEY=YOUR-SECRET-KEY
TENCENT_OCR_REGION=ap-guangzhou

# ==================== 邮件服务配置 ====================
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_USER=noreply@your-domain.com
EMAIL_PASSWORD=YOUR-EMAIL-PASSWORD
EMAIL_FROM=启蒙之光 <noreply@your-domain.com>

# ==================== Redis 配置（可选） ====================
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=YOUR-REDIS-PASSWORD

# ==================== 日志配置 ====================
LOG_LEVEL=info
```

---

## ✅ 环境变量安全检查清单

### 部署前检查

- [ ] **JWT 密钥已更换**：不使用示例密钥
- [ ] **数据库密码已设置**：使用强密码（至少32位随机字符）
- [ ] **所有第三方 API 密钥已配置**：Dify、腾讯云等
- [ ] **CORS 配置正确**：仅允许生产域名
- [ ] **NODE_ENV=production**：确保生产模式
- [ ] **.env 文件未提交到 Git**：检查 `.gitignore`
- [ ] **文件权限正确**：`.env` 文件权限设为 600

### 验证命令

```bash
# 检查 .env 文件权限
ls -la .env*

# 验证 .env 未被 Git 跟踪
git status

# 检查 .gitignore 配置
cat .gitignore | grep .env
```

---

## 🔑 第三方服务配置

### 1. Dify AI 服务

1. 访问 [Dify Cloud](https://cloud.dify.ai)
2. 创建以下应用并获取 API Key：
   - 聊天助手应用
   - 故事生成应用
   - 情绪分析应用
   - 辅导应用
   - 评估应用
   - 总结应用
3. 将 API Key 配置到 `.env.production`

### 2. 腾讯云服务

1. 访问 [腾讯云控制台](https://console.cloud.tencent.com)
2. 创建 API 密钥（SecretId 和 SecretKey）
3. 开通以下服务：
   - OCR 文字识别
   - 图像识别
4. 配置到 `.env.production`

### 3. 邮件服务

1. 配置 SMTP 服务器信息
2. 测试邮件发送功能

---

## 🛡️ 密钥管理最佳实践

### 1. 密钥存储

**推荐方案：**

#### 方案 A：环境变量（适合小型部署）
```bash
# 在服务器上设置环境变量
export JWT_SECRET="your-secret-key"
export DB_PASSWORD="your-db-password"
```

#### 方案 B：密钥管理服务（推荐生产环境）
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- 阿里云密钥管理服务

#### 方案 C：Docker Secrets（Docker Swarm）
```bash
# 创建 secret
echo "your-secret-key" | docker secret create jwt_secret -

# 在 docker-compose.yml 中使用
secrets:
  - jwt_secret
```

### 2. 密钥轮换

**建议轮换周期：**
- JWT 密钥：每 90 天
- 数据库密码：每 180 天
- API 密钥：根据服务商建议

**轮换步骤：**
1. 生成新密钥
2. 配置新密钥（保留旧密钥）
3. 重启服务
4. 验证功能正常
5. 移除旧密钥

### 3. 密钥泄露应急响应

**如果密钥泄露：**

1. **立即行动**
   - 撤销泄露的密钥
   - 生成新密钥
   - 更新所有服务配置

2. **评估影响**
   - 检查访问日志
   - 识别异常活动
   - 通知受影响用户

3. **预防措施**
   - 启用 Git 密钥扫描
   - 配置 pre-commit hooks
   - 定期安全审计

### 4. Git 密钥扫描

安装 git-secrets 防止密钥提交：

```bash
# 安装 git-secrets
brew install git-secrets  # macOS
# 或
apt-get install git-secrets  # Linux

# 配置扫描规则
git secrets --install
git secrets --register-aws
git secrets --add 'JWT_SECRET.*'
git secrets --add 'DB_PASSWORD.*'
git secrets --add 'API_KEY.*'

# 扫描历史提交
git secrets --scan-history
```

---

## 📝 生产环境部署检查

### 部署前

- [ ] 所有密钥已生成并妥善保管
- [ ] `.env.production` 文件已创建
- [ ] 第三方服务已配置并测试
- [ ] 数据库连接已验证
- [ ] CORS 配置已更新

### 部署后

- [ ] 应用启动成功
- [ ] 数据库连接正常
- [ ] JWT 认证功能正常
- [ ] 文件上传功能正常
- [ ] AI 服务调用正常
- [ ] 邮件发送功能正常

---

## 🚨 安全警告

**绝对不要：**
- ❌ 将 `.env` 文件提交到 Git
- ❌ 在代码中硬编码密钥
- ❌ 在日志中输出密钥
- ❌ 通过不安全渠道传输密钥（如邮件、聊天工具）
- ❌ 使用弱密码或示例密钥

**必须做到：**
- ✅ 使用强随机密钥
- ✅ 定期轮换密钥
- ✅ 限制密钥访问权限
- ✅ 监控异常访问
- ✅ 备份密钥（加密存储）

---

## 📞 支持

如有安全问题，请联系：
- 技术支持：tech@your-domain.com
- 安全团队：security@your-domain.com

**最后更新：** 2026-02-13
