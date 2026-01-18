# Dify AI服务配置指南

Dify是一个开源的LLM应用开发平台,本项目使用Dify来提供AI功能。

## 配置选项

### 选项1: 使用Dify云服务 (最简单)

1. 访问 [Dify Cloud](https://cloud.dify.ai/)
2. 注册账号并登录
3. 创建以下应用:
   - **AI聊天应用** - 用于AI小伙伴功能
   - **故事生成应用** - 用于AI生成故事
   - **情感分析应用** - 用于情绪分析
   - **智能辅导应用** - 用于学习辅导

4. 获取每个应用的API Key

5. 更新 `server/.env` 配置:

```env
# Dify云服务配置
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-your-main-api-key
DIFY_CHAT_APP_KEY=app-your-chat-app-key
DIFY_STORY_APP_KEY=app-your-story-app-key
DIFY_EMOTION_APP_KEY=app-your-emotion-app-key
DIFY_TUTORING_APP_KEY=app-your-tutoring-app-key
DIFY_TUTORING_EVALUATE_APP_KEY=app-your-evaluate-app-key
DIFY_TUTORING_SUMMARY_APP_KEY=app-your-summary-app-key
DIFY_TIMEOUT=30000
```

---

### 选项2: 自托管Dify服务 (完全控制)

#### 使用提供的Docker Compose配置

虽然Docker Compose已配置了Dify服务,但由于Dify需要较多资源,建议单独部署:

1. 克隆Dify仓库:
```bash
git clone https://github.com/langgenius/dify.git
cd dify/docker
```

2. 复制环境变量文件:
```bash
cp .env.example .env
```

3. 编辑 `.env` 文件,配置必要的参数

4. 启动Dify:
```bash
docker-compose up -d
```

5. 访问 http://localhost/install 完成初始化

6. 创建应用并获取API Keys

7. 更新项目的 `server/.env`:

```env
DIFY_API_URL=http://localhost/v1
DIFY_API_KEY=app-your-api-key
# ... 其他配置
```

---

### 选项3: 临时禁用AI功能 (开发测试)

如果暂时不需要AI功能,可以临时禁用:

1. 修改 `server/.env`:

```env
# 使用占位符,AI功能将返回模拟数据
DIFY_API_URL=http://localhost/v1
DIFY_API_KEY=disabled
DIFY_CHAT_APP_KEY=disabled
DIFY_STORY_APP_KEY=disabled
DIFY_EMOTION_APP_KEY=disabled
```

2. AI相关功能会返回友好的错误提示

---

## AI功能说明

### 1. AI小伙伴 (Chat)
- 功能: 与儿童进行情感陪伴对话
- API: `/api/ai/chat`
- 使用场景: 温暖小屋 > AI小伙伴

### 2. AI生成故事 (Story)
- 功能: 根据主题和要素生成儿童故事  
- API: `/api/ai/story`
- 使用场景: 创作工具 > 故事创作

### 3. 情感分析 (Emotion)
- 功能: 分析文本中的情绪
- API: `/api/ai/emotion/analyze`
- 使用场景: 心情日记

### 4. 智能辅导 (Tutoring)
- 功能: 提供学习辅导和答疑
- API: `/api/ai/tutoring/*`
- 使用场景: 学习评测、作业辅导

### 5. 图像识别 (Image)
- 功能: 识别图片内容
- API: `/api/ai/image/recognize`
- 使用场景: 作品分析、绘画评价

---

## 测试AI功能

### 测试聊天功能

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "messages": [
      {"role": "user", "content": "你好,我今天很开心"}
    ]
  }'
```

### 测试故事生成

```bash
curl -X POST http://localhost:3000/api/ai/story \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "小兔子找朋友",
    "theme": "friendship",
    "length": "medium"
  }'
```

---

## 常见问题

### Q: Dify服务启动失败?

A: 
- 检查Docker资源限制(至少需要4GB内存)
- 查看日志: `docker-compose logs -f dify`
- 确保所有依赖服务(PostgreSQL, Redis, Weaviate)正常运行

### Q: API调用超时?

A:
- 增大 `DIFY_TIMEOUT` 值
- 检查网络连接
- 确认Dify服务健康状态

### Q: 如何监控AI使用量?

A:
- 查看数据库 `ai_generation_history` 表
- 访问 `/api/ai/stats` 接口获取统计

### Q: 想更换AI模型?

A:
- 在Dify控制台中修改应用配置
- 可以选择不同的LLM提供商(OpenAI, Claude, 通义千问等)
- 调整模型参数(温度、最大tokens等)

---

## 下一步

AI服务配置完成后:

1. 重启后端服务: `cd server && npm run dev`
2. 测试AI功能
3. 监控使用情况
4. 根据需要调整模型参数
