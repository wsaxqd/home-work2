# 启蒙之光 - 生产环境部署指南

## 📋 部署信息

- **域名**: qmzgai.com
- **服务器 IP**: 106.53.44.162
- **镜像仓库**: ccr.ccs.tencentyun.com
- **版本**: v1.0.0

---

## 🚀 快速部署流程

### 第一步：本地构建并推送镜像（在本地 Windows 电脑执行）

#### 1.1 登录腾讯云容器镜像服务

首先需要在腾讯云控制台创建访问凭证：

1. 访问 [腾讯云容器镜像服务控制台](https://console.cloud.tencent.com/tcr/instance)
2. 点击左侧 **"访问凭证"**
3. 点击 **"新建"** 创建访问凭证
4. 记录用户名和密码

#### 1.2 执行构建脚本

在项目根目录执行：

```cmd
build-and-push-simple.bat
```

脚本会自动完成：
- ✅ 登录镜像仓库
- ✅ 构建后端镜像
- ✅ 构建前端镜像
- ✅ 推送镜像到腾讯云

**预计耗时**: 10-20 分钟（取决于网络速度）

---

### 第二步：在服务器上部署（SSH 登录服务器执行）

#### 2.1 SSH 登录服务器

```bash
ssh root@106.53.44.162
```

#### 2.2 创建项目目录

```bash
mkdir -p /var/www/qmzg
cd /var/www/qmzg
```

#### 2.3 上传部署文件

将以下文件上传到服务器 `/var/www/qmzg/` 目录：

- `docker-compose.prod-image.yml`
- `.env.production`

**方法 1：使用 SCP（在本地 Windows 执行）**

```cmd
scp docker-compose.prod-image.yml root@106.53.44.162:/var/www/qmzg/
scp .env.production root@106.53.44.162:/var/www/qmzg/
```

**方法 2：使用 WinSCP 或 FileZilla 图形界面上传**

#### 2.4 登录腾讯云镜像仓库（在服务器上）

```bash
docker login ccr.ccs.tencentyun.com
# 输入在腾讯云控制台创建的用户名和密码
```

#### 2.5 拉取镜像

```bash
cd /var/www/qmzg
docker-compose -f docker-compose.prod-image.yml pull
```

#### 2.6 启动服务

```bash
docker-compose -f docker-compose.prod-image.yml up -d
```

#### 2.7 查看服务状态

```bash
# 查看容器状态
docker-compose -f docker-compose.prod-image.yml ps

# 查看日志
docker-compose -f docker-compose.prod-image.yml logs -f
```

---

### 第三步：配置 SSL 证书

#### 3.1 安装 Certbot

```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx
```

#### 3.2 申请 SSL 证书

```bash
certbot certonly --standalone -d qmzgai.com -d www.qmzgai.com
```

按提示输入邮箱地址，证书会保存在 `/etc/letsencrypt/live/qmzgai.com/`

#### 3.3 配置自动续期

```bash
# 测试续期
certbot renew --dry-run

# 添加自动续期任务
echo "0 3 * * * certbot renew --quiet" | crontab -
```

---

### 第四步：配置 Nginx

#### 4.1 安装 Nginx

```bash
apt-get install -y nginx
```

#### 4.2 创建 Nginx 配置

创建文件 `/etc/nginx/sites-available/qmzgai.conf`：

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name qmzgai.com www.qmzgai.com;

    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name qmzgai.com www.qmzgai.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/qmzgai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qmzgai.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 日志
    access_log /var/log/nginx/qmzgai.access.log;
    error_log /var/log/nginx/qmzgai.error.log;

    # 前端静态文件
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传文件访问
    location /uploads {
        proxy_pass http://localhost:3000;
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 4.3 启用配置

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/qmzgai.conf /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

---

## ✅ 验证部署

### 1. 检查容器状态

```bash
docker ps
```

应该看到以下容器运行中：
- qmzg-postgres
- qmzg-server
- qmzg-nginx

### 2. 检查服务健康

```bash
# 检查后端
curl http://localhost:3000/health

# 检查前端
curl http://localhost:80
```

### 3. 访问网站

在浏览器访问：
- https://qmzgai.com
- https://www.qmzgai.com

---

## 🔧 常用运维命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod-image.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod-image.yml logs -f server
docker-compose -f docker-compose.prod-image.yml logs -f postgres
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod-image.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod-image.yml restart server
```

### 更新应用

```bash
# 1. 拉取最新镜像
docker-compose -f docker-compose.prod-image.yml pull

# 2. 重启服务
docker-compose -f docker-compose.prod-image.yml up -d

# 3. 清理旧镜像
docker image prune -f
```

### 数据库操作

```bash
# 进入数据库容器
docker-compose -f docker-compose.prod-image.yml exec postgres psql -U qmzg_admin -d qmzg_prod

# 备份数据库
docker-compose -f docker-compose.prod-image.yml exec postgres pg_dump -U qmzg_admin qmzg_prod > backup.sql

# 恢复数据库
docker-compose -f docker-compose.prod-image.yml exec -T postgres psql -U qmzg_admin qmzg_prod < backup.sql
```

---

## 🚨 故障排查

### 问题 1：容器无法启动

```bash
# 查看详细日志
docker-compose -f docker-compose.prod-image.yml logs

# 检查端口占用
netstat -tulpn | grep -E '80|443|3000|5432'
```

### 问题 2：无法访问网站

```bash
# 检查防火墙
ufw status
ufw allow 80/tcp
ufw allow 443/tcp

# 检查 Nginx 状态
systemctl status nginx
nginx -t
```

### 问题 3：数据库连接失败

```bash
# 检查数据库容器
docker-compose -f docker-compose.prod-image.yml exec postgres pg_isready

# 查看数据库日志
docker-compose -f docker-compose.prod-image.yml logs postgres
```

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. 容器日志：`docker-compose logs`
2. Nginx 日志：`/var/log/nginx/qmzgai.error.log`
3. 系统日志：`journalctl -xe`

---

**部署完成后，您的网站将在 https://qmzgai.com 上线！** 🎉
