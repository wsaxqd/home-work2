# Docker 生产环境部署 - 项目结构总结

## 📁 已创建的文件清单

### 核心配置文件

```
qmzg/
├── docker-compose.prod.yml          ✅ 生产环境 Docker Compose 配置
├── .env.example                     ✅ 环境变量模板
├── deploy.sh                        ✅ 一键部署脚本
├── DOCKER_DEPLOYMENT.md             ✅ 详细部署文档
│
├── nginx/
│   ├── nginx.conf                   ✅ Nginx 站点配置（已优化）
│   ├── nginx-main.conf              ✅ Nginx 主配置
│   ├── nginx.dev.conf               ✅ 开发环境配置
│   ├── Dockerfile.nginx             ✅ Nginx 容器配置
│   ├── OPTIMIZATION_REPORT.md       ✅ 配置优化报告
│   ├── ERROR_CHECK_REPORT.md        ✅ 错误检查报告
│   ├── BROWSER_CACHE_GUIDE.md       ✅ 浏览器缓存指南
│   └── README.md                    ✅ Nginx 使用指南
│
├── server/
│   └── Dockerfile                   ✅ 后端容器配置（已存在）
│
└── app/
    └── Dockerfile                   ✅ 前端容器配置（已存在）
```

---

## 🎯 Docker Compose 架构说明

### 服务组成

```yaml
services:
  ┌─────────────────────────────────────────────────┐
  │  postgres                                       │
  │  ├─ 数据库：PostgreSQL 15-alpine               │
  │  ├─ 端口：5432（仅内部）                        │
  │  ├─ 数据卷：postgres-data                       │
  │  └─ 健康检查：pg_isready                        │
  └─────────────────────────────────────────────────┘
            ↓ (backend network)
  ┌─────────────────────────────────────────────────┐
  │  server                                         │
  │  ├─ 后端：Node.js 18 + Express                 │
  │  ├─ 端口：3000（仅内部）                        │
  │  ├─ 数据卷：uploads-data                        │
  │  └─ 健康检查：/health 端点                      │
  └─────────────────────────────────────────────────┘
            ↓ (frontend network)
  ┌─────────────────────────────────────────────────┐
  │  frontend-builder                               │
  │  ├─ 构建：Vite + React                          │
  │  ├─ 输出：frontend-dist 数据卷                  │
  │  └─ 一次性任务：构建后自动退出                   │
  └─────────────────────────────────────────────────┘
            ↓ (shared volume)
  ┌─────────────────────────────────────────────────┐
  │  nginx                                          │
  │  ├─ Web服务器：Nginx 1.25-alpine                │
  │  ├─ 端口：80, 443（对外）                       │
  │  ├─ 功能：反向代理 + 静态文件服务               │
  │  └─ SSL：支持 Let's Encrypt                     │
  └─────────────────────────────────────────────────┘
            ↓
     [互联网访问]
```

### 网络隔离

```
┌─────────────────────────────────────┐
│  frontend network (172.20.0.0/16)  │
│  ├─ nginx                           │
│  ├─ server                          │
│  └─ frontend-builder                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  backend network (172.21.0.0/16)   │
│  ├─ server                          │
│  └─ postgres                        │
└─────────────────────────────────────┘
```

### 数据持久化

```
数据卷挂载：
├── postgres-data    → ./data/postgres     (数据库数据)
├── uploads-data     → ./data/uploads      (用户上传文件)
├── frontend-dist    → (Docker 命名卷)      (前端构建产物)
├── logs/nginx       → (主机目录)           (Nginx 日志)
└── logs/server      → (主机目录)           (后端日志)
```

---

## 🚀 快速部署流程

### 方法1：使用一键部署脚本（推荐）

```bash
# 1. 进入项目目录
cd qmzg

# 2. 给脚本执行权限
chmod +x deploy.sh

# 3. 运行部署脚本
./deploy.sh

# 脚本会自动：
# ✅ 检查系统要求
# ✅ 检查环境变量
# ✅ 创建必要目录
# ✅ 构建镜像
# ✅ 启动服务
# ✅ 执行数据库迁移
```

### 方法2：手动部署

```bash
# 1. 配置环境变量
cp .env.example .env.production
nano .env.production

# 2. 创建目录
mkdir -p data/{postgres,uploads} logs/{nginx,server} ssl backups

# 3. 构建镜像
docker-compose -f docker-compose.prod.yml build

# 4. 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 5. 执行迁移
docker-compose -f docker-compose.prod.yml exec server npm run migrate
```

---

## ⚙️ 环境变量配置

### 必须配置的变量（🔴 必填）

```env
# 数据库
DB_PASSWORD=强密码123456                 # 🔴 必填

# JWT 密钥（使用随机字符串）
JWT_SECRET=64位随机字符串                # 🔴 必填
JWT_REFRESH_SECRET=另一个64位随机字符串   # 🔴 必填

# 域名
DOMAIN=example.com                      # 🔴 必填
CORS_ORIGIN=https://example.com         # 🔴 必填
```

### 建议配置的变量（🟡 推荐）

```env
# AI 服务（至少配置一个）
DIFY_API_KEY=xxx                        # 🟡 推荐
DEEPSEEK_API_KEY=xxx                    # 🟡 推荐
ZHIPU_API_KEY=xxx                       # 🟡 推荐

# 邮件服务
SMTP_HOST=smtp.qq.com                   # 🟡 推荐
SMTP_USER=your@email.com                # 🟡 推荐
SMTP_PASSWORD=授权码                     # 🟡 推荐
```

