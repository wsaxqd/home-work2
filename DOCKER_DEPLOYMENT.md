# Docker Compose 生产环境部署指南

## 📋 目录
- [关于 Docker 镜像](#关于-docker-镜像)
- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [常见问题](#常见问题)
- [维护操作](#维护操作)

---

## 🎯 关于 Docker 镜像

### ✅ 镜像来源说明

**重要**：本项目使用的所有 Docker 镜像都来自 **Docker Hub 公共镜像仓库**，完全免费，不需要腾讯云账号！

| 镜像名称 | 来源 | 说明 |
|---------|------|------|
| `postgres:15-alpine` | Docker Hub 官方 | PostgreSQL 数据库 |
| `node:18-alpine` | Docker Hub 官方 | Node.js 运行环境 |
| `nginx:1.25-alpine` | Docker Hub 官方 | Nginx Web 服务器 |

**下载方式**：
```bash
# Docker 会自动从 Docker Hub 下载镜像
docker pull postgres:15-alpine
docker pull node:18-alpine
docker pull nginx:1.25-alpine

# 国内用户可以配置镜像加速（可选）
# 阿里云镜像：https://help.aliyun.com/document_detail/60750.html
# 腾讯云镜像：https://cloud.tencent.com/document/product/1207/45596
```

### 🌍 Docker Hub 镜像加速（可选）

如果下载速度慢，可以配置国内镜像加速：

**方法1：阿里云镜像加速**
```bash
# 编辑 Docker 配置
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://registry.cn-hangzhou.aliyuncs.com"
  ]
}
EOF

# 重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

**方法2：使用多个镜像源**
```json
{
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "http://hub-mirror.c.163.com",
    "https://mirror.ccs.tencentyun.com"
  ]
}
```

---

## 💻 系统要求

### 最低配置
- **CPU**: 2核
- **内存**: 4GB
- **硬盘**: 20GB
- **系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+

### 推荐配置
- **CPU**: 4核
- **内存**: 8GB
- **硬盘**: 50GB SSD
- **系统**: Ubuntu 22.04 LTS

### 必需软件
- Docker 20.10+
- Docker Compose 2.0+

---

## 🚀 快速开始

### 1. 安装 Docker（如果未安装）

**Ubuntu/Debian**:
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sudo sh

# 启动 Docker
sudo systemctl enable docker
sudo systemctl start docker

# 验证安装
docker --version
docker-compose --version

# 添加当前用户到 docker 组（可选，避免每次 sudo）
sudo usermod -aG docker $USER
# 重新登录生效
```

**CentOS**:
```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. 克隆项目（或上传到服务器）

```bash
# 方法1：从 Git 克隆
git clone https://github.com/your-repo/qmzg.git
cd qmzg

# 方法2：使用 scp 上传
scp -r ./qmzg root@your-server:/opt/
ssh root@your-server
cd /opt/qmzg
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.production

# 编辑配置文件
nano .env.production
```

**必须配置的项目**：
```env
# 数据库密码
DB_PASSWORD=your_strong_password_123

# JWT 密钥（使用以下命令生成）
JWT_SECRET=生成的64位随机字符串
JWT_REFRESH_SECRET=生成的64位随机字符串

# 域名
DOMAIN=your-domain.com
CORS_ORIGIN=https://your-domain.com
```

**生成随机密钥**：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 准备目录和证书

```bash
# 创建数据目录
mkdir -p data/postgres data/uploads logs/nginx logs/server ssl backups

# 如果有 SSL 证书，复制到 ssl 目录
cp your-fullchain.pem ssl/fullchain.pem
cp your-privkey.pem ssl/privkey.pem
cp your-chain.pem ssl/chain.pem

# 如果没有证书，可以先使用 HTTP（后面可以配置 Let's Encrypt）
```

### 5. 启动服务

```bash
# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d --build

# 查看启动日志
docker-compose -f docker-compose.prod.yml logs -f

# 等待所有服务健康检查通过（约1-2分钟）
docker-compose -f docker-compose.prod.yml ps
```

### 6. 执行数据库迁移

```bash
# 进入后端容器执行迁移
docker-compose -f docker-compose.prod.yml exec server npm run migrate

# 查看迁移结果
docker-compose -f docker-compose.prod.yml exec server npm run migrate:status
```

### 7. 访问应用

```
HTTP:  http://your-domain.com
HTTPS: https://your-domain.com
API:   https://your-domain.com/api/health
```

---

## 📝 详细部署步骤

### 步骤 1: 环境准备

#### 1.1 服务器准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git vim ufw

# 配置防火墙
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

#### 1.2 配置域名解析

在域名服务商（如阿里云、腾讯云）添加 DNS 记录：
```
类型    主机记录    记录值
A       @          your-server-ip
A       www        your-server-ip
```

### 步骤 2: 项目配置

#### 2.1 环境变量配置

编辑 `.env.production`：

```env
# ==================== 基础配置 ====================
VERSION=1.0.0
DOMAIN=example.com
HTTP_PORT=80
HTTPS_PORT=443
SSL_CERT_PATH=./ssl
DATA_PATH=./data

# ==================== 数据库配置 ====================
DB_NAME=qmzg_prod
DB_USER=qmzg_admin
DB_PASSWORD=YourStrongPassword123!@#

# ==================== JWT 配置 ====================
JWT_SECRET=生成的64位随机字符串
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=另一个生成的64位随机字符串
JWT_REFRESH_EXPIRES_IN=30d

# ==================== CORS 配置 ====================
CORS_ORIGIN=https://example.com

# ==================== AI 服务配置（至少配置一个） ====================
# Dify AI
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your-dify-api-key
DIFY_CHAT_APP_KEY=app-xxx

# DeepSeek AI（推荐，成本低）
DEEPSEEK_API_KEY=your-deepseek-api-key

# 智谱 AI
ZHIPU_API_KEY=your-zhipu-api-key

# ==================== 可选配置 ====================
# 腾讯云 OCR（如果没有账号可以不配置）
TENCENT_SECRET_ID=
TENCENT_SECRET_KEY=
TENCENT_OCR_REGION=ap-beijing

# 邮件服务（可以后期配置）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=启蒙之光 <your-email@qq.com>
```

#### 2.2 Nginx 配置检查

确认 `nginx/nginx.conf` 中的域名和路径：

```nginx
server_name example.com www.example.com;  # 改为您的域名

root /var/www/my-app/app/dist;            # 检查路径
alias /var/www/my-app/server/uploads/;    # 检查路径
```

### 步骤 3: SSL 证书配置（HTTPS）

#### 方法1：使用 Let's Encrypt（免费，推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot

# 先启动 HTTP 服务
docker-compose -f docker-compose.prod.yml up -d nginx

# 申请证书
sudo certbot certonly --webroot \
  -w ./data/certbot \
  -d example.com \
  -d www.example.com \
  --email your-email@example.com \
  --agree-tos

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/example.com/privkey.pem ssl/
sudo cp /etc/letsencrypt/live/example.com/chain.pem ssl/

# 重启 Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

#### 方法2：使用自己的证书

```bash
# 复制证书文件
cp your-certificate.crt ssl/fullchain.pem
cp your-private.key ssl/privkey.pem
cp your-ca-bundle.crt ssl/chain.pem

# 设置权限
chmod 600 ssl/*.pem
```

#### 方法3：暂时使用 HTTP（开发测试）

如果暂时不需要 HTTPS，可以注释掉 `nginx/nginx.conf` 中的 HTTPS 部分。

### 步骤 4: 启动服务

#### 4.1 构建镜像

```bash
# 构建所有服务的镜像
docker-compose -f docker-compose.prod.yml build

# 或者指定构建某个服务
docker-compose -f docker-compose.prod.yml build server
docker-compose -f docker-compose.prod.yml build nginx
```

#### 4.2 启动服务

```bash
# 后台启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看单个服务日志
docker-compose -f docker-compose.prod.yml logs -f server
docker-compose -f docker-compose.prod.yml logs -f nginx
```

#### 4.3 健康检查

```bash
# 等待所有服务健康
watch docker-compose -f docker-compose.prod.yml ps

# 测试后端健康
curl http://localhost/api/health

# 测试前端访问
curl -I http://localhost/
```

### 步骤 5: 数据库初始化

```bash
# 执行数据库迁移
docker-compose -f docker-compose.prod.yml exec server npm run migrate

# 查看迁移状态
docker-compose -f docker-compose.prod.yml exec server npm run migrate:status

# 如果需要，可以运行种子数据
docker-compose -f docker-compose.prod.yml exec server npm run seed
```

### 步骤 6: 验证部署

#### 6.1 检查服务状态

```bash
# 查看所有容器
docker ps

# 查看资源使用
docker stats

# 查看网络
docker network ls
docker network inspect qmzg-frontend
```

#### 6.2 测试功能

```bash
# 测试 API
curl https://example.com/api/health

# 测试前端
curl -I https://example.com/

# 测试上传文件访问
curl -I https://example.com/uploads/test.jpg

# 查看 Nginx 日志
tail -f logs/nginx/access.log
tail -f logs/nginx/error.log
```

---

## 🔧 常见问题

### Q1: Docker 镜像下载很慢或失败

**问题**：`docker pull` 下载镜像速度很慢

**解决**：配置国内镜像加速（见上面的"Docker Hub 镜像加速"部分）

---

### Q2: 提示"没有腾讯云账号"会影响功能吗？

**答案**：**不会影响核心功能！**

腾讯云配置只用于以下**可选**功能：
- ✅ OCR 文字识别（拍照搜题功能）

如果不配置腾讯云，影响：
- ❌ 拍照搜题的 OCR 识别功能不可用

**不受影响的功能**：
- ✅ AI 对话（使用 Dify/DeepSeek/智谱）
- ✅ 学习计划、技能树
- ✅ 错题本、学习路径
- ✅ 用户系统、社区功能
- ✅ 所有其他功能

**替代方案**：
1. 使用其他 OCR 服务（如百度 OCR、阿里云 OCR）
2. 暂时不使用拍照搜题功能
3. 后期有需要再申请腾讯云账号

---

### Q3: 容器启动失败

**问题**：`docker-compose up -d` 后容器退出

**排查步骤**：
```bash
# 1. 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 2. 查看失败容器的日志
docker-compose -f docker-compose.prod.yml logs server
docker-compose -f docker-compose.prod.yml logs postgres

# 3. 常见原因：
# - 端口被占用
# - 环境变量未配置
# - 数据库连接失败
# - 磁盘空间不足
```

**解决**：
```bash
# 检查端口占用
netstat -tlnp | grep 80
netstat -tlnp | grep 443
netstat -tlnp | grep 5432

# 检查环境变量
docker-compose -f docker-compose.prod.yml config

# 检查磁盘空间
df -h
```

---

### Q4: 数据库连接失败

**问题**：后端日志显示"无法连接到数据库"

**解决**：
```bash
# 1. 确认 PostgreSQL 容器正常运行
docker-compose -f docker-compose.prod.yml ps postgres

# 2. 查看 PostgreSQL 日志
docker-compose -f docker-compose.prod.yml logs postgres

# 3. 测试数据库连接
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U qmzg_admin -d qmzg_prod -c "SELECT 1"

# 4. 检查密码是否正确（.env.production）
grep DB_PASSWORD .env.production
```

---

### Q5: Nginx 502 Bad Gateway

**问题**：访问网站显示 502 错误

**原因**：Nginx 无法连接到后端服务

**解决**：
```bash
# 1. 确认后端服务正常
docker-compose -f docker-compose.prod.yml ps server
docker-compose -f docker-compose.prod.yml logs server

# 2. 测试后端健康检查
docker-compose -f docker-compose.prod.yml exec server curl http://localhost:3000/health

# 3. 检查网络连接
docker-compose -f docker-compose.prod.yml exec nginx ping server

# 4. 重启服务
docker-compose -f docker-compose.prod.yml restart server nginx
```

---

### Q6: 前端页面空白或 404

**问题**：访问网站显示空白页面或 404

**解决**：
```bash
# 1. 检查前端构建是否成功
docker-compose -f docker-compose.prod.yml logs frontend-builder

# 2. 检查构建产物
docker-compose -f docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html

# 3. 重新构建前端
docker-compose -f docker-compose.prod.yml up -d --build frontend-builder

# 4. 检查 Nginx 配置
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

---

## 🛠️ 维护操作

### 日常维护

#### 查看日志
```bash
# 实时查看所有日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f server
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f postgres

# 查看最近100行日志
docker-compose -f docker-compose.prod.yml logs --tail=100 server
```

#### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启单个服务
docker-compose -f docker-compose.prod.yml restart server
docker-compose -f docker-compose.prod.yml restart nginx

# 重新加载 Nginx 配置（不中断服务）
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

#### 资源监控
```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h
du -sh data/postgres
du -sh data/uploads

# 查看 Docker 磁盘使用
docker system df
```

### 数据库操作

#### 备份数据库
```bash
# 手动备份
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U qmzg_admin qmzg_prod > backup-$(date +%Y%m%d-%H%M%S).sql

# 使用脚本自动备份（建议每天执行）
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=./backups
mkdir -p $BACKUP_DIR
FILENAME=qmzg-backup-$(date +%Y%m%d-%H%M%S).sql
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U qmzg_admin qmzg_prod > $BACKUP_DIR/$FILENAME
gzip $BACKUP_DIR/$FILENAME
# 删除30天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
echo "备份完成: $FILENAME.gz"
EOF

chmod +x backup-db.sh

# 添加到 crontab（每天凌晨2点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/qmzg/backup-db.sh") | crontab -
```

#### 恢复数据库
```bash
# 从备份恢复
gunzip backup-20260128-020000.sql.gz
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U qmzg_admin qmzg_prod < backup-20260128-020000.sql
```

#### 数据库迁移
```bash
# 查看迁移状态
docker-compose -f docker-compose.prod.yml exec server npm run migrate:status

# 执行迁移
docker-compose -f docker-compose.prod.yml exec server npm run migrate

# 回滚迁移
docker-compose -f docker-compose.prod.yml exec server npm run migrate:rollback
```

### 更新应用

#### 零停机更新
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建镜像
docker-compose -f docker-compose.prod.yml build

# 3. 更新服务（零停机）
docker-compose -f docker-compose.prod.yml up -d --no-deps --build server

# 4. 执行数据库迁移（如果有）
docker-compose -f docker-compose.prod.yml exec server npm run migrate

# 5. 更新 Nginx（重新加载配置）
docker-compose -f docker-compose.prod.yml up -d --no-deps nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 清理操作

#### 清理 Docker 资源
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的数据卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a --volumes
```

#### 清理应用日志
```bash
# 清理 Nginx 日志
truncate -s 0 logs/nginx/access.log
truncate -s 0 logs/nginx/error.log

# 清理 Docker 容器日志
docker-compose -f docker-compose.prod.yml logs --no-log-prefix > /dev/null
```

### 扩展服务

#### 水平扩展后端（负载均衡）
```bash
# 扩展到3个后端实例
docker-compose -f docker-compose.prod.yml up -d --scale server=3

# 检查扩展结果
docker-compose -f docker-compose.prod.yml ps server
```

---

## 📊 性能优化

### 数据库优化
```sql
-- 进入 PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U qmzg_admin qmzg_prod

-- 查看慢查询
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 添加索引（示例）
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_works_user_id ON works(user_id);
```

### Nginx 性能监控
```bash
# 查看 Nginx 状态
curl http://localhost/nginx_status

# 查看并发连接数
docker-compose -f docker-compose.prod.yml exec nginx \
  sh -c 'ps aux | grep nginx | wc -l'
```

---

## 🔐 安全加固

### 1. 限制 SSH 访问
```bash
# 编辑 SSH 配置
sudo nano /etc/ssh/sshd_config

# 修改以下配置
PermitRootLogin no
PasswordAuthentication no
Port 2222  # 改为非标准端口

# 重启 SSH
sudo systemctl restart sshd
```

### 2. 配置 Fail2ban
```bash
# 安装 Fail2ban
sudo apt install -y fail2ban

# 配置规则
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# 启动 Fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. 定期更新
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新 Docker
sudo apt install --only-upgrade docker-ce docker-ce-cli containerd.io
```

---

## 📞 获取帮助

如遇到问题：

1. 查看日志：`docker-compose -f docker-compose.prod.yml logs -f`
2. 查看健康状态：`docker-compose -f docker-compose.prod.yml ps`
3. 检查配置：`docker-compose -f docker-compose.prod.yml config`
4. 参考官方文档：
   - Docker: https://docs.docker.com/
   - Nginx: http://nginx.org/en/docs/
   - PostgreSQL: https://www.postgresql.org/docs/

---

**部署完成！祝您使用愉快！** 🎉
