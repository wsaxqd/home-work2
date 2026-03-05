# 生产环境部署指南

**项目**: 启蒙之光 (QMZG) V1.0
**更新时间**: 2026-02-16

---

## 📋 部署前准备

### 1. 服务器要求

**最低配置**:
- CPU: 2核
- 内存: 4GB
- 硬盘: 20GB
- 操作系统: Ubuntu 20.04+ / CentOS 7+ / Windows Server 2019+

**推荐配置**:
- CPU: 4核
- 内存: 8GB
- 硬盘: 50GB SSD
- 操作系统: Ubuntu 22.04 LTS

### 2. 软件依赖

必须安装:
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- Node.js 18+ (可选，用于本地开发)

### 3. 网络要求

- 开放端口: 80, 443, 3001
- 域名已配置DNS解析
- SSL证书已准备（推荐Let's Encrypt）

---

## 🔐 安全配置

### 1. 生成生产密钥

```bash
# 在服务器上生成新密钥
cd server

# JWT密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 数据库密码
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. 配置环境变量

编辑 `server/.env.production`:

```bash
# 复制模板
cp server/.env.production.example server/.env.production

# 编辑配置
nano server/.env.production
```

**必须配置的项**:
- `DB_PASSWORD` - 数据库密码
- `JWT_SECRET` - JWT密钥
- `JWT_REFRESH_SECRET` - JWT刷新密钥
- `DIFY_API_KEY` - Dify AI密钥
- `TENCENT_SECRET_ID` - 腾讯云ID
- `TENCENT_SECRET_KEY` - 腾讯云密钥
- `SMTP_PASSWORD` - 邮件服务密码

### 3. 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

---

## 🚀 部署步骤

### 方式1: 使用部署脚本（Windows）

```bash
# 双击运行
deploy-production.bat
```

### 方式2: 手动部署（Linux）

#### 步骤1: 克隆代码

```bash
# 克隆仓库
git clone https://github.com/your-username/qmzg.git
cd qmzg

# 切换到生产分支
git checkout main
```

#### 步骤2: 配置环境

```bash
# 复制环境配置
cp server/.env.production.example server/.env.production

# 编辑配置（填入真实密钥）
nano server/.env.production
```

#### 步骤3: 构建镜像

```bash
# 构建Docker镜像
docker-compose -f docker-compose.prod.yml build
```

#### 步骤4: 启动服务

```bash
# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

#### 步骤5: 执行数据库迁移

```bash
# 进入应用容器
docker exec -it qmzg_app_prod sh

# 执行迁移
npm run migrate

# 退出容器
exit
```

#### 步骤6: 验证部署

```bash
# 检查服务健康状态
curl http://localhost:3001/health

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🔍 健康检查

### 1. 服务状态检查

```bash
# 检查所有容器
docker-compose -f docker-compose.prod.yml ps

# 检查应用健康
curl http://localhost:3001/health

# 检查数据库连接
docker exec qmzg_postgres_prod pg_isready -U qmzg_admin
```

### 2. 日志检查

```bash
# 查看应用日志
docker-compose -f docker-compose.prod.yml logs app

# 查看数据库日志
docker-compose -f docker-compose.prod.yml logs postgres

# 查看Redis日志
docker-compose -f docker-compose.prod.yml logs redis
```

### 3. 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

---

## 🔄 更新部署

### 1. 零停机更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose -f docker-compose.prod.yml build

# 滚动更新
docker-compose -f docker-compose.prod.yml up -d --no-deps --build app
```

### 2. 数据库迁移

```bash
# 备份数据库
docker exec qmzg_postgres_prod pg_dump -U qmzg_admin qmzg_production > backup.sql

# 执行新迁移
docker exec qmzg_app_prod npm run migrate
```

---

## 🗄️ 备份策略

### 1. 数据库备份

**自动备份脚本**:

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/qmzg"
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec qmzg_postgres_prod pg_dump -U qmzg_admin qmzg_production | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 保留最近30天的备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

**设置定时任务**:

```bash
# 编辑crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /path/to/backup-db.sh
```

### 2. 文件备份

```bash
# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz server/uploads/

# 备份日志
tar -czf logs_backup_$(date +%Y%m%d).tar.gz server/logs/
```

---

## 🔧 故障排查

### 问题1: 容器无法启动

**检查步骤**:
```bash
# 查看容器日志
docker-compose -f docker-compose.prod.yml logs

# 检查端口占用
netstat -tulpn | grep :3001

# 检查磁盘空间
df -h
```

### 问题2: 数据库连接失败

**检查步骤**:
```bash
# 检查数据库容器
docker-compose -f docker-compose.prod.yml ps postgres

# 测试数据库连接
docker exec qmzg_postgres_prod psql -U qmzg_admin -d qmzg_production -c "SELECT 1"

# 检查环境变量
docker exec qmzg_app_prod env | grep DB_
```

### 问题3: 性能问题

**优化步骤**:
```bash
# 检查资源使用
docker stats

# 优化数据库
docker exec qmzg_postgres_prod psql -U qmzg_admin -d qmzg_production -c "VACUUM ANALYZE"

# 清理Docker缓存
docker system prune -a
```

---

## 📊 监控告警

### 1. 配置监控

推荐使用:
- **Prometheus + Grafana** - 性能监控
- **Sentry** - 错误追踪
- **ELK Stack** - 日志聚合

### 2. 告警规则

建议配置告警:
- CPU使用率 > 80%
- 内存使用率 > 85%
- 磁盘使用率 > 90%
- 应用响应时间 > 2秒
- 错误率 > 1%

---

## 🔒 安全加固

### 1. 系统安全

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置自动安全更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2. Docker安全

```bash
# 限制容器资源
# 在docker-compose.prod.yml中配置:
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
```

### 3. 网络安全

```bash
# 配置SSL证书（使用Let's Encrypt）
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# 配置Nginx反向代理
sudo apt install nginx
# 配置SSL和反向代理
```

---

## 📞 支持联系

如遇问题:
1. 查看日志: `docker-compose -f docker-compose.prod.yml logs`
2. 查看文档: `docs/`目录
3. 提交Issue: GitHub Issues

---

**文档版本**: 1.0
**最后更新**: 2026-02-16
