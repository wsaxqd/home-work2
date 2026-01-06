# Docker 部署指南 - 启蒙之光项目

本文档详细说明如何使用 Docker 部署启蒙之光（qmzg）项目。

---

## 📋 目录

- [文件说明](#文件说明)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [常用命令](#常用命令)
- [优化特性](#优化特性)
- [故障排查](#故障排查)

---

## 📁 文件说明

### Docker 配置文件

| 文件 | 说明 |
|------|------|
| `.dockerignore` | 排除无用文件，减小镜像体积 |
| `server/Dockerfile` | 后端服务多阶段构建文件 |
| `app/Dockerfile` | 前端应用多阶段构建文件 |
| `docker-compose.dev.yml` | 开发环境编排配置（支持热重载） |
| `docker-compose.yml` | 生产环境编排配置（优化性能） |
| `nginx-proxy.conf` | Nginx 反向代理配置 |
| `.env.production.example` | 生产环境变量示例 |

---

## 🛠️ 开发环境部署

### 1. 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0
- 8GB+ 可用内存

### 2. 启动开发环境

```bash
# 进入项目目录
cd qmzg

# 启动所有服务（后台运行）
docker-compose -f docker-compose.dev.yml up -d --build

# 查看日志（实时）
docker-compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.dev.yml logs -f server
```

### 3. 访问服务

| 服务 | 地址 | 说明 |
|------|------|------|
| React 前端 | http://localhost:5173 | Vite 开发服务器（热重载） |
| 后端 API | http://localhost:3000 | Express 服务器（热重载） |
| 静态 HTML | http://localhost:8080 | Nginx 静态文件服务 |
| PostgreSQL | localhost:5432 | 数据库（用户: admin, 密码: password123） |

### 4. 停止服务

```bash
# 停止所有服务
docker-compose -f docker-compose.dev.yml down

# 停止并删除数据卷（清空数据库）
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🚀 生产环境部署

### 1. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.production.example .env

# 编辑 .env 文件，填写真实配置
vim .env
```

**必填配置项：**

```env
# 数据库密码（强密码，>= 16 字符）
DB_PASSWORD=your-strong-password

# JWT 密钥（使用 openssl rand -base64 64 生成）
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Dify AI 服务配置
DIFY_API_URL=http://your-dify-server/v1
DIFY_CHAT_APP_KEY=app-xxx
```

### 2. 构建并启动

```bash
# 构建镜像并启动服务
docker-compose up -d --build

# 查看启动状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 初始化数据库

```bash
# 进入后端容器
docker exec -it qmzg-server sh

# 运行数据库迁移
npm run migrate

# 退出容器
exit
```

### 4. 访问应用

- **应用地址**: http://your-domain
- **API 端点**: http://your-domain/api

### 5. 配置域名和 HTTPS（可选）

#### 方式 1：使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo systemctl enable certbot.timer
```

#### 方式 2：使用自签名证书（测试用）

```bash
# 生成证书
mkdir ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# 取消 docker-compose.yml 中 HTTPS 配置的注释
```

---

## 🎮 常用命令

### 容器管理

```bash
# 查看运行中的容器
docker-compose ps

# 重启服务
docker-compose restart

# 重启单个服务
docker-compose restart server

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 删除所有容器（保留数据）
docker-compose down

# 删除所有容器和数据
docker-compose down -v
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 实时跟踪日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100

# 查看特定服务日志
docker-compose logs server
```

### 进入容器

```bash
# 进入后端容器
docker exec -it qmzg-server sh

# 进入数据库容器
docker exec -it qmzg-postgres sh

# 在容器中执行命令
docker exec qmzg-server npm run migrate
```

### 数据库操作

```bash
# 数据库备份
docker exec qmzg-postgres pg_dump -U admin qmzg > backup.sql

# 数据库恢复
docker exec -i qmzg-postgres psql -U admin qmzg < backup.sql

# 连接数据库
docker exec -it qmzg-postgres psql -U admin -d qmzg
```

### 资源监控

```bash
# 查看容器资源占用
docker stats

# 查看磁盘占用
docker system df

# 清理未使用的资源
docker system prune -a
```

---

## ⚡ 优化特性

### 1. 多阶段构建

- **依赖层缓存**：只要 `package.json` 不变，依赖层就会被缓存
- **构建层分离**：编译和运行环境分离，减小最终镜像体积
- **生产优化**：生产镜像只包含必要文件（无源码、无 devDependencies）

### 2. 镜像体积优化

| 组件 | 开发镜像 | 生产镜像 | 优化率 |
|------|----------|----------|--------|
| 后端 | ~500MB | ~150MB | 70% |
| 前端 | ~400MB | ~25MB | 94% |

**优化措施：**
- 使用 Alpine Linux 基础镜像
- 多阶段构建，只保留运行时文件
- 清理 npm 缓存
- `.dockerignore` 排除无用文件

### 3. 安全特性

- ✅ 非 root 用户运行（生产环境）
- ✅ 健康检查（自动重启故障容器）
- ✅ 资源限制（防止单个容器占用过多资源）
- ✅ 网络隔离（前端/后端网络分离）
- ✅ 环境变量管理（敏感信息不硬编码）

### 4. 开发体验

- 🔥 **热重载**：代码修改自动生效，无需重启容器
- 📦 **数据持久化**：数据库和上传文件不会因重启丢失
- 🐛 **调试友好**：日志实时输出，支持进入容器调试

---

## 🔧 故障排查

### 问题 1：容器无法启动

```bash
# 查看容器日志
docker-compose logs <service-name>

# 检查端口占用
netstat -tulpn | grep <port>

# 重新构建镜像
docker-compose up -d --build --force-recreate
```

### 问题 2：数据库连接失败

```bash
# 检查数据库是否启动
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres

# 测试数据库连接
docker exec -it qmzg-postgres psql -U admin -d qmzg
```

### 问题 3：端口冲突

```bash
# 修改 docker-compose.yml 中的端口映射
ports:
  - "3001:3000"  # 修改宿主机端口
```

### 问题 4：磁盘空间不足

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的数据卷
docker volume prune

# 一键清理所有
docker system prune -a --volumes
```

### 问题 5：构建速度慢

```bash
# 配置国内镜像源（已在 Dockerfile 中配置）
RUN npm config set registry https://registry.npmmirror.com

# 使用构建缓存
docker-compose build --parallel
```

---

## 📊 性能基准

### 启动时间

| 环境 | 首次构建 | 热启动 | 说明 |
|------|----------|--------|------|
| 开发 | ~3 分钟 | ~10 秒 | 包含依赖安装 |
| 生产 | ~5 分钟 | ~5 秒 | 包含编译优化 |

### 资源占用（运行时）

| 服务 | CPU | 内存 | 说明 |
|------|-----|------|------|
| PostgreSQL | ~5% | ~100MB | 空闲状态 |
| Server | ~10% | ~150MB | 空闲状态 |
| App (Nginx) | ~1% | ~20MB | 空闲状态 |

---

## 🎯 最佳实践

### 开发环境

1. ✅ 使用 `docker-compose.dev.yml`
2. ✅ 挂载本地代码卷（支持热重载）
3. ✅ 使用弱密码（便于测试）
4. ✅ 暴露所有端口（方便调试）

### 生产环境

1. ✅ 使用 `docker-compose.yml`
2. ✅ 设置强密码和密钥
3. ✅ 配置资源限制
4. ✅ 启用健康检查
5. ✅ 配置 HTTPS
6. ✅ 定期备份数据
7. ✅ 监控日志和资源

---

## 📞 支持

如遇问题，请：
1. 查看容器日志：`docker-compose logs -f`
2. 检查 GitHub Issues
3. 联系项目维护者

---

**🎓 祝您部署顺利，让我们一起点亮孩子们的 AI 启蒙之光！**
