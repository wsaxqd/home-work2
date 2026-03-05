# 数据库启动和迁移指南

## 📋 前提条件

1. **Docker Desktop 已安装并运行**
   - 下载地址: https://www.docker.com/products/docker-desktop
   - 确保Docker Desktop正在运行（系统托盘中有Docker图标）

2. **环境变量已配置**
   - 确保 `server/.env` 文件存在并配置正确

---

## 🚀 快速启动（开发环境）

### 步骤1: 启动Docker Desktop
```bash
# Windows: 从开始菜单启动 Docker Desktop
# 或双击桌面图标
```

### 步骤2: 启动PostgreSQL数据库
```bash
# 使用开发环境配置启动
docker-compose -f docker-compose.dev.yml up -d postgres

# 或使用默认配置
docker-compose up -d postgres
```

### 步骤3: 等待数据库就绪
```bash
# 检查容器状态
docker ps

# 查看数据库日志
docker logs qmzg-postgres

# 等待健康检查通过
docker-compose ps
```

### 步骤4: 执行数据库迁移
```bash
cd server
npm run migrate
```

### 步骤5: 验证迁移结果
```bash
# 连接到数据库
docker exec -it qmzg-postgres psql -U admin -d qmzg

# 查看所有表
\dt

# 查看用户表
SELECT COUNT(*) FROM users;

# 退出
\q
```

---

## 🏭 生产环境部署

### 步骤1: 配置环境变量
```bash
# 创建生产环境变量文件
cp server/.env.production.example server/.env.production

# 编辑配置文件，填入真实密钥
nano server/.env.production
```

### 步骤2: 启动生产环境
```bash
# 使用生产配置启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 步骤3: 执行迁移
```bash
cd server
NODE_ENV=production npm run migrate
```

---

## 🔧 常用命令

### Docker管理
```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f postgres

# 进入容器
docker exec -it qmzg-postgres bash
```

### 数据库管理
```bash
# 连接数据库
docker exec -it qmzg-postgres psql -U admin -d qmzg

# 备份数据库
docker exec qmzg-postgres pg_dump -U admin qmzg > backup.sql

# 恢复数据库
docker exec -i qmzg-postgres psql -U admin qmzg < backup.sql

# 查看数据库大小
docker exec qmzg-postgres psql -U admin -d qmzg -c "SELECT pg_size_pretty(pg_database_size('qmzg'));"
```

### 迁移管理
```bash
# 执行迁移
npm run migrate

# 回滚迁移（如果支持）
npm run migrate:rollback

# 查看迁移状态
npm run migrate:status
```

---

## ⚠️ 故障排查

### 问题1: Docker Desktop未运行
**错误信息**: `error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/containers/json"`

**解决方案**:
1. 启动Docker Desktop应用
2. 等待Docker完全启动（系统托盘图标变为正常）
3. 重新执行命令

### 问题2: 端口被占用
**错误信息**: `Bind for 0.0.0.0:5432 failed: port is already allocated`

**解决方案**:
```bash
# 查看占用端口的进程
netstat -ano | findstr :5432

# 停止占用端口的服务
# 或修改docker-compose.yml中的端口映射
ports:
  - "5433:5432"  # 改为其他端口
```

### 问题3: 数据库连接失败
**错误信息**: `ECONNREFUSED ::1:5432`

**解决方案**:
1. 检查数据库容器是否运行: `docker ps`
2. 检查健康状态: `docker-compose ps`
3. 查看数据库日志: `docker logs qmzg-postgres`
4. 验证环境变量配置

### 问题4: 迁移失败
**错误信息**: `Migration failed: ...`

**解决方案**:
1. 检查数据库连接配置
2. 确认数据库已创建
3. 查看详细错误日志
4. 手动连接数据库验证权限

---

## 📊 当前配置

### 开发环境 (docker-compose.dev.yml)
- PostgreSQL: 端口 5433
- 数据库名: qmzg
- 用户名: admin
- 密码: 见 server/.env

### 生产环境 (docker-compose.prod.yml)
- PostgreSQL: 内部网络（不暴露端口）
- Redis: 端口 6379
- 应用: 端口 3001
- 使用环境变量配置

---

## 🎯 下一步

完成数据库启动和迁移后：

1. **启动后端服务**
   ```bash
   cd server
   npm run dev
   ```

2. **启动前端服务**
   ```bash
   # 使用Live Server或http-server
   http-server -p 5174
   ```

3. **访问应用**
   - 前端: http://localhost:5174
   - 后端API: http://localhost:3000
   - pgAdmin: http://localhost:5050 (如果启用)

---

**文档更新时间**: 2026-02-16