### 可选配置的变量（⚪ 可选）

```env
# 腾讯云 OCR（没有账号可以不配置）
TENCENT_SECRET_ID=                      # ⚪ 可选
TENCENT_SECRET_KEY=                     # ⚪ 可选
```

---

## 🔍 配置检查清单

### 部署前检查

- [ ] Docker 和 Docker Compose 已安装
- [ ] `.env.production` 文件已配置
- [ ] 必需的环境变量已填写（DB_PASSWORD, JWT_SECRET等）
- [ ] 域名 DNS 已解析到服务器 IP
- [ ] 防火墙已开放 80 和 443 端口
- [ ] 目录权限正确

### SSL 证书检查

- [ ] **方案1（推荐）**: 使用 Let's Encrypt 免费证书
  ```bash
  sudo certbot certonly --webroot -w ./data/certbot -d example.com
  ```

- [ ] **方案2**: 使用已有证书
  ```bash
  cp your-cert.pem ssl/fullchain.pem
  cp your-key.pem ssl/privkey.pem
  ```

- [ ] **方案3**: 暂时使用 HTTP（测试环境）

### 部署后验证

- [ ] 所有容器状态为 `healthy`
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```

- [ ] 可以访问前端页面
  ```bash
  curl -I https://example.com
  ```

- [ ] API 健康检查通过
  ```bash
  curl https://example.com/api/health
  ```

- [ ] 数据库迁移成功
  ```bash
  docker-compose -f docker-compose.prod.yml exec server npm run migrate:status
  ```

---

## 📊 资源使用估算

### 最低配置（可运行）

| 服务 | CPU | 内存 |
|------|-----|------|
| PostgreSQL | 0.5核 | 512MB |
| 后端 Server | 0.25核 | 256MB |
| Nginx | 0.1核 | 64MB |
| **总计** | **1核** | **1GB** |

### 推荐配置（流畅）

| 服务 | CPU | 内存 |
|------|-----|------|
| PostgreSQL | 1核 | 1GB |
| 后端 Server | 1核 | 512MB |
| Nginx | 0.5核 | 128MB |
| **总计** | **2.5核** | **2GB** |

### 生产环境（高性能）

| 服务 | CPU | 内存 |
|------|-----|------|
| PostgreSQL | 2核 | 2GB |
| 后端 Server | 2核 | 1GB |
| Nginx | 1核 | 256MB |
| **总计** | **5核** | **3.5GB** |

---

## 🎓 关键要点回答

### Q: Docker 镜像需要从腾讯云下载吗？

**A: 不需要！** ✅

所有 Docker 镜像都来自 **Docker Hub 公共仓库**，完全免费：
- `postgres:15-alpine` ← Docker Hub 官方镜像
- `node:18-alpine` ← Docker Hub 官方镜像
- `nginx:1.25-alpine` ← Docker Hub 官方镜像

### Q: 没有腾讯云账号会影响功能吗？

**A: 只影响 OCR 功能！** ⚠️

- ✅ **不受影响**：AI对话、学习系统、用户管理等所有核心功能
- ❌ **受影响**：拍照搜题的 OCR 识别功能

**替代方案**：
1. 使用其他 OCR 服务（百度 OCR、阿里云 OCR）
2. 暂时不使用拍照搜题功能
3. 后期有需要再申请腾讯云账号

### Q: 如何生成 JWT 密钥？

**A: 使用以下命令** 💡

```bash
# 方法1：使用 Node.js（推荐）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法2：使用 OpenSSL
openssl rand -hex 32

# 方法3：在线工具
# https://www.random.org/strings/
```

### Q: 部署需要多长时间？

**A: 首次部署约 10-15 分钟** ⏱️

- 下载镜像：5-8分钟
- 构建镜像：3-5分钟
- 启动服务：1-2分钟

---

## 📝 常用命令速查

```bash
# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 进入容器
docker-compose -f docker-compose.prod.yml exec server sh

# 数据库备份
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U qmzg_admin qmzg_prod > backup.sql

# 更新服务
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🎉 完成状态

### ✅ 已完成的工作

1. **Docker Compose 生产环境配置** (`docker-compose.prod.yml`)
   - PostgreSQL 数据库服务
   - Node.js 后端服务
   - Nginx 反向代理
   - 前端构建器
   - 网络隔离配置
   - 数据持久化配置

2. **Nginx 优化配置** (`nginx/`)
   - 生产环境配置 (`nginx.conf`)
   - 开发环境配置 (`nginx.dev.conf`)
   - Nginx 主配置 (`nginx-main.conf`)
   - Nginx Dockerfile (`Dockerfile.nginx`)

3. **完整文档**
   - 部署指南 (`DOCKER_DEPLOYMENT.md`)
   - 配置优化报告 (`nginx/OPTIMIZATION_REPORT.md`)
   - 错误检查报告 (`nginx/ERROR_CHECK_REPORT.md`)
   - 浏览器缓存指南 (`nginx/BROWSER_CACHE_GUIDE.md`)

4. **部署工具**
   - 一键部署脚本 (`deploy.sh`)
   - 环境变量模板 (`.env.example`)

### 📦 交付清单

所有文件已创建并配置完成，可以直接用于生产环境部署！

---

**准备就绪，随时可以部署！** 🚀
