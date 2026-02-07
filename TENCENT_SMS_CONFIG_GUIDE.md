# 腾讯云短信服务配置指南

本指南将帮助您配置腾讯云短信服务,实现短信验证码功能。

## 功能概述

短信验证码功能:
- 手机号登录: 通过短信验证码实现免密登录
- 手机号注册: 验证手机号真实性
- 密码找回: 通过短信验证码重置密码

特性:
- 6位数字验证码
- 5分钟有效期
- 发送频率限制(60秒/次)
- 每日发送上限(10次/手机号)
- 自动清理过期验证码
- 完整的发送日志记录

## 配置步骤

### 1. 开通腾讯云短信服务

访问 https://console.cloud.tencent.com/smsv2

### 2. 创建应用并获取SDK AppID

在短信控制台创建应用,记录SDK AppID

### 3. 申请短信签名

签名示例: 启蒙之光

### 4. 创建短信模板

模板内容: 您的验证码是{1},{2}分钟内有效,请勿泄露给他人

### 5. 配置环境变量

编辑 .env 文件:

```bash
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key
TENCENT_SMS_SDK_APP_ID=your_sdk_app_id
TENCENT_SMS_SIGN_NAME=启蒙之光
TENCENT_SMS_TEMPLATE_ID=your_template_id
```

### 6. 运行数据库迁移

```bash
cd server
npm run migrate
```

### 7. 重启服务

```bash
docker-compose restart server
```

## API接口

### 发送短信验证码

POST /api/auth/send-sms-code

```json
{
  "phone": "13800138000",
  "purpose": "login"
}
```

### 手机号验证码登录

POST /api/auth/phone-login

```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

## 费用说明

- 免费额度: 100条/月
- 超出后: 0.045元/条

详细文档: https://cloud.tencent.com/document/product/382
