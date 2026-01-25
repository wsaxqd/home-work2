# DeepSeek AI 配置指南

## 什么是DeepSeek?

DeepSeek是一个高性能、高性价比的AI大模型服务,非常适合用于儿童教育场景。相比其他AI服务商,DeepSeek具有以下优势:

- ✅ **性价比高** - 价格实惠,适合长期使用
- ✅ **响应快速** - 国内访问速度快
- ✅ **功能强大** - 支持长文本对话
- ✅ **稳定可靠** - API稳定性好

## 如何获取DeepSeek API密钥

### 步骤1: 注册DeepSeek账号

1. 访问 DeepSeek 官网: https://platform.deepseek.com/
2. 点击右上角"注册"或"登录"按钮
3. 使用手机号或邮箱完成注册

### 步骤2: 创建API密钥

1. 登录后,进入控制台: https://platform.deepseek.com/api_keys
2. 点击"创建新的API密钥"按钮
3. 给密钥起一个名字(如: "启蒙之光项目")
4. 点击"创建"
5. **重要**: 立即复制并保存好这个API密钥,它只会显示一次!

### 步骤3: 配置到项目中

1. 打开项目的 `server/.env` 文件
2. 找到 `DEEPSEEK_API_KEY` 这一行
3. 将 `your-deepseek-api-key-here` 替换为你复制的API密钥

示例:
```env
DEEPSEEK_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz
```

### 步骤4: 重启服务

配置完成后,需要重启后端服务才能生效:

```bash
# 停止当前运行的服务
# 然后重新启动

cd server
npm run dev
```

## 如何验证配置成功

1. 启动项目后端和前端
2. 访问"AI聊天"或"AI伙伴"页面
3. 发送一条消息
4. 如果收到智能回复(而不是固定的模拟回复),说明配置成功!

## 当前AI服务优先级

项目会按照以下优先级选择AI服务:

1. **DeepSeek** - 如果配置了 `DEEPSEEK_API_KEY`
2. **智谱AI** - 如果配置了 `ZHIPU_API_KEY`
3. **Dify** - 作为最后的备用方案

建议优先使用DeepSeek,性价比最高!

## 费用说明

- DeepSeek提供一定的免费额度供测试使用
- 正式使用需要充值,费用非常实惠
- 详细价格可以在官网查看: https://platform.deepseek.com/pricing

## 常见问题

### Q: API密钥配置了但还是收到模拟回复?

A: 请检查:
1. API密钥是否正确(不要包含多余的空格)
2. 是否重启了后端服务
3. API密钥是否还有额度

### Q: 出现"DeepSeek API error"错误?

A: 可能的原因:
1. API密钥已过期或无效
2. 账户余额不足
3. 网络连接问题

解决方法: 登录DeepSeek控制台检查密钥状态和账户余额

### Q: 想要切换到其他AI服务怎么办?

A: 在 `.env` 文件中配置对应的API密钥即可:
- 智谱AI: 配置 `ZHIPU_API_KEY`
- Dify: 已默认配置为备用方案

系统会自动选择已配置的服务,优先级: DeepSeek > 智谱 > Dify

## 技术支持

如果遇到配置问题,可以:
1. 查看后端控制台日志
2. 访问DeepSeek官方文档: https://platform.deepseek.com/docs
3. 联系项目技术支持

---

配置完成后,启蒙之光平台的AI功能将更加智能和强大! 🚀
