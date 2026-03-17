# 🔐 SSL 证书申请指南

基于邵博士 DevOps 最佳实践 - Let's Encrypt 免费证书

---

## 📋 准备工作

### 1. 确认域名已解析

**检查域名解析：**
```bash
# Linux/Mac
nslookup qmzgai.com

# Windows
nslookup qmzgai.com

# 或使用 ping
ping qmzgai.com
```

**必须确保：**
- ✅ A 记录指向服务器 IP：`106.53.44.162`
- ✅ 域名可以正常 ping 通
- ✅ 80 和 443 端口已开放

---

## 🚀 方法 1：使用 Certbot（推荐）

### 步骤 1：在服务器上安装 Certbot

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install certbot
```

**CentOS/RHEL:**
```bash
sudo yum install certbot
```

### 步骤 2：停止占用 80 端口的服务

```bash
# 如果 Nginx 正在运行
sudo systemctl stop nginx

# 或 Docker 容器
docker-compose down
```

### 步骤 3：申请证书

```bash
sudo certbot certonly --standalone \
  -d qmzgai.com \
  -d www.qmzgai.com \
  --agree-tos \
  --email your-email@example.com \
  --non-interactive
```

**参数说明：**
- `--standalone`: 独立模式（需要 80 端口）
- `-d`: 域名（可以添加多个）
- `--agree-tos`: 同意服务条款
- `--email`: 用于证书到期提醒

### 步骤 4：查找证书文件

证书文件位置：
```bash
/etc/letsencrypt/live/qmzgai.com/
├── fullchain.pem     # 完整证书链（Nginx需要）
├── privkey.pem       # 私钥（Nginx需要）
├── cert.pem          # 证书
└── chain.pem         # 中间证书
```

### 步骤 5：复制证书到项目目录

```bash
# 在服务器上
sudo cp /etc/letsencrypt/live/qmzgai.com/fullchain.pem /opt/qmzg/ssl/
sudo cp /etc/letsencrypt/live/qmzgai.com/privkey.pem /opt/qmzg/ssl/

# 设置权限
sudo chmod 644 /opt/qmzg/ssl/fullchain.pem
sudo chmod 600 /opt/qmzg/ssl/privkey.pem
```

---

## 🔄 方法 2：使用 Docker Certbot

如果不想在服务器上安装 Certbot，可以用 Docker：

```bash
# 停止 Nginx
docker-compose down

# 使用 Docker 申请证书
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d qmzgai.com \
  -d www.qmzgai.com \
  --agree-tos \
  --email your-email@example.com

