# 邮箱验证功能配置指南

## 📊 功能检查结果

### ✅ 已完成部分 (代码实现很棒!)

**前端:**
- ✅ 邮箱验证码登录UI (完整实现)
- ✅ 邮箱格式验证
- ✅ 发送验证码按钮带倒计时 (60秒)
- ✅ 验证码输入限制 (6位数字)
- ✅ 支持邮箱登录/注册
- ✅ 错误提示和Loading状态

**后端:**
- ✅ 邮箱验证码发送接口
- ✅ 邮箱验证码登录接口
- ✅ 精美的HTML邮件模板
- ✅ 验证码生成和验证逻辑
- ✅ 自动注册功能 (邮箱不存在时)
- ✅ ✨ **新增**: 发送频率限制 (60秒/次)

---

## ⚠️ 需要完成的配置

### 1. 数据库表创建 ✅ 已生成迁移文件

**文件**: `server/migrations/010_create_email_verify_codes_table.sql`

**手动执行 SQL**(如果迁移失败):
```sql
CREATE TABLE IF NOT EXISTS email_verify_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON email_verify_codes(email);
CREATE INDEX idx_email_code ON email_verify_codes(email, code);
CREATE INDEX idx_expires_at ON email_verify_codes(expires_at);
```

**执行方式:**
1. 使用 pgAdmin 或 DBeaver 连接数据库
2. 运行上面的 SQL 语句
3. 或使用命令行: `psql -U postgres -d qmzg_db -f server/migrations/010_create_email_verify_codes_table.sql`

---

### 2. SMTP 邮件服务配置 ⚠️ 重要

邮箱验证码需要真实的邮件服务才能发送到用户邮箱。

#### 方案A: 使用 Gmail (推荐新手)

**步骤:**
1. 登录 Gmail
2. 开启两步验证: https://myaccount.google.com/security
3. 生成应用专用密码: https://myaccount.google.com/apppasswords
4. 在 `.env` 文件配置:

```env
# SMTP 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=your-email@gmail.com
```

#### 方案B: 使用 QQ 邮箱

**步骤:**
1. 登录 QQ 邮箱
2. 设置 → 账户 → 开启 SMTP 服务
3. 获取授权码(不是QQ密码)
4. 在 `.env` 文件配置:

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-qq-email@qq.com
SMTP_PASSWORD=your-authorization-code
EMAIL_FROM=your-qq-email@qq.com
```

#### 方案C: 使用 163 邮箱

```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@163.com
SMTP_PASSWORD=your-authorization-code
EMAIL_FROM=your-email@163.com
```

#### 方案D: 使用 Outlook/Hotmail

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
EMAIL_FROM=your-email@outlook.com
```

**⚠️ 注意:**
- 不配置SMTP会进入"模拟模式",验证码只在服务器控制台打印
- 模拟模式下可以在后端控制台看到验证码用于测试

---

### 3. 测试邮箱验证功能

#### 测试步骤:

1. **启动后端服务**
   ```bash
   cd server
   npm run dev
   ```

2. **打开前端页面**
   - 访问: http://localhost:5177/
   - 点击"邮箱验证码"标签

3. **测试发送验证码**
   - 输入邮箱地址
   - 点击"获取验证码"按钮
   - 观察:
     - ✅ 按钮变为倒计时 (60秒)
     - ✅ 显示"验证码已发送"提示
     - ✅ 如果未配置SMTP,在后端控制台查看验证码

4. **测试登录**
   - 输入收到的验证码
   - 点击"邮箱登录"
   - 应该能成功登录并跳转到主页

5. **测试频率限制**
   - 再次点击"获取验证码"
   - 应该显示"请60秒后再试"的提示

6. **测试验证码过期**
   - 等待10分钟后输入旧验证码
   - 应该显示"验证码错误或已过期"

---

## 📝 配置检查清单

### 数据库配置
- [ ] 数据库连接正常
- [ ] `email_verify_codes` 表已创建
- [ ] 表结构包含所有必需字段

### 邮件服务配置
- [ ] `.env` 文件中配置了 SMTP
- [ ] SMTP 用户名和密码正确
- [ ] 测试发送邮件成功

### 功能测试
- [ ] 可以成功发送验证码
- [ ] 邮箱能收到验证码邮件
- [ ] 验证码可以成功登录
- [ ] 60秒内不能重复发送
- [ ] 验证码过期后无法使用
- [ ] 验证码使用后无法重复使用

---

## 🐛 常见问题排查

### 问题1: 收不到邮件

**可能原因:**
- SMTP配置错误
- 邮箱服务未开启SMTP
- 密码使用了登录密码而不是授权码
- 邮件被归类到垃圾箱

**解决方法:**
1. 检查后端控制台是否有错误日志
2. 查看垃圾邮件文件夹
3. 使用正确的授权码(不是登录密码)
4. 测试SMTP连接: `telnet smtp.gmail.com 587`

### 问题2: 数据库错误

**错误信息**: `relation "email_verify_codes" does not exist`

**解决方法:**
1. 手动运行SQL创建表
2. 或修复数据库连接后运行 `npm run migrate`

### 问题3: 频率限制不生效

**可能原因:**
- 数据库时区配置问题
- created_at 字段没有默认值

**解决方法:**
- 确保数据库使用 UTC 时区
- 检查表结构是否正确

### 问题4: 验证码一直提示错误

**可能原因:**
- 验证码已被使用
- 验证码已过期
- 输入的验证码不正确

**解决方法:**
- 重新发送新验证码
- 检查后端日志查看实际的验证码
- 确认没有输入多余的空格

---

## 🚀 后续优化建议

### 1. 定期清理过期验证码

创建定时任务清理过期数据:
```sql
DELETE FROM email_verify_codes
WHERE expires_at < NOW() - INTERVAL '1 day';
```

### 2. 添加验证码重试次数限制

防止暴力破解:
- 同一邮箱5次验证失败后锁定10分钟

### 3. 添加图形验证码

在发送验证码前添加图形验证码,防止机器人攻击

### 4. 邮件模板优化

- 添加公司LOGO
- 添加取消订阅链接
- 优化移动端显示

### 5. 监控和告警

- 监控验证码发送成功率
- 异常发送量告警
- SMTP服务可用性监控

---

## 📊 总结

**当前状态**:
- ✅ 代码实现: 90% 完成
- ⚠️ 配置: 需要完成数据库表创建和SMTP配置
- ✅ 功能: 包含所有核心功能
- ✅ 安全: 有过期时间、使用一次、频率限制

**下一步**:
1. 创建数据库表
2. 配置SMTP服务
3. 测试完整流程
4. 上线使用

有任何问题随时问我! 🎉
