# 🚀 5分钟快速配置 QQ 邮箱 SMTP

## 步骤 1：开启 QQ 邮箱 SMTP 服务

1. 登录 QQ 邮箱：https://mail.qq.com
2. 点击右上角「设置」→「账户」
3. 找到「POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务」
4. 开启「POP3/SMTP服务」或「IMAP/SMTP服务」
5. 点击「生成授权码」
6. **保存这个16位授权码**（重要！）

## 步骤 2：修改配置文件

打开文件：`.env.production`

找到这几行并修改：

```env
# === 邮件服务配置 ===
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=你的QQ号@qq.com           # 改成你的QQ邮箱
SMTP_PASSWORD=16位授权码            # 改成刚才生成的授权码
SMTP_FROM=启蒙之光 <你的QQ号@qq.com>  # 改成你的QQ邮箱
```

**示例：**
```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=12345678@qq.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM=启蒙之光 <12345678@qq.com>
```

## 步骤 3：保存文件

Ctrl + S 保存

## ✅ 完成！

邮件服务已配置完成，只需 5 分钟！

---

**下一步：配置 SSL 证书**
