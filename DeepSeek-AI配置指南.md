# DeepSeek AI 配置指南

> 生成时间: 2026-02-07
> 推荐指数: ⭐⭐⭐⭐⭐
> 性价比: 最高 (约 ¥1/百万 tokens)

---

## 为什么选择 DeepSeek?

1. **性价比最高**: 价格约 ¥1/百万 tokens,是同类服务的 1/5
2. **API 稳定**: 响应速度快,服务稳定
3. **中文友好**: 对中文理解能力强
4. **配置简单**: 只需一个 API Key 即可使用
5. **已集成**: 代码已完全实现,配置即用

---

## 第一步: 注册 DeepSeek 账号

### 1. 访问注册页面
打开浏览器,访问: https://platform.deepseek.com/

### 2. 注册账号
- 点击右上角 "注册" 按钮
- 使用邮箱或手机号注册
- 完成邮箱/手机验证

### 3. 登录控制台
注册成功后,登录到 DeepSeek 控制台

---

## 第二步: 获取 API Key

### 1. 进入 API Keys 页面
- 登录后,点击左侧菜单 "API Keys"
- 或直接访问: https://platform.deepseek.com/api_keys

### 2. 创建新的 API Key
- 点击 "创建 API Key" 按钮
- 输入 Key 名称(如: "启蒙之光-生产环境")
- 点击 "创建"

### 3. 复制 API Key
- **重要**: API Key 只显示一次,请立即复制保存
- 格式类似: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 第三步: 配置到项目

### 开发环境配置

编辑 `server/.env` 文件:

```bash
# 将 DeepSeek API Key 替换为你的真实 Key
DEEPSEEK_API_KEY=sk-你的真实API-Key
```

### 生产环境配置

编辑 `.env.production.ready` 文件:

```bash
# 将 DeepSeek API Key 替换为你的真实 Key
DEEPSEEK_API_KEY=sk-你的真实API-Key
```

---

## 第四步: 验证配置

### 1. 运行测试脚本

```bash
# 测试 AI 服务连接
node test-ai-service.js
```

### 2. 启动开发服务器

```bash
cd server
npm run dev
```

### 3. 测试 AI 对话

使用 API 测试工具(如 Postman)或前端应用测试:

```bash
POST http://localhost:3000/api/ai/chat
Content-Type: application/json
Authorization: Bearer <你的JWT Token>

{
  "messages": [
    {
      "role": "user",
      "content": "你好,介绍一下启蒙之光平台"
    }
  ]
}
```

---

## 配置说明

### AI 服务优先级

系统会按以下优先级选择 AI 服务:

1. **DeepSeek** (如果配置了有效的 API Key)
2. 智谱 AI (如果配置了有效的 API Key)
3. Dify (默认)

### 自动切换逻辑

代码会自动检测哪个 AI 服务可用:

```typescript
// server/src/services/aiService.ts:27-34
private getAdapter() {
  // 优先级: DeepSeek > 智谱 > Dify
  const useDeepSeek = process.env.DEEPSEEK_API_KEY &&
                      !process.env.DEEPSEEK_API_KEY.includes('your-');
  if (useDeepSeek) return deepseekAdapter;

  const useZhipu = process.env.ZHIPU_API_KEY &&
                   !process.env.ZHIPU_API_KEY.includes('your-');
  return useZhipu ? zhipuAdapter : difyAdapter;
}
```

---

## 功能支持

DeepSeek AI 支持以下功能:

### 1. AI 对话助手
- 多轮对话
- 上下文记忆
- 儿童友好的回复风格

### 2. 故事生成
- 根据主题生成童话故事
- 支持不同长度(短/中/长)
- 支持不同风格

### 3. 情感分析
- 分析儿童情绪
- 提供情感建议
- 心理健康支持

### 4. 作业辅导
- 智能解题
- 步骤讲解
- 知识点分析

---

## 价格说明

### DeepSeek 定价

- **输入**: ¥1/百万 tokens
- **输出**: ¥2/百万 tokens

### 使用估算

假设每天 1000 次对话,每次平均 500 tokens:

- 每天 tokens: 1000 × 500 = 500,000 tokens
- 每天费用: 500,000 / 1,000,000 × ¥1.5 ≈ ¥0.75
- 每月费用: ¥0.75 × 30 ≈ ¥22.5

**非常经济实惠!**

---

## 常见问题

### Q1: API Key 在哪里查看?

A: 登录 DeepSeek 控制台 → API Keys 页面
注意: API Key 创建后只显示一次,请妥善保存

### Q2: 如何充值?

A: 控制台 → 账户设置 → 充值
支持支付宝、微信支付

### Q3: 有免费额度吗?

A: 新用户通常有一定的免费额度,具体以官网为准

### Q4: API 调用失败怎么办?

A: 检查以下几点:
1. API Key 是否正确
2. 账户余额是否充足
3. 网络连接是否正常
4. 查看服务器日志获取详细错误信息

### Q5: 如何切换回 Dify?

A: 将 `DEEPSEEK_API_KEY` 设置为空或删除该配置项即可

---

## 安全建议

1. **不要提交 API Key 到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 确保不要将 API Key 硬编码到代码中

2. **定期轮换 API Key**
   - 建议每季度更换一次
   - 在 DeepSeek 控制台可以随时创建新 Key

3. **监控使用量**
   - 定期检查 API 调用量
   - 设置用量告警

4. **使用环境变量**
   - 开发环境和生产环境使用不同的 API Key
   - 避免在开发环境消耗生产配额

---

## 下一步

配置完成后,你可以:

1. 测试 AI 对话功能
2. 测试故事生成功能
3. 测试情感分析功能
4. 部署到生产环境

---

## 技术支持

- DeepSeek 官方文档: https://platform.deepseek.com/docs
- DeepSeek API 参考: https://platform.deepseek.com/api-docs
- 问题反馈: support@deepseek.com

---

**配置完成后,请运行测试脚本验证!**

```bash
node test-ai-service.js
```
