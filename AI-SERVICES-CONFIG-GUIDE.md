# 🤖 AI 服务配置指南

启蒙之光 (QMZG) - AI 服务 API Key 申请与配置

---

## 📋 概述

你的项目使用了以下 AI 服务，需要申请相应的 API Key：

1. **Dify AI** - AI 对话和智能助手
2. **DeepSeek AI** - 深度学习模型
3. **智谱 AI (GLM)** - 通用语言模型
4. **腾讯云 OCR** - 图像文字识别
5. **SMTP 邮件服务** - 邮件发送

---

## 🚀 服务 1：Dify AI

### 功能说明
- AI 聊天对话
- 故事生成
- 情感分析
- 学习辅导

### 申请步骤

1. **注册账号**
   - 访问：https://dify.ai
   - 点击「注册」
   - 使用邮箱注册

2. **创建应用**
   - 登录后进入控制台
   - 点击「创建应用」
   - 选择应用类型（聊天助手/Agent）

3. **获取 API Key**
   - 进入应用设置
   - 找到「API Key」或「访问凭证」
   - 复制 API Key

4. **获取 APP Key**
   - 每个应用有独立的 APP Key
   - 在应用详情页面获取
   - 需要为每个功能创建单独的应用：
     - 聊天对话 → DIFY_CHAT_APP_KEY
     - 故事生成 → DIFY_STORY_APP_KEY
     - 情感分析 → DIFY_EMOTION_APP_KEY
     - 学习辅导 → DIFY_TUTORING_APP_KEY

### 配置到项目

编辑 `.env.production`：

```env
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-你的API密钥
DIFY_CHAT_APP_KEY=你的聊天应用KEY
DIFY_STORY_APP_KEY=你的故事应用KEY
DIFY_EMOTION_APP_KEY=你的情感应用KEY
DIFY_TUTORING_APP_KEY=你的辅导应用KEY
DIFY_TIMEOUT=30000
```

### 费用
- 免费额度：通常有试用额度
- 付费：按 Token 计费
- 预估：小型项目月费 ¥50-200

---

## 🧠 服务 2：DeepSeek AI

### 功能说明
- 深度学习推理
- 高级 AI 对话
- 代码生成

### 申请步骤

1. **注册账号**
   - 访问：https://platform.deepseek.com
   - 注册账号

2. **获取 API Key**
   - 登录控制台
   - 进入「API Keys」
   - 创建新的 API Key
   - 复制并保存

### 配置到项目

```env
DEEPSEEK_API_KEY=sk-你的API密钥
DEEPSEEK_API_URL=https://api.deepseek.com
```

### 费用
- 免费额度：新用户有免费额度
- 付费：按使用量计费
- 预估：月费 ¥100-300

---

## 🌟 服务 3：智谱 AI (GLM)

### 功能说明
- 通用语言模型
- 中文理解优秀
- 多轮对话

### 申请步骤

1. **注册账号**
   - 访问：https://open.bigmodel.cn
   - 注册并实名认证

2. **创建应用**
   - 进入控制台
   - 创建新应用
   - 选择模型（如 GLM-4）

3. **获取 API Key**
   - 在应用详情页获取 API Key
   - 复制保存

### 配置到项目

```env
ZHIPU_API_KEY=你的API密钥.你的SECRET
ZHIPU_API_URL=https://open.bigmodel.cn/api/paas/v4
```

### 费用
- 免费额度：新用户有 1000万 Token
- 付费：按 Token 计费
- 预估：月费 ¥50-200

---

## 👁️ 服务 4：腾讯云 OCR

### 功能说明
- 作业拍照识别
- 手写文字识别
- 印刷文字识别

### 申请步骤

1. **注册腾讯云**
   - 访问：https://cloud.tencent.com
   - 注册并完成实名认证

2. **开通 OCR 服务**
   - 进入「产品」→「人工智能」→「文字识别 OCR」
   - 点击「立即使用」
   - 开通服务（有免费额度）

3. **创建密钥**
   - 进入「访问管理」→「API密钥管理」
   - 点击「新建密钥」
   - 获取 SecretId 和 SecretKey

### 配置到项目

```env
TENCENT_SECRET_ID=你的SecretId
TENCENT_SECRET_KEY=你的SecretKey
TENCENT_OCR_REGION=ap-guangzhou
```

### 费用
- 免费额度：每月 1000 次
- 超出后：¥0.1-0.15 /次
- 预估：小型项目可能免费

---

## 📧 服务 5：SMTP 邮件服务

### 功能说明
- 用户注册验证
- 密码重置
- 通知邮件

### 方案 A：QQ 邮箱（推荐个人项目）

1. **开启 SMTP 服务**
   - 登录 QQ 邮箱
   - 设置 → 账户 → POP3/IMAP/SMTP
   - 开启「POP3/SMTP服务」
   - 生成授权码（16位）

2. **配置到项目**

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=你的QQ邮箱@qq.com
SMTP_PASSWORD=16位授权码
SMTP_FROM=启蒙之光 <你的QQ邮箱@qq.com>
```

### 方案 B：163 邮箱

```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=你的163邮箱@163.com
SMTP_PASSWORD=授权码
SMTP_FROM=启蒙之光 <你的163邮箱@163.com>
```

### 方案 C：企业邮箱（推荐生产环境）

**腾讯企业邮：**
```env
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@qmzgai.com
SMTP_PASSWORD=邮箱密码
SMTP_FROM=启蒙之光 <noreply@qmzgai.com>
```

### 费用
- QQ/163 邮箱：免费
- 企业邮箱：¥50-200/年/账号

---

## 📝 完整配置示例

编辑 `.env.production` 文件：

```env
# === AI 服务配置 ===