# 复制证书
sudo cp /etc/letsencrypt/live/qmzgai.com/*.pem ./ssl/

# 重新启动服务
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🌐 方法 3：使用腾讯云/阿里云证书（最简单）

### 腾讯云证书申请

1. 登录腾讯云控制台
2. 进入 **SSL 证书** 服务
3. 点击 **申请免费证书**
4. 选择 **亚洲诚信 TrustAsia DV SSL**
5. 填写域名：`qmzgai.com`
6. 选择验证方式：**DNS 验证**或**文件验证**
7. 按提示完成验证
8. 下载证书（选择 Nginx 格式）

### 阿里云证书申请

1. 登录阿里云控制台
2. 进入 **SSL 证书（应用安全）**
3. 购买免费证书（20个/年）
4. 创建证书订单
5. 填写域名并验证
6. 下载证书（Nginx 格式）

### 证书文件说明

下载的压缩包包含：
```
qmzgai.com_nginx/
├── qmzgai.com.pem        # 证书文件 (改名为 fullchain.pem)
└── qmzgai.com.key        # 私钥文件 (改名为 privkey.pem)
```

**复制到项目：**
```bash
# Windows (本地)
copy qmzgai.com.pem ssl\fullchain.pem
copy qmzgai.com.key ssl\privkey.pem

# Linux (服务器)
cp qmzgai.com.pem /opt/qmzg/ssl/fullchain.pem
cp qmzgai.com.key /opt/qmzg/ssl/privkey.pem
chmod 644 /opt/qmzg/ssl/fullchain.pem
chmod 600 /opt/qmzg/ssl/privkey.pem
```

---

## ✅ 验证证书

### 检查证书文件

```bash
# 查看证书信息
openssl x509 -in ssl/fullchain.pem -text -noout

# 查看证书有效期
openssl x509 -in ssl/fullchain.pem -noout -dates

# 验证证书和私钥是否匹配
openssl x509 -in ssl/fullchain.pem -noout -modulus | openssl md5
openssl rsa -in ssl/privkey.pem -noout -modulus | openssl md5
# 两个 MD5 值应该相同
```

### 测试 HTTPS 连接

```bash
# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 测试 HTTPS
curl -I https://qmzgai.com

# 或使用浏览器访问
# https://qmzgai.com
```

---

## 🔄 证书自动续期

Let's Encrypt 证书有效期为 **90 天**，需要定期续期。

### 方法 1：手动续期

```bash
# 停止 Nginx
docker-compose down

# 续期证书
sudo certbot renew

# 重启 Nginx
docker-compose -f docker-compose.prod.yml up -d
```

### 方法 2：自动续期（推荐）

创建续期脚本 `renew-ssl.sh`：

```bash
#!/bin/bash

# 停止 Nginx（释放 80 端口）
docker-compose down

# 续期证书
certbot renew --quiet

# 复制新证书
cp /etc/letsencrypt/live/qmzgai.com/fullchain.pem /opt/qmzg/ssl/
cp /etc/letsencrypt/live/qmzgai.com/privkey.pem /opt/qmzg/ssl/

# 重启服务
cd /opt/qmzg
docker-compose -f docker-compose.prod.yml up -d
```

添加到 crontab（每月1号凌晨2点执行）：

```bash
# 编辑 crontab
crontab -e

# 添加以下行
0 2 1 * * /opt/qmzg/renew-ssl.sh >> /opt/qmzg/logs/ssl-renew.log 2>&1
```

---

## 🚨 常见问题

### 问题 1：80 端口被占用

**错误信息：**
```
Problem binding to port 80: Could not bind to IPv4 or IPv6.
```

**解决方案：**
```bash
# 查看占用 80 端口的进程
sudo netstat -tulpn | grep :80

# 停止相关服务
sudo systemctl stop nginx
# 或
docker-compose down
```

### 问题 2：域名未解析

**错误信息：**
```
Unable to reach the server
```

**解决方案：**
```bash
# 检查域名解析
nslookup qmzgai.com

# 确保 A 记录指向正确的 IP
# 等待 DNS 生效（可能需要几分钟到几小时）
```

### 问题 3：防火墙阻止

**解决方案：**
```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 腾讯云/阿里云
# 在控制台的安全组中开放 80 和 443 端口
```

### 问题 4：证书过期

**查看过期时间：**
```bash
openssl x509 -in ssl/fullchain.pem -noout -enddate
```

**重新申请：**
```bash
sudo certbot renew --force-renewal
```

---

## 📝 最佳实践

1. ✅ **使用 Let's Encrypt 免费证书**（如果技术能力允许）
2. ✅ **云厂商证书更简单**（推荐新手使用）
3. ✅ **设置自动续期**（避免证书过期）
4. ✅ **备份证书文件**（防止丢失）
5. ✅ **使用 HTTPS**（生产环境必须）

---

## 🎯 下一步

证书申请完成后：

1. 确认证书文件在 `ssl/` 目录
2. 运行部署脚本：
   ```bash
   bash deploy-production.sh
   ```
3. 访问 `https://qmzgai.com` 验证

---

**遇到问题？** 查看 Nginx 错误日志：
```bash
docker-compose -f docker-compose.prod.yml logs nginx
```
