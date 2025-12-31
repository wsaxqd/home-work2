# 🚀 Dify AI 集成快速启动指南

## ✅ 第一步：检查当前进度

已完成的工作：
- ✅ 环境配置文件更新（.env）
- ✅ 配置模块更新（config/index.ts）
- ✅ Dify API适配器创建（difyAdapter.ts）
- ✅ AI服务更新（aiService.ts）
- ✅ AI路由增强（ai.ts）
- ✅ 数据库迁移脚本创建
- ✅ axios依赖安装

## 📝 第二步：配置Dify API密钥

### 1. 在Dify中创建应用

访问 [Dify Cloud](https://cloud.dify.ai) 或你的本地Dify实例，创建以下应用：

**应用A - AI聊天助手**
- 类型：Chat App
- 名称：启蒙之光-小光
- 系统提示词：
```
你是"小光",一个专为儿童设计的AI助手。用简单、生动、有趣的方式回答孩子们的问题。
语言风格要亲切友好,充满童趣,回答简洁(不超过200字),内容积极向上。
```

**应用B - 故事生成器**
- 类型：Completion App
- 名称：启蒙之光-故事生成
- 输入变量：prompt, theme, length, style
- 提示词参考 `DIFY_SETUP.md`

**应用C - 情感分析**
- 类型：Completion App
- 名称：启蒙之光-情感分析
- 输入变量：text
- 输出格式：JSON
- 提示词参考 `DIFY_SETUP.md`

### 2. 获取API密钥并配置

在每个应用中获取API密钥，然后编辑 `server/.env`:

```bash
# 编辑环境变量
DIFY_API_URL=https://api.dify.ai/v1  # 或 http://localhost/v1
DIFY_CHAT_APP_KEY=app-xxxxxxxxxx      # 小光对话
DIFY_STORY_APP_KEY=app-xxxxxxxxxx     # 故事生成
DIFY_EMOTION_APP_KEY=app-xxxxxxxxxx   # 情感分析
```

## 🗄️ 第三步：运行数据库迁移

```bash
cd server

# 运行迁移（创建AI相关表）
npm run migrate

# 预期输出：
# Migration 001-012: ... (已有表)
# Migration 013: ai_conversations table created successfully
# Migration 014: ai_generations table created successfully
```

## 🎮 第四步：启动服务器测试

```bash
# 启动开发服务器
npm run dev

# 预期输出：
╔════════════════════════════════════════════════════════╗
║   🌟 启蒙之光 API服务器已启动                            ║
║   端口: 3000                                           ║
╚════════════════════════════════════════════════════════╝
```

## 🧪 第五步：测试AI功能

### 测试1: 健康检查
```bash
curl http://localhost:3000/api/ai/health
```

**成功响应:**
```json
{
  "success": true,
  "message": "AI服务运行正常",
  "data": { "status": "healthy" }
}
```

### 测试2: AI对话（需要登录Token）

**先注册用户:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "Test1234",
    "nickname": "测试用户",
    "age": 10
  }'
```

**登录获取Token:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "Test1234"
  }'
```

复制返回的token，然后测试AI对话：

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "你好小光！"
      }
    ]
  }'
```

**成功响应示例:**
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "reply": "你好呀！我是小光，很高兴认识你！😊",
    "conversationId": "conv-xxxxx",
    "messageId": "msg-xxxxx"
  }
}
```

### 测试3: 故事生成

```bash
curl -X POST http://localhost:3000/api/ai/story \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "prompt": "一只勇敢的小兔子",
    "theme": "童话",
    "length": "short"
  }'
```

### 测试4: 情感分析

```bash
curl -X POST http://localhost:3000/api/ai/emotion/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "text": "今天天气真好,我和小伙伴们一起玩耍,非常开心!"
  }'
```

## 🐛 常见问题排查

### 问题1: "AI服务暂时不可用"

**检查清单:**
- [ ] Dify服务是否运行?
- [ ] API密钥是否正确?
- [ ] 网络连接是否正常?
- [ ] `.env` 文件是否正确配置?

**调试方法:**
```bash
# 查看服务器日志
# 应该能看到详细的错误信息
```

### 问题2: 数据库迁移失败

**检查清单:**
- [ ] PostgreSQL是否运行?
- [ ] 数据库连接信息是否正确?
- [ ] users表是否存在? (ai表依赖users表)

**解决方法:**
```bash
# 先运行基础迁移
npm run migrate

# 如果有错误，查看具体提示
```

### 问题3: Token验证失败

**解决方法:**
- 确保使用正确的Bearer Token格式
- Token可能已过期，重新登录获取新Token
- 检查JWT_SECRET配置是否正确

## 📊 API接口总览

创建的AI相关接口：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/ai/health` | GET | AI服务健康检查 |
| `/api/ai/chat` | POST | AI对话 |
| `/api/ai/story` | POST | 生成故事 |
| `/api/ai/emotion/analyze` | POST | 情感分析 |
| `/api/ai/image/recognize` | POST | 图像识别(待实现) |
| `/api/ai/voice/to-text` | POST | 语音转文字(待实现) |
| `/api/ai/voice/to-speech` | POST | 文字转语音(待实现) |
| `/api/ai/history` | GET | AI使用历史 |
| `/api/ai/stats` | GET | AI使用统计 |
| `/api/ai/conversation/context` | GET | 获取对话上下文 |
| `/api/ai/conversation/context` | DELETE | 清除对话上下文 |

## 🎯 下一步计划

AI服务已就绪！接下来可以：

### ✅ 已完成
1. Dify集成和配置
2. AI对话功能
3. 故事生成功能
4. 情感分析功能
5. 数据库表结构

### 🔜 待开发
1. **前端AI交互界面**
   - 聊天对话组件
   - 故事创作页面
   - 情感日记分析展示

2. **功能优化**
   - 添加对话历史记录
   - 实现打字机效果
   - 添加错误重试机制
   - 实现对话上下文管理

3. **扩展功能**
   - 图像识别（对接百度/腾讯AI）
   - 语音功能（对接讯飞/百度语音）
   - 音乐生成（探索AI音乐API）
   - 绘画辅助（AI绘画提示词生成）

## 📚 相关文档

- 详细配置指南: `server/DIFY_SETUP.md`
- API代码: `server/src/routes/ai.ts`
- 服务层代码: `server/src/services/aiService.ts`
- Dify适配器: `server/src/services/difyAdapter.ts`

## 💡 提示

- 测试时建议先用Postman或类似工具测试API
- 可以在Dify应用中查看每次调用的日志
- 根据实际效果调整Dify应用的提示词
- 注意监控API调用量，避免超出配额

---

**遇到问题？** 检查服务器日志输出，通常会有详细的错误信息！

**成功测试？** 恭喜！🎉 现在可以开始前端集成了！
