# DeepSeek AI 快速配置指南

> 5分钟快速配置 DeepSeek AI

---

## 第一步: 获取 API Key (2分钟)

1. 访问 https://platform.deepseek.com/
2. 注册/登录账号
3. 进入 "API Keys" 页面
4. 点击 "创建 API Key"
5. 复制生成的 Key (格式: `sk-xxxxxxxx...`)

---

## 第二步: 配置到项目 (1分钟)

### 方法一: 手动编辑 (推荐)

编辑 `server/.env` 文件,找到这一行:

```bash
DEEPSEEK_API_KEY=your-deepseek-api-key-here
```

替换为你的真实 API Key:

```bash
DEEPSEEK_API_KEY=sk-你复制的真实Key
```

### 方法二: 使用命令行

```bash
# Windows
echo DEEPSEEK_API_KEY=sk-你的Key >> server\.env

# Linux/Mac
echo "DEEPSEEK_API_KEY=sk-你的Key" >> server/.env
```

---

## 第三步: 测试配置 (2分钟)

运行测试脚本:

```bash
node test-ai-service.js
```

如果看到:

```
✅ DeepSeek AI 测试成功
💬 回复: 你好!我是启蒙之光的AI助手...
```

说明配置成功!

---

## 常见问题

### Q: API Key 在哪里?
A: DeepSeek 控制台 → API Keys → 创建

### Q: 需要充值吗?
A: 新用户通常有免费额度,用完后需充值

### Q: 如何充值?
A: 控制台 → 账户设置 → 充值 (支持支付宝/微信)

### Q: 价格多少?
A: 约 ¥1/百万 tokens (非常便宜!)

---

## 下一步

配置完成后:

1. 启动开发服务器: `cd server && npm run dev`
2. 测试 AI 对话功能
3. 部署到生产环境

---

## 需要帮助?

- 查看详细文档: `DeepSeek-AI配置指南.md`
- DeepSeek 官方文档: https://platform.deepseek.com/docs
- 问题反馈: support@deepseek.com
