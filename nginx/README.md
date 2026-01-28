# Nginx 配置文件使用指南

本目录包含启蒙之光项目的 Nginx 配置文件，支持开发和生产环境。

## 📁 文件说明

- **nginx.conf** - 生产环境配置（腾讯云服务器部署使用）
- **nginx.dev.conf** - 开发环境配置（本地测试使用）

## 🚀 生产环境部署步骤

### 1. 购买并配置腾讯云服务器

```bash
# 推荐配置
- CPU: 2核
- 内存: 4GB
- 系统: Ubuntu 22.04 LTS
- 带宽: 5Mbps
```

### 2. 安装必要软件

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2
sudo npm install -g pm2

# 安装 Git
sudo apt install -y git
```

### 3. 配置数据库

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE qmzg_prod;
CREATE USER qmzg_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE qmzg_prod TO qmzg_user;
\q
```

### 4. 部署项目

```bash
# 创建项目目录
sudo mkdir -p /var/www/qmzg
sudo chown -R $USER:$USER /var/www/qmzg

# 克隆项目
cd /var/www/qmzg
git clone <your-repository-url> .

# 配置环境变量
cd server
cp .env.example .env
nano .env  # 编辑数据库连接信息

# 安装依赖并运行迁移
npm install --production
npm run migrate

# 构建前端
cd ../app
npm install
npm run build
```

### 5. 配置 Nginx

```bash
# 复制配置文件
sudo cp /var/www/qmzg/nginx/nginx.conf /etc/nginx/sites-available/qmzg

# 修改域名
sudo nano /etc/nginx/sites-available/qmzg
# 将 your-domain.com 替换为您的实际域名

# 创建软链接
sudo ln -s /etc/nginx/sites-available/qmzg /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 6. 申请 SSL 证书

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 创建证书验证目录
sudo mkdir -p /var/www/certbot

# 申请证书
sudo certbot certonly --webroot -w /var/www/certbot -d your-domain.com -d www.your-domain.com

# 更新 Nginx 配置中的证书路径
sudo nano /etc/nginx/sites-available/qmzg

# 重启 Nginx
sudo systemctl restart nginx

# 设置自动续期
sudo certbot renew --dry-run
```

### 7. 启动后端服务

```bash
cd /var/www/qmzg/server

# 使用 PM2 启动
pm2 start npm --name "qmzg-backend" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs qmzg-backend
```

### 8. 配置防火墙

```bash
# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

## 🛠️ 开发环境使用（可选）

如果您想在本地使用 Nginx 进行测试：

### Windows 环境

1. 下载 Nginx for Windows：http://nginx.org/en/download.html

2. 复制配置文件：
```bash
copy nginx\nginx.dev.conf <nginx-path>\conf\nginx.conf
```

3. 启动 Nginx：
```bash
cd <nginx-path>
start nginx
```

4. 访问：http://localhost:8080

### Linux/Mac 环境

```bash
# 安装 Nginx
# Ubuntu: sudo apt install nginx
# Mac: brew install nginx

# 复制配置文件
sudo cp nginx/nginx.dev.conf /etc/nginx/sites-available/qmzg-dev
sudo ln -s /etc/nginx/sites-available/qmzg-dev /etc/nginx/sites-enabled/

# 重启 Nginx
sudo nginx -s reload

# 访问：http://localhost:8080
```

## 📊 常用维护命令

### Nginx 操作

```bash
# 测试配置文件
sudo nginx -t

# 重新加载配置
sudo nginx -s reload

# 重启 Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx

# 查看日志
sudo tail -f /var/log/nginx/qmzg-error.log
sudo tail -f /var/log/nginx/qmzg-access.log
```

### PM2 操作

```bash
# 查看进程列表
pm2 list

# 查看日志
pm2 logs qmzg-backend

# 重启应用
pm2 restart qmzg-backend

# 停止应用
pm2 stop qmzg-backend

# 监控资源
pm2 monit
```

### SSL 证书续期

```bash
# 手动续期
sudo certbot renew

# 查看证书信息
sudo certbot certificates

# 测试续期
sudo certbot renew --dry-run
```

## 🔧 配置文件说明

### nginx.conf 主要功能

1. **HTTP 到 HTTPS 重定向**：自动将 HTTP 请求重定向到 HTTPS
2. **SSL 配置**：使用 Let's Encrypt 免费证书，支持 TLS 1.2/1.3
3. **安全头部**：添加 HSTS、XSS Protection 等安全头
4. **Gzip 压缩**：压缩静态资源，减少带宽消耗
5. **静态文件缓存**：CSS、JS、图片等资源缓存 1 年
6. **API 反向代理**：将 /api/ 请求代理到后端服务器
7. **上传文件服务**：提供上传文件的访问路径
8. **健康检查**：/health 端点用于监控服务状态

### nginx.dev.conf 主要功能

1. **Vite 开发服务器代理**：支持 HMR 热更新
2. **API 代理**：代理 API 请求到本地后端
3. **简化配置**：移除 SSL 和缓存配置，方便开发调试

## ⚠️ 注意事项

1. **域名配置**：部署前必须将 `your-domain.com` 替换为实际域名
2. **证书路径**：SSL 证书路径需要与实际申请的证书路径匹配
3. **文件权限**：确保 Nginx 有权限访问项目文件和上传目录
4. **端口占用**：确保 80 和 443 端口未被其他服务占用
5. **防火墙**：确保云服务器安全组开放 80 和 443 端口

## 🆘 故障排查

### 502 Bad Gateway

```bash
# 检查后端是否运行
pm2 list

# 查看后端日志
pm2 logs qmzg-backend

# 检查端口是否监听
netstat -tlnp | grep 3000
```

### 静态文件 404

```bash
# 检查前端构建
ls -la /var/www/qmzg/app/dist/

# 检查 Nginx 配置中的 root 路径
sudo nginx -T | grep root
```

### SSL 证书错误

```bash
# 查看证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew --force-renewal

# 重启 Nginx
sudo systemctl restart nginx
```

## 📞 技术支持

如有问题，请查看：
- Nginx 官方文档：http://nginx.org/en/docs/
- Let's Encrypt 文档：https://letsencrypt.org/docs/
- PM2 文档：https://pm2.keymetrics.io/docs/
