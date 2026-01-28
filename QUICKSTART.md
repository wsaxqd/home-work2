# 🚀 Docker 快速启动指南（3分钟上手）

## 1️⃣ 前置要求

✅ 已安装 Docker 和 Docker Compose
✅ 服务器配置：最低 2核4GB，推荐 4核8GB

## 2️⃣ 三步部署

### 步骤 1: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.production

# 编辑配置（必须填写以下3项）
nano .env.production
```

**必填项**：
```env
DB_PASSWORD=你的数据库密码123
JWT_SECRET=运行命令生成: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_REFRESH_SECRET=运行命令生成: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DOMAIN=example.com
```

### 步骤 2: 一键部署

```bash
# 赋予执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

### 步骤 3: 访问应用

```
HTTP:  http://your-domain.com
HTTPS: https://your-domain.com (需配置SSL)
API:   http://your-domain.com/api/health
```

## 3️⃣ 常用命令

```bash
# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down
```

## 4️⃣ 关于腾讯云

❓ **问：需要腾讯云账号吗？**

✅ **答：不需要！** Docker 镜像来自 Docker Hub，完全免费。

⚠️ **注意**：只有"拍照搜题OCR"功能需要腾讯云账号，其他所有功能都不受影响。

## 5️⃣ 遇到问题？

1. 查看详细文档：`./DOCKER_DEPLOYMENT.md`
2. 查看日志：`docker-compose -f docker-compose.prod.yml logs -f`
3. 检查配置：`docker-compose -f docker-compose.prod.yml config`

---

**就这么简单！** 🎉
