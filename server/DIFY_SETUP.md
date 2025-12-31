# Dify AI 集成配置指南

## 📋 前置准备

1. **安装并启动 Dify**
   - 本地安装：参考 [Dify 官方文档](https://docs.dify.ai)
   - 或使用 Dify 云服务：https://cloud.dify.ai

2. **创建所需的 Dify 应用**
   需要在 Dify 中创建以下三个应用：

### 应用1：AI 聊天助手（小光）
- **应用类型**: Chat App（对话型应用）
- **应用名称**: 启蒙之光 - AI小光
- **系统提示词**:
```
你是"小光"，一个专为儿童设计的AI助手。你的任务是用简单、生动、有趣的方式回答孩子们的问题。

要求：
1. 语言风格：亲切、友好、充满童趣
2. 回答长度：简洁明了，不超过200字
3. 内容适宜：确保内容积极向上，适合儿童
4. 鼓励探索：多用鼓励性语言，激发好奇心
5. 互动性强：可以适当提问，引导思考

示例：
孩子问："什么是AI？"
回答："嗨！我就是AI哦！AI就像是住在电脑里的聪明小伙伴，可以帮你做很多事情，比如回答问题、画画、讲故事。就像你有一个超级聪明的朋友，随时可以陪你玩、教你新知识！你想和我一起探索什么呢？😊"
```
- **模型选择**: GPT-3.5-turbo 或类似模型
- **获取 API Key**: 应用设置 -> API访问 -> 生成密钥

### 应用2：故事生成器
- **应用类型**: Completion App（文本生成应用）
- **应用名称**: 启蒙之光 - 故事生成器
- **输入变量**:
  - `prompt` (必填): 故事主题
  - `theme` (选填): 风格主题（童话/科幻/冒险等）
  - `length` (选填): 故事长度（short/medium/long）
  - `style` (选填): 写作风格

- **提示词模板**:
```
请为6-12岁儿童创作一个有趣的故事。

【故事主题】
{{prompt}}

【风格主题】
{{theme}}

【长度要求】
{% if length == "short" %}约200字{% elif length == "medium" %}约500字{% else %}约1000字{% endif %}

【写作要求】
1. 语言生动活泼，适合儿童阅读
2. 情节有趣，富有想象力
3. 传递积极正面的价值观
4. 结构完整：开头、发展、高潮、结尾
5. 可以适当加入对话，增强趣味性

【输出格式】
标题：[故事标题]

[故事正文]
```

### 应用3：情感分析
- **应用类型**: Completion App
- **应用名称**: 启蒙之光 - 情感分析
- **输入变量**:
  - `text` (必填): 待分析的文本

- **提示词模板**:
```
请分析以下文本的情感倾向，这是一个儿童写的日记或心情记录。

【文本内容】
{{text}}

【分析要求】
1. 识别主要情绪（开心/伤心/生气/焦虑/平静等）
2. 评估情绪强度（0-1之间的置信度）
3. 提供1-2条温暖的建议或鼓励

【输出格式（严格JSON）】
{
  "emotion": "情绪类型（happy/sad/angry/anxious/neutral）",
  "confidence": 0.85,
  "suggestions": ["建议1", "建议2"]
}
```

## 🔧 配置步骤

### 1. 配置环境变量

编辑 `server/.env` 文件：

```env
# Dify AI配置
DIFY_API_URL=http://localhost/v1
# 或使用云服务: https://api.dify.ai/v1

# 填入从Dify应用中获取的API密钥
DIFY_CHAT_APP_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_STORY_APP_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_EMOTION_APP_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxxxx

# API超时时间（毫秒）
DIFY_TIMEOUT=30000
```

### 2. 获取 API 密钥

在每个 Dify 应用中：
1. 进入应用详情页
2. 点击"API访问"标签
3. 点击"创建密钥"按钮
4. 复制生成的密钥（格式：`app-xxxxxxxx`）
5. 粘贴到对应的环境变量中

### 3. 测试配置

```bash
# 进入server目录
cd server

# 安装依赖
npm install

# 运行数据库迁移
npm run migrate

# 启动服务器
npm run dev
```

### 4. 验证 AI 服务

```bash
# 测试AI健康检查
curl http://localhost:3000/api/ai/health

# 预期返回
{
  "success": true,
  "message": "AI服务运行正常",
  "data": {
    "status": "healthy"
  }
}
```

## 🧪 测试 API

### 1. 测试对话功能

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "你好，小光！"
      }
    ]
  }'
```

### 2. 测试故事生成

```bash
curl -X POST http://localhost:3000/api/ai/story \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "一只勇敢的小兔子",
    "theme": "童话",
    "length": "medium",
    "style": "温暖治愈"
  }'
```

### 3. 测试情感分析

```bash
curl -X POST http://localhost:3000/api/ai/emotion/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "今天我很开心，因为我学会了画画！"
  }'
```

## 🔍 常见问题

### Q1: API调用返回401错误
**A**: 检查API密钥是否正确配置，确保格式为 `app-xxxxxxxxx`

### Q2: 返回"AI服务暂时不可用"
**A**:
1. 检查Dify服务是否正常运行
2. 验证 `DIFY_API_URL` 是否正确
3. 检查网络连接

### Q3: 故事生成格式不符合预期
**A**: 调整Dify应用中的提示词模板，明确输出格式要求

### Q4: 情感分析无法解析JSON
**A**: 在Dify应用的提示词中强调"严格JSON格式"，或在代码中增加容错处理

## 📚 相关资源

- [Dify 官方文档](https://docs.dify.ai)
- [Dify API 参考](https://docs.dify.ai/api-reference)
- [项目 AI 服务代码](./src/services/aiService.ts)
- [Dify 适配器代码](./src/services/difyAdapter.ts)

## 💡 优化建议

1. **成本控制**: 在Dify中设置调用频率限制和配额
2. **缓存机制**: 对常见问题使用缓存，减少API调用
3. **降级策略**: 当Dify不可用时，提供预设回复
4. **内容审核**: 增加敏感词过滤，确保儿童安全
5. **监控告警**: 设置API调用监控和异常告警

## 🎯 下一步

配置完成后，您可以：
1. 在前端集成AI对话界面
2. 测试故事创作器功能
3. 体验情感日记分析
4. 根据实际效果调优提示词
