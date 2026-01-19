# 邮件服务配置指南

本指南将帮助您配置启蒙之光平台的邮件发送功能,实现真实的邮箱验证码发送。

---

## 📧 功能说明

邮件服务用于:
- ✅ 发送邮箱验证码(登录/注册)
- ✅ 发送欢迎邮件
- ✅ 发送密码重置邮件
- ✅ 其他通知邮件

**特性:**
- 🎨 精美的HTML邮件模板
- 🔄 自动降级:SMTP未配置时使用模拟模式
- 🛡️ 错误处理:发送失败时自动打印验证码到控制台
- 📝 详细日志:方便调试和追踪

---

## 🚀 快速配置

### 方案一: 使用 Gmail (推荐用于测试)

#### 1. 启用两步验证
1. 访问 [Google账户安全设置](https://myaccount.google.com/security)
2. 启用"两步验证"

#### 2. 生成应用专用密码
1. 访问 [应用专用密码页面](https://myaccount.google.com/apppasswords)
2. 选择应用: "邮件"
3. 选择设备: "Windows电脑" 或 "其他(自定义名称)"
4. 点击"生成"
5. 复制生成的16位密码(格式: xxxx xxxx xxxx xxxx)

#### 3. 配置 .env 文件
```env
# 邮件服务配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # 应用专用密码
EMAIL_FROM=your-email@gmail.com
```

#### 4. 重启服务
```bash
cd server
npm run dev
```

#### 5. 测试
- 访问登录页面
- 选择"邮箱验证码"登录
- 输入邮箱地址并点击"获取验证码"
- 检查邮箱是否收到验证码

---

### 方案二: 使用 QQ邮箱

#### 1. 开启SMTP服务
1. 登录 [QQ邮箱](https://mail.qq.com)
2. 点击"设置" → "账户"
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启"IMAP/SMTP服务"或"POP3/SMTP服务"
5. 点击"生成授权码",按提示发送短信
6. 复制生成的授权码(16位字符)

#### 2. 配置 .env 文件
```env
# 邮件服务配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-qq-number@qq.com
SMTP_PASSWORD=your-16-digit-auth-code  # 授权码
EMAIL_FROM=your-qq-number@qq.com
```

---

### 方案三: 使用 163邮箱

#### 1. 开启SMTP服务
1. 登录 [163邮箱](https://mail.163.com)
2. 点击"设置" → "POP3/SMTP/IMAP"
3. 开启"IMAP/SMTP服务"
4. 点击"客户端授权密码",设置授权密码
5. 复制授权密码

#### 2. 配置 .env 文件
```env
# 邮件服务配置
SMTP_HOST=smtp.163.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@163.com
SMTP_PASSWORD=your-auth-password  # 授权密码
EMAIL_FROM=your-email@163.com
```

---

### 方案四: 使用 Outlook/Hotmail

#### 1. 配置 .env 文件
```env
# 邮件服务配置
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-account-password
EMAIL_FROM=your-email@outlook.com
```

**注意:** 如果启用了两步验证,需要使用应用密码而不是账户密码。

---

## 🔧 高级配置

### SSL连接 (端口465)

如果您的SMTP服务器使用SSL(端口465):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true  # 使用SSL
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
EMAIL_FROM=your-email@example.com
```

### 自定义发件人名称

在代码中已自动配置为"启蒙之光":
```typescript
from: `"启蒙之光" <${config.email.from}>`
```

如需修改,编辑 `server/src/services/emailService.ts:84`

---

## 🧪 测试邮件发送

### 1. 模拟模式测试(无需配置SMTP)

不配置SMTP环境变量,系统会自动进入模拟模式:

```bash
# 不配置 SMTP_* 环境变量
# 重启服务
npm run dev
```

控制台会显示:
```
⚠️  SMTP未配置,邮件发送功能将使用模拟模式
📧 [模拟邮件发送]
收件人: user@example.com
主题: 启蒙之光 - 邮箱验证码
📧 验证码(调试用): user@example.com -> 123456 (有效期10分钟)
```

### 2. 真实SMTP测试

配置SMTP后,发送验证码:

成功时:
```
✅ 邮件服务初始化成功
✅ 邮件发送成功: <message-id>
✅ 验证码邮件已发送: user@example.com
```

失败时(自动降级):
```
❌ 邮件发送失败: Invalid login
📧 [降级为模拟模式]
收件人: user@example.com
📧 验证码(调试用): user@example.com -> 123456 (有效期10分钟)
```

---

## ⚠️ 常见问题

### 1. 邮件发送失败: "Invalid login"

**原因:** 用户名或密码错误

**解决方案:**
- Gmail: 确保使用应用专用密码,而不是账户密码
- QQ/163: 确保使用授权码,而不是邮箱登录密码
- 检查 SMTP_USER 和 SMTP_PASSWORD 配置

### 2. 邮件发送失败: "Connection timeout"

**原因:** 网络问题或端口被阻止

**解决方案:**
- 检查防火墙设置
- 尝试切换端口(587 ↔ 465)
- 检查服务器是否支持该SMTP服务器

### 3. Gmail提示"不够安全的应用"

**原因:** 未启用两步验证或未使用应用专用密码

**解决方案:**
1. 启用两步验证
2. 生成并使用应用专用密码
3. 不要使用账户密码

### 4. 邮件进入垃圾箱

**原因:** 缺少SPF/DKIM配置

**解决方案:**
- 使用正规的SMTP服务商
- 配置域名的SPF记录(如果使用自定义域名)
- 使用与SMTP_USER一致的EMAIL_FROM

### 5. QQ邮箱提示"请使用授权码登录"

**原因:** 使用了邮箱登录密码而不是授权码

**解决方案:**
1. 在QQ邮箱设置中生成授权码
2. 使用授权码替换 SMTP_PASSWORD

---

## 📊 邮件服务状态检查

### 检查配置是否生效

启动服务时查看控制台:

✅ **配置正确:**
```
✅ 环境变量验证通过
✅ 邮件服务初始化成功
```

⚠️ **未配置SMTP:**
```
⚠️  SMTP未配置,邮件发送功能将使用模拟模式
```

❌ **配置错误:**
```
❌ 邮件服务初始化失败: Error message
```

---

## 🎨 自定义邮件模板

邮件模板位于 `server/src/services/emailService.ts`

### 验证码邮件模板
编辑 `getVerificationEmailTemplate()` 方法

### 欢迎邮件模板
编辑 `getWelcomeEmailTemplate()` 方法

### 密码重置邮件模板
编辑 `getPasswordResetEmailTemplate()` 方法

**模板特性:**
- 响应式设计
- 精美渐变背景
- 清晰的视觉层次
- 安全提示

---

## 🔒 安全建议

1. ✅ **使用应用专用密码/授权码**
   - 不要使用邮箱登录密码
   - 定期更换授权码

2. ✅ **保护环境变量**
   - 不要将 .env 文件提交到Git
   - .env 文件已添加到 .gitignore

3. ✅ **使用TLS加密**
   - 推荐使用端口587 + TLS
   - 避免使用未加密端口25

4. ✅ **验证码安全**
   - 10分钟有效期
   - 使用后立即失效
   - 6位随机数字

---

## 📚 相关文档

- [Nodemailer官方文档](https://nodemailer.com/)
- [Gmail SMTP设置](https://support.google.com/mail/answer/7126229)
- [QQ邮箱SMTP设置](https://service.mail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256)
- [163邮箱SMTP设置](http://help.163.com/09/1223/14/5R7P6CJ600753VB8.html)

---

## 🆘 获取帮助

如果遇到问题:

1. 检查控制台日志
2. 确认环境变量配置正确
3. 测试SMTP连接
4. 查看本文档"常见问题"章节
5. 提交Issue到GitHub仓库

---

**配置完成后,您的用户就可以通过邮箱验证码安全登录了!** 🎉
