# SSL 证书配置完全指南

## 📋 目录

1. [前置要求](#前置要求)
2. [自动化配置（推荐）](#自动化配置)
3. [手动配置](#手动配置)
4. [验证配置](#验证配置)
5. [常见问题](#常见问题)
6. [安全加固](#安全加固)

---

## 🔐 前置要求

在申请 SSL 证书前，请确保：

- ✅ DNS 已正确解析到服务器
- ✅ 服务器防火墙已开放 80 和 443 端口
- ✅ Nginx 已安装并正常运行
- ✅ 域名已完成实名认证

### 检查 DNS 解析

```bash
# 检查域名是否解析到当前服务器
dig qmzgai.com +short
nslookup qmzgai.com

# 当前服务器 IP
curl ifconfig.me
```

### 检查防火墙端口

```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 🚀 自动化配置（推荐）

### 方法 1：使用自动化脚本

我已经为你准备好了自动化脚本 `ssl-setup.sh`，它会：

1. 自动安装 Certbot
2. 申请免费 SSL 证书
3. 配置 Nginx
4. 设置自动续期

**使用方法：**

```bash
# 1. 上传脚本到服务器
scp ssl-setup.sh root@你的服务器IP:/root/

# 2. 登录服务器
ssh root@你的服务器IP

# 3. 赋予执行权限
chmod +x ssl-setup.sh

# 4. 运行脚本
sudo bash ssl-setup.sh
```

**脚本执行过程：**

```
========================================
  启蒙之光 - SSL 证书自动配置工具
  域名: qmzgai.com
========================================

[INFO] 检测到操作系统: ubuntu 22.04
[INFO] 检测到 Nginx: nginx/1.18.0
[INFO] 检查 DNS 解析...
[INFO] 当前服务器 IP: 123.45.67.89
[INFO] qmzgai.com -> 123.45.67.89 ✓
[INFO] www.qmzgai.com -> 123.45.67.89 ✓

是否继续？(y/n): y

[INFO] 备份 Nginx 配置...
[INFO] 开始安装 Certbot...
[INFO] 创建临时 Nginx 配置...
[INFO] 开始申请 SSL 证书...

Saving debug log to /var/log/letsencrypt/letsencrypt.log
Requesting a certificate for qmzgai.com and www.qmzgai.com

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/qmzgai.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/qmzgai.com/privkey.pem

[INFO] SSL 证书申请成功！
[INFO] 创建生产环境 Nginx 配置...
[INFO] 设置证书自动续期...

========================================
SSL 证书配置完成！
========================================

现在可以通过 HTTPS 访问网站：
  https://qmzgai.com
  https://www.qmzgai.com
```

---

## 🔧 手动配置

如果你想手动配置，请按照以下步骤：

### 步骤 1：安装 Certbot

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

**CentOS/RHEL:**
```bash
sudo yum install epel-release
sudo yum install certbot python3-certbot-nginx
```

### 步骤 2：创建临时 Nginx 配置

```bash
sudo nano /etc/nginx/conf.d/qmzgai-temp.conf
```

内容：
```nginx
server {
    listen 80;
    server_name qmzgai.com www.qmzgai.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    location / {
        root /var/www/html;
        index index.html;
    }
}
```

重载 Nginx：
```bash
sudo mkdir -p /var/www/html
sudo nginx -t
sudo systemctl reload nginx
```

### 步骤 3：申请证书

```bash
sudo certbot certonly \
  --webroot \
  --webroot-path=/var/www/html \
  -d qmzgai.com \
  -d www.qmzgai.com \
  -d api.qmzgai.com \
  --email admin@qmzgai.com \
  --agree-tos \
  --no-eff-email
```

### 步骤 4：配置 Nginx 使用证书

```bash
# 复制准备好的配置文件
sudo cp nginx/qmzgai.conf /etc/nginx/conf.d/

# 删除临时配置
sudo rm /etc/nginx/conf.d/qmzgai-temp.conf

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 步骤 5：设置自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# 创建续期钩子
sudo mkdir -p /etc/letsencrypt/renewal-hooks/post
sudo nano /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

内容：
```bash
#!/bin/bash
systemctl reload nginx
```

赋予执行权限：
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

---

## ✅ 验证配置

### 1. 检查证书信息

```bash
sudo certbot certificates
```

**预期输出：**
```
Found the following certs:
  Certificate Name: qmzgai.com
    Domains: qmzgai.com www.qmzgai.com api.qmzgai.com
    Expiry Date: 2026-04-28 12:00:00+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/qmzgai.com/fullchain.pem
    Private Key Path: /etc/letsencrypt/live/qmzgai.com/privkey.pem
```

### 2. 测试 HTTPS 访问

```bash
# 测试主域名
curl -I https://qmzgai.com

# 测试 www 子域名
curl -I https://www.qmzgai.com

# 测试 HTTP 跳转
curl -I http://qmzgai.com
```

**预期看到：**
```
HTTP/2 200
server: nginx/1.18.0
strict-transport-security: max-age=63072000; includeSubDomains; preload
```

### 3. 使用在线工具检测

访问：**https://www.ssllabs.com/ssltest/**

输入 `qmzgai.com`，点击「Submit」

**目标评级：A 或 A+**

---

## 🛡️ 安全加固

### 1. 开启 HSTS Preload

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

然后提交到 HSTS Preload 列表：
https://hstspreload.org/

### 2. 配置 CAA 记录

在 DNS 中添加 CAA 记录，限制只有 Let's Encrypt 可以颁发证书：

```
类型：CAA
主机记录：@
记录值：0 issue "letsencrypt.org"
```

### 3. 启用 OCSP Stapling

在 Nginx 配置中（已包含在模板中）：

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/qmzgai.com/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;
```

### 4. 禁用弱加密套件

只使用安全的加密协议：

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers off;
```

---

## ❌ 常见问题

### Q1：证书申请失败 - DNS 验证失败

**错误信息：**
```
Timeout during connect (likely firewall problem)
```

**解决方法：**
```bash
# 1. 检查 DNS 是否解析正确
dig qmzgai.com +short

# 2. 检查防火墙
sudo ufw status
sudo ufw allow 80/tcp

# 3. 检查 Nginx 是否监听 80 端口
sudo netstat -tlnp | grep :80

# 4. 测试 HTTP 访问
curl http://qmzgai.com/.well-known/acme-challenge/test
```

---

### Q2：证书申请失败 - Rate Limit

**错误信息：**
```
too many certificates already issued for exact set of domains
```

**原因：** Let's Encrypt 限制每周最多申请 5 次相同域名组合

**解决方法：**
```bash
# 使用 staging 环境测试
sudo certbot certonly --staging \
  --webroot \
  --webroot-path=/var/www/html \
  -d qmzgai.com \
  -d www.qmzgai.com

# 确认配置正确后，删除 staging 证书，申请生产证书
sudo certbot delete --cert-name qmzgai.com
```

---

### Q3：浏览器提示"不安全"

**可能原因：**

1. **证书未正确安装**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **混合内容（Mixed Content）**
   - 检查网页中是否有 HTTP 资源
   - 所有资源都应该使用 HTTPS

3. **证书链不完整**
   ```nginx
   # 确保使用 fullchain.pem 而不是 cert.pem
   ssl_certificate /etc/letsencrypt/live/qmzgai.com/fullchain.pem;
   ```

---

### Q4：证书自动续期失败

**检查续期日志：**
```bash
sudo cat /var/log/letsencrypt/letsencrypt.log
```

**手动续期：**
```bash
sudo certbot renew --force-renewal
```

**测试续期：**
```bash
sudo certbot renew --dry-run
```

---

### Q5：如何添加新的子域名到证书？

```bash
# 申请新证书（会替换旧证书）
sudo certbot certonly \
  --webroot \
  --webroot-path=/var/www/html \
  -d qmzgai.com \
  -d www.qmzgai.com \
  -d api.qmzgai.com \
  -d admin.qmzgai.com \
  --expand

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 📊 证书管理命令

### 查看所有证书

```bash
sudo certbot certificates
```

### 删除证书

```bash
sudo certbot delete --cert-name qmzgai.com
```

### 撤销证书

```bash
sudo certbot revoke --cert-path /etc/letsencrypt/live/qmzgai.com/cert.pem
```

### 手动续期

```bash
sudo certbot renew
```

### 测试续期（不实际续期）

```bash
sudo certbot renew --dry-run
```

---

## 📅 证书生命周期

| 事件 | 时间 | 说明 |
|------|------|------|
| 证书颁发 | Day 0 | 有效期 90 天 |
| 开始尝试续期 | Day 60 | 提前 30 天开始自动续期 |
| 证书过期 | Day 90 | 如未续期，网站将显示不安全 |

**自动续期检查：** Certbot 会每天自动检查 2 次证书是否需要续期

---

## 🔗 参考资源

- **Let's Encrypt 官网：** https://letsencrypt.org/
- **Certbot 文档：** https://certbot.eff.org/
- **SSL Labs 测试：** https://www.ssllabs.com/ssltest/
- **Mozilla SSL 配置生成器：** https://ssl-config.mozilla.org/

---

## 📞 技术支持

如遇到问题，可以：

1. 查看 Certbot 日志：`/var/log/letsencrypt/letsencrypt.log`
2. 查看 Nginx 错误日志：`/var/log/nginx/error.log`
3. Let's Encrypt 社区：https://community.letsencrypt.org/

---

**配置完成时间：** 2026-01-28
**证书提供商：** Let's Encrypt
**证书有效期：** 90 天（自动续期）
**文档版本：** v1.0
