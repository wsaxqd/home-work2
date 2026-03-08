# 启蒙之光 - 生产环境部署指南

## 📋 部署前准备

### 系统要求
- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Nginx (推荐)
- 至少 2GB RAM
- 至少 20GB 磁盘空间

### 必需服务
- Dify AI 平台（或其他 AI 服务）
- SMTP 邮件服务（可选）
- 对象存储服务（可选，用于文件上传）

## 🔧 环境配置

### 1. 数据库配置

创建生产数据库：
```bash
psql -U postgres
CREATE DATABASE qmzg_prod;
CREATE USER qmzg_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE qmzg_prod TO qmzg_user;
\q
```

### 2. 环境变量配置

复制并配置生产环境变量：
```bash
cp server/.env.example server/.env.production
```

编辑 `server/.env.production`：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qmzg_prod
DB_USER=qmzg_user
DB_PASSWORD=your_secure_password

# JWT 配置（使用强密钥）
JWT_SECRET=your_production_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_production_refresh_secret_min_32_chars

# Dify AI 配置
DIFY_API_URL=https://your-dify-instance.com/v1
DIFY_CHAT_APP_KEY=app-xxx
DIFY_STORY_APP_KEY=app-xxx
DIFY_EMOTION_APP_KEY=app-xxx
DIFY_TUTORING_APP_KEY=app-xxx
DIFY_TUTORING_EVALUATE_APP_KEY=app-xxx
DIFY_TUTORING_SUMMARY_APP_KEY=app-xxx

# 服务器配置
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com

# Sentry 监控（可选）
SENTRY_DSN=your_sentry_dsn

# Redis 配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## 🚀 部署步骤

### 1. 克隆代码
```bash
git clone https://github.com/wsaxqd/home-work2.git
cd home-work2
```

### 2. 安装依赖
```bash
# 后端
cd server
npm install --production
cd ..

# 前端
cd app
npm install
```

### 3. 构建项目
```bash
# 构建后端
cd server
npm run build

# 构建前端
cd ../app
npm run build
```

### 4. 运行数据库迁移
```bash
cd server
NODE_ENV=production npm run migrate
```

### 5. 启动服务

使用 PM2（推荐）：
```bash
# 安装 PM2
npm install -g pm2

# 启动后端
cd server
pm2 start dist/index.js --name qmzg-api

# 保存 PM2 配置
pm2 save
pm2 startup
```

## 🌐 Nginx 配置

创建 Nginx 配置文件 `/etc/nginx/sites-available/qmzg`：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端静态文件
    location / {
        root /path/to/qmzg/app/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket 支持
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 上传文件
    location /uploads {
        proxy_pass http://localhost:3000;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/qmzg /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL 配置（推荐）

使用 Let's Encrypt：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📊 监控与日志

### PM2 监控
```bash
pm2 monit
pm2 logs qmzg-api
```

### 日志位置
- 应用日志：`server/logs/`
- Nginx 日志：`/var/log/nginx/`

## 🔄 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建
cd server && npm run build
cd ../app && npm run build

# 重启服务
pm2 restart qmzg-api
```

## 🛡️ 安全建议

1. 使用强密码和密钥
2. 启用 HTTPS
3. 配置防火墙规则
4. 定期备份数据库
5. 启用 Sentry 错误监控
6. 限制 API 访问频率
7. 定期更新依赖包

## 💾 数据库备份

自动备份脚本：
```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U qmzg_user qmzg_prod > $BACKUP_DIR/qmzg_$DATE.sql
find $BACKUP_DIR -name "qmzg_*.sql" -mtime +7 -delete
```

## 🐳 Docker 部署（可选）

参考项目中的 `docker-compose.yml` 文件。

## 📞 故障排查

### 服务无法启动
- 检查端口占用：`lsof -i :3000`
- 查看日志：`pm2 logs qmzg-api`
- 检查环境变量配置

### 数据库连接失败
- 验证数据库凭据
- 检查 PostgreSQL 服务状态
- 确认防火墙规则

### 前端无法访问 API
- 检查 CORS 配置
- 验证 Nginx 代理配置
- 查看浏览器控制台错误

## 📧 技术支持

遇到问题请提交 Issue：https://github.com/wsaxqd/home-work2/issues
