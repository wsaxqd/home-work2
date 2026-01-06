# 工业级 Docker 开发环境架构说明

## 📋 架构概览

本项目采用 **工业级标准** 的 Docker 开发环境配置，严格遵循 4 大核心原则，确保开发环境的**安全性**、**稳定性**和**可维护性**。

---

## 🏗️ 四大核心原则

### 1️⃣ 内部通话（显式网络）

**问题背景：**
- 默认情况下，Docker Compose 会将所有服务放在一个自动生成的默认网桥网络中
- 网络名称不可预测，难以管理和监控
- 服务之间通信混乱，缺乏隔离

**解决方案：**
```yaml
networks:
  qmzg-internal-network:
    driver: bridge
    name: qmzg-internal-dev-network
    driver_opts:
      com.docker.network.bridge.name: br-qmzg-dev
    ipam:
      driver: default
      config:
        - subnet: 172.30.0.0/16
          gateway: 172.30.0.1
```

**效果：**
- ✅ 显式命名网络 `qmzg-internal-dev-network`
- ✅ 服务通过服务名通信（如 `postgres`、`server`）
- ✅ 明确的 IP 段（172.30.0.0/16）
- ✅ 网络隔离，安全可控

**验证命令：**
```bash
# 查看网络详情
docker network inspect qmzg-internal-dev-network

# 测试服务间通信
docker exec qmzg-server-dev ping postgres
```

---

### 2️⃣ 依赖保护区（匿名卷）

**问题背景：**
这是最容易被忽略但**极其关键**的配置！

当你挂载本地代码目录时：
```yaml
volumes:
  - ./server:/app  # 挂载本地代码
```

**问题：**
- 如果本地 `./server/node_modules` 是空的或不存在
- Docker 会用本地空目录**覆盖**镜像内已安装的 `node_modules`
- 导致容器内依赖丢失，应用无法启动

**错误现象：**
```
Error: Cannot find module 'express'
Error: Cannot find module 'typescript'
```

**解决方案：**
```yaml
volumes:
  # 挂载本地代码（支持热重载）
  - ./server:/app

  # 🔥 匿名卷保护 node_modules（关键！）
  - /app/node_modules

  # 保护编译输出目录
  - /app/dist
```

**原理：**
- Docker 使用匿名卷 `/app/node_modules` 保护该目录
- 本地挂载不会覆盖这个目录
- 容器内的 `node_modules` 始终来自镜像构建阶段

**效果：**
- ✅ 本地代码修改实时同步（热重载）
- ✅ 镜像内的依赖不被覆盖
- ✅ 开发体验流畅，无需手动安装依赖

**验证命令：**
```bash
# 查看容器内 node_modules
docker exec qmzg-server-dev ls -la /app/node_modules

# 应该看到已安装的依赖包，而不是空目录
```

---

### 3️⃣ 数据安全（持久化）

**问题背景：**
- 容器是临时的，删除容器会丢失所有数据
- 开发过程中需要保留数据库数据、上传文件等

**解决方案：**
```yaml
volumes:
  # PostgreSQL 数据持久化
  postgres-data-dev:
    name: qmzg-postgres-data-dev
    driver: local

  # 上传文件持久化
  uploads-data-dev:
    name: qmzg-uploads-data-dev
    driver: local
```

**在服务中使用：**
```yaml
postgres:
  volumes:
    - postgres-data-dev:/var/lib/postgresql/data

server:
  volumes:
    - uploads-data-dev:/app/uploads
```

**效果：**
- ✅ 重启容器不会丢失数据
- ✅ 数据独立于容器生命周期
- ✅ 可以随时备份和恢复

**验证命令：**
```bash
# 查看命名卷
docker volume ls | grep qmzg

# 查看卷详情
docker volume inspect qmzg-postgres-data-dev
```

---

### 4️⃣ 变量剥离（安全）

**问题背景：**
- 敏感信息（密码、密钥）硬编码在配置文件中
- 容易泄露到版本控制系统
- 不同环境使用相同配置，不灵活

**解决方案：**

**1. 创建 `.env.development` 文件：**
```env
DB_PASSWORD=dev_password_123
JWT_SECRET=dev-jwt-secret
DIFY_API_URL=http://localhost/v1
```

**2. 在 `docker-compose.yml` 中引用：**
```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: ${DB_PASSWORD}

server:
  environment:
    JWT_SECRET: ${JWT_SECRET}
    DIFY_API_URL: ${DIFY_API_URL}
```

**3. `.gitignore` 中排除：**
```
.env.development
.env.production
```

**效果：**
- ✅ 无明文密码在配置文件中
- ✅ 不同环境使用不同配置
- ✅ 敏感信息不会提交到 Git

**验证命令：**
```bash
# 查看环境变量是否正确加载
docker exec qmzg-server-dev env | grep DB_PASSWORD
```

---

## 📁 文件结构

```
qmzg/
├── docker-compose.dev.yml          # 开发环境编排配置（工业级）
├── .env.development                # 开发环境变量（实际配置）
├── .env.development.example        # 环境变量示例
├── .dockerignore                   # Docker 构建排除文件
├── dev-start.sh                    # Linux/Mac 启动脚本
├── dev-start.bat                   # Windows 启动脚本
│
├── server/
│   ├── Dockerfile                  # 后端多阶段构建文件
│   └── ...
│
└── app/
    ├── Dockerfile                  # 前端多阶段构建文件
    ├── nginx.conf                  # Nginx 配置
    └── ...
```

---

## 🚀 快速开始