# Dify AI
DIFY_API_KEY=app-xxxxxxxxxxxxxx
DIFY_API_URL=https://api.dify.ai/v1
DIFY_CHAT_APP_KEY=xxxxxxxxxxxxxx
DIFY_STORY_APP_KEY=xxxxxxxxxxxxxx
DIFY_EMOTION_APP_KEY=xxxxxxxxxxxxxx
DIFY_TUTORING_APP_KEY=xxxxxxxxxxxxxx
DIFY_TIMEOUT=30000

# DeepSeek AI
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxx
DEEPSEEK_API_URL=https://api.deepseek.com

# 智谱 AI
ZHIPU_API_KEY=xxxxxxxxxxxxxx.xxxxxxxxxxxxxx
ZHIPU_API_URL=https://open.bigmodel.cn/api/paas/v4

# === 腾讯云服务配置 ===
TENCENT_SECRET_ID=AKIDxxxxxxxxxxxxxx
TENCENT_SECRET_KEY=xxxxxxxxxxxxxx
TENCENT_OCR_REGION=ap-guangzhou

# === 邮件服务配置 ===
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@qq.com
SMTP_PASSWORD=your-16-digit-code
SMTP_FROM=启蒙之光 <your-email@qq.com>
```

---

## ✅ 配置验证

### 1. 测试 AI 服务

```bash
# 进入后端容器
docker exec -it qmzg-server sh

# 测试 Dify
curl -X POST https://api.dify.ai/v1/chat-messages \
  -H "Authorization: Bearer ${DIFY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query": "你好"}'

# 测试 DeepSeek
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer ${DEEPSEEK_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek-chat", "messages": [{"role": "user", "content": "你好"}]}'
```

### 2. 测试邮件发送

如果项目有测试脚本：

```bash
# 在项目目录
docker exec -it qmzg-server npm run test:email
```

或手动测试：

```javascript
// test-email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@qq.com',
    pass: 'your-16-digit-code'
  }
});

transporter.sendMail({
  from: '"启蒙之光" <your-email@qq.com>',
  to: 'test@example.com',
  subject: '测试邮件',
  text: '这是一封测试邮件'
}).then(info => {
  console.log('邮件发送成功:', info.messageId);
}).catch(error => {
  console.error('邮件发送失败:', error);
});
```

---

## 💰 费用估算

### 小型项目（100-500 用户）

| 服务 | 月费用 | 说明 |
|------|--------|------|
| Dify AI | ¥50-100 | 基础使用 |
| DeepSeek | ¥50-150 | 按需使用 |
| 智谱 AI | ¥0-100 | 免费额度够用 |
| 腾讯云 OCR | ¥0-50 | 免费额度够用 |
| QQ 邮箱 | ¥0 | 免费 |
| **总计** | **¥150-400** | 实际可能更低 |

### 中型项目（500-5000 用户）

| 服务 | 月费用 | 说明 |
|------|--------|------|
| Dify AI | ¥200-500 | 中等使用 |
| DeepSeek | ¥100-300 | 频繁调用 |
| 智谱 AI | ¥100-200 | 超出免费额度 |
| 腾讯云 OCR | ¥50-200 | 按使用量 |
| 企业邮箱 | ¥100-200 | 专业形象 |
| **总计** | **¥550-1400** | |

---

## 🔒 安全提示

1. **保护 API Key**
   - ✅ 已在 `.gitignore` 中排除 `.env.production`
   - ❌ 绝对不要提交到 Git
   - ❌ 不要在前端代码中暴露

2. **定期更换**
   - 建议每 3-6 个月更换一次 API Key
   - 如果泄露立即更换

3. **使用限流**
   - 在后端实现接口限流
   - 防止 API Key 被滥用

4. **监控使用量**
   - 定期检查各服务的使用量
   - 设置费用告警

---

## 🎯 优先级建议

### 必须配置（P0）
- ✅ SMTP 邮件服务（用户注册必需）

### 重要配置（P1）
- ✅ 至少配置一个 AI 服务（Dify/DeepSeek/智谱）
- ✅ 腾讯云 OCR（如果有拍照功能）

### 可选配置（P2）
- ⚪ 配置多个 AI 服务（作为备份）
- ⚪ 配置其他云服务

---

## 📞 技术支持

### Dify AI
- 官网：https://dify.ai
- 文档：https://docs.dify.ai
- 社区：Discord

### DeepSeek
- 官网：https://platform.deepseek.com
- 文档：https://platform.deepseek.com/docs

### 智谱 AI
- 官网：https://open.bigmodel.cn
- 文档：https://open.bigmodel.cn/dev/api

### 腾讯云 OCR
- 控制台：https://console.cloud.tencent.com/ocr
- 文档：https://cloud.tencent.com/document/product/866

---

## ✅ 配置完成检查

- [ ] 已申请至少一个 AI 服务 API Key
- [ ] 已配置邮件服务
- [ ] 已更新 `.env.production` 文件
- [ ] 已测试服务连接
- [ ] 已设置费用告警（云服务）

---

**配置完成后，重新部署应用：**

```bash
# 重新部署
bash deploy-production.sh

# 或手动重启
docker-compose -f docker-compose.prod.yml restart server
```

---

**AI 服务配置完成！** 你的应用现在可以使用完整的 AI 功能了！🎉
