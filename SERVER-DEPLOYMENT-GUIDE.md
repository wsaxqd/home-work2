# 启蒙之光 - 服务器部署完整指南

## 📋 部署信息

- **域名**: qmzgai.com
- **服务器 IP**: 106.53.44.162
- **镜像仓库**: ccr.ccs.tencentyun.com/qmzg-ai-edu
- **版本**: v1.0.0

---

## ✅ 已完成的工作

1. ✅ Docker 镜像已构建
2. ✅ 镜像已推送到腾讯云容器镜像仓库
3. ✅ 域名已备案
4. ✅ DNS 已配置指向服务器

---

## 🚀 服务器部署步骤

### 第一步：SSH 登录服务器

```bash
ssh root@106.53.44.162
```

### 第二步：安装必要软件

```bash
# 更新系统
apt-get update && apt-get upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | bash
systemctl enable docker
systemctl start docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 第三步：创建项目目录

```bash
mkdir -p /var/www/qmzg
cd /var/www/qmzg
```

### 第四步：上传部署文件

需要上传以下文件到服务器 `/var/www/qmzg/` 目录：

1. `docker-compose.prod-image.yml`
2. `.env.production`

**使用 SCP 上传（在本地 Windows 执行）：**

```cmd
scp docker-compose.prod-image.yml root@106.53.44.162:/var/www/qmzg/
scp .env.production root@106.53.44.162:/var/www/qmzg/.env
```

或者使用 WinSCP / FileZilla 图形界面上传。

### 第五步：登录腾讯云镜像仓库

```bash
docker login ccr.ccs.tencentyun.com
# 用户名: 100045871207
# 密码: qmzg1234
```

### 第六步：拉取镜像

```bash
cd /var/www/qmzg
docker-compose -f docker-compose.prod-image.yml pull
```

### 第七步：启动服务

```bash
docker-compose -f docker-compose.prod-image.yml up -d
```

### 第八步：查看服务状态

```bash
# 查看容器状态
docker-compose -f docker-compose.prod-image.yml ps

# 查看日志
docker-compose -f docker-compose.prod-image.yml logs -f
```

---

## 🔐 配置 SSL 证书

### 安装 Certbot

```bash
apt-get install -y certbot python3-certbot-nginx
```

### 申请 SSL 证书

```bash
# 停止 Nginx 容器以释放 80 端口
docker-compose -f docker-compose.prod-image.yml stop nginx

# 申请证书
certbot certonly --standalone -d qmzgai.com -d www.qmzgai.com

# 重新启动 Nginx
docker-compose -f docker-compose.prod-image.yml start nginx
```

### 配置自动续期

```bash
# 测试续期
certbot renew --dry-run

# 添加自动续期任务
echo "0 3 * * * certbot renew --quiet --pre-hook 'docker-compose -f /var/www/qmzg/docker-compose.prod-image.yml stop nginx' --post-hook 'docker-compose -f /var/www/qmzg/docker-compose.prod-image.yml start nginx'" | crontab -
```

---

## 🌐 配置 Nginx 反向代理

### 安装 Nginx（宿主机）

```bash
apt-get install -y nginx
```

### 创建 Nginx 配置

创建文件 `/etc/nginx/sites-available/qmzgai.conf`：

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name qmzgai.com www.qmzgai.com;

    # Let's Encrypt 验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
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

    # 代理到 Docker 容器
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

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 启用配置

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/qmzgai.conf /etc/nginx/sites-enabled/

# 删除默认配置
rm -f /etc/nginx/sites-enabled/default

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
- http://106.53.44.162 （临时测试）
- https://qmzgai.com （配置 SSL 后）
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
docker-compose -f docker-compose.prod-image.yml exec postgres pg_dump -U qmzg_admin qmzg_prod > backup_$(date +%Y%m%d).sql

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

## 📊 镜像信息

已推送的镜像：

- **后端**: `ccr.ccs.tencentyun.com/qmzg-ai-edu/qmzg-server:v1.0.0`
- **前端**: `ccr.ccs.tencentyun.com/qmzg-ai-edu/qmzg-app:v1.0.0`

---

## 🎉 部署完成

完成以上步骤后，您的网站将在以下地址上线：

- **临时访问**: http://106.53.44.162
- **正式域名**: https://qmzgai.com
- **备用域名**: https://www.qmzgai.com

---

**文档版本**: v1.0
**更新日期**: 2026-01-31
**部署状态**: 准备就绪 ✅