### 方式 1：使用启动脚本（推荐）

**Linux/Mac：**
```bash
./dev-start.sh
```

**Windows：**
```bash
dev-start.bat
```

脚本提供交互式菜单，包含：
- 🚀 启动/停止服务
- 📊 查看状态和日志
- 🔍 进入容器调试
- 🔬 验证架构配置

### 方式 2：手动命令

```bash
# 1. 准备环境变量
cp .env.development.example .env.development
vim .env.development  # 编辑配置

# 2. 启动开发环境
docker-compose -f docker-compose.dev.yml --env-file .env.development up -d --build

# 3. 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 4. 停止服务
docker-compose -f docker-compose.dev.yml down
```

---

## 🔍 架构验证

### 验证显式网络
```bash
docker network inspect qmzg-internal-dev-network
```

**预期输出：**
```json
{
  "Name": "qmzg-internal-dev-network",
  "Driver": "bridge",
  "IPAM": {
    "Config": [
      {"Subnet": "172.30.0.0/16"}
    ]
  }
}
```

### 验证依赖保护
```bash
docker exec qmzg-server-dev ls -la /app/node_modules
```

**预期输出：**
```
drwxr-xr-x  express
drwxr-xr-x  typescript
drwxr-xr-x  pg
...（应该看到已安装的依赖包）
```

### 验证数据持久化
```bash
docker volume ls | grep qmzg
```

**预期输出：**
```
qmzg-postgres-data-dev
qmzg-uploads-data-dev
```

### 验证内部通信
```bash
docker exec qmzg-server-dev ping -c 3 postgres
```

**预期输出：**
```
PING postgres (172.30.0.x): 56 data bytes
64 bytes from 172.30.0.x: seq=0 ttl=64 time=0.123 ms
```

---

## 📊 服务访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| **React 前端** | http://localhost:5173 | Vite 开发服务器（HMR） |
| **后端 API** | http://localhost:3000 | Express 服务器 |
| **静态 HTML** | http://localhost:8080 | Nginx 静态文件服务 |
| **PostgreSQL** | localhost:5432 | 数据库（用户: admin） |

---

## 🛠️ 常见问题

### Q1: 前端/后端容器启动失败，提示找不到模块

**原因：** 匿名卷保护未生效，本地空目录覆盖了容器内的 `node_modules`

**解决：**
```bash
# 1. 停止并删除容器
docker-compose -f docker-compose.dev.yml down

# 2. 重新构建并启动
docker-compose -f docker-compose.dev.yml up -d --build

# 3. 验证 node_modules
docker exec qmzg-server-dev ls /app/node_modules
```

### Q2: 后端无法连接数据库

**原因：** 环境变量配置错误或网络问题

**检查：**
```bash
# 1. 检查数据库是否启动
docker-compose -f docker-compose.dev.yml ps postgres

# 2. 检查内部通信
docker exec qmzg-server-dev ping postgres

# 3. 检查环境变量
docker exec qmzg-server-dev env | grep DB_
```

### Q3: 热重载不工作

**原因：** 代码挂载配置错误

**检查：**
```yaml
# 确保挂载配置正确
volumes:
  - ./server:/app        # 本地代码同步
  - /app/node_modules    # 依赖保护
```

### Q4: 端口冲突

**解决：** 修改 `.env.development` 中的端口配置
```env
SERVER_PORT=3001
APP_PORT=5174
DB_PORT=5433
```

---

## 🎯 最佳实践

### 开发流程

1. ✅ **首次启动**
   ```bash
   ./dev-start.sh  # 选择 "1) 启动开发环境（构建 + 启动）"
   ```

2. ✅ **日常开发**
   - 修改代码自动热重载
   - 无需重启容器
   - 数据持久化保留

3. ✅ **添加依赖**
   ```bash
   # 进入容器
   docker exec -it qmzg-server-dev sh

   # 安装依赖
   npm install package-name

   # 退出容器
   exit

   # 重新构建镜像（保留新依赖）
   docker-compose -f docker-compose.dev.yml up -d --build server
   ```

4. ✅ **清理环境**
   ```bash
   # 停止服务（保留数据）
   docker-compose -f docker-compose.dev.yml down

   # 停止并删除数据（慎用）
   docker-compose -f docker-compose.dev.yml down -v
   ```

### 性能优化

- 💾 **充分利用多层缓存**：只要 `package.json` 不变，依赖层完全缓存
- 🔥 **热重载**：代码修改实时生效，无需重启容器
- 📦 **体积优化**：`.dockerignore` 排除无用文件

### 安全建议

- 🔐 **开发环境密码简单**：便于测试，不要用于生产
- 🔒 **生产环境强密码**：使用 `.env.production`，不提交到 Git
- 🚫 **不暴露敏感端口**：生产环境只暴露必要端口

---

## 📚 技术栈

- **容器编排**: Docker Compose 3.8
- **网络**: Bridge 网络 + 显式命名
- **存储**: 命名卷持久化
- **前端**: React + Vite (HMR)
- **后端**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL 15 Alpine
- **Web 服务器**: Nginx Alpine

---

## 🎓 总结

本配置严格遵循工业级标准，4 大核心原则确保：

1. ✅ **显式网络** - 服务通信清晰可控
2. ✅ **依赖保护** - 热重载不破坏依赖
3. ✅ **数据持久** - 重启不丢失数据
4. ✅ **变量剥离** - 敏感信息安全管理

这套配置可以直接用于实际项目开发，提供**稳定**、**高效**、**安全**的开发体验。

---

**🚀 祝您开发顺利！**
