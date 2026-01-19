# 启蒙之光 - 快速开始指南

## 🚀 快速配置 Dify AI

### 方式一：使用模拟回复（无需配置）

当前系统已经配置了模拟回复功能，可以直接使用：

1. 启动服务：
   ```bash
   # 启动后端
   cd server
   npm run dev

   # 启动前端（新终端）
   cd app
   npm run dev
   ```

2. 访问应用：`http://localhost:5174`

3. 进入 "AI情感陪伴" 页面即可开始聊天

**特点**：
- ✅ 无需配置，开箱即用
- ✅ 回复速度快
- ❌ 回复内容固定，不够智能

---

### 方式二：配置真实 AI（推荐）

如需使用真实的 AI 智能对话，请按以下步骤配置：

#### 第一步：注册 Dify 账号

访问：https://cloud.dify.ai/ 并注册账号

#### 第二步：创建应用

在 Dify 控制台创建以下 3 个应用：

1. **聊天应用**（Chat Assistant）
   - 名称：启蒙之光-AI助手
   - 模型：GPT-3.5-turbo
   - 系统提示词：见 `DIFY_CONFIG_GUIDE.md`

2. **故事生成应用**（Text Generator）
   - 名称：启蒙之光-故事生成器
   - 提示词模板：见 `DIFY_CONFIG_GUIDE.md`

3. **情感分析应用**（Text Generator）
   - 名称：启蒙之光-情感分析
   - 提示词模板：见 `DIFY_CONFIG_GUIDE.md`

#### 第三步：获取 API 密钥

在每个应用的详情页获取 API 密钥（格式：`app-xxxxxx`）

#### 第四步：更新配置

编辑 `server/.env` 文件：

```env
DIFY_API_URL=https://api.dify.ai/v1
DIFY_CHAT_APP_KEY=app-你的聊天应用密钥
DIFY_STORY_APP_KEY=app-你的故事生成密钥
DIFY_EMOTION_APP_KEY=app-你的情感分析密钥
```

#### 第五步：验证配置

```bash
cd server
node scripts/check-dify-config.js
```

#### 第六步：重启服务

重启后端服务，配置即生效。

---

## 📚 详细文档

- **完整配置指南**：`DIFY_CONFIG_GUIDE.md`
- **配置模板**：`server/.env.template`
- **验证脚本**：`server/scripts/check-dify-config.js`

---

## ❓ 常见问题

**Q: 如何知道是否使用了真实 AI？**

A: 查看服务器日志，如果显示 "使用模拟回复功能"，说明使用的是模拟回复。

**Q: Dify 需要付费吗？**

A: Dify 提供免费试用额度，新用户可免费使用。

**Q: 配置失败怎么办？**

A: 运行验证脚本查看具体错误，或参考完整配置指南。

---

## 🎉 开始使用

配置完成后，打开浏览器访问 `http://localhost:5174`，享受智能 AI 陪伴！
