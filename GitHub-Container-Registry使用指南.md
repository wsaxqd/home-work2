# GitHub Container Registry (GHCR) 使用指南

## ✅ 优势

- ✅ **完全免费** - 无限私有仓库
- ✅ **无存储限制** - 不限容量
- ✅ **与 GitHub 集成** - 使用 GitHub 账号
- ✅ **支持 CI/CD** - 与 GitHub Actions 无缝集成

---

## 🔑 第一步：创建 Personal Access Token

### 1. 登录 GitHub
访问：https://github.com

### 2. 进入 Token 生成页面
- 点击右上角头像 → **Settings**
- 左侧菜单滚动到底部 → **Developer settings**
- **Personal access tokens** → **Tokens (classic)**
- 点击 **Generate new token** → **Generate new token (classic)**

### 3. 配置 Token 权限
```
Note (备注): qmzg-container-registry
Expiration (有效期): No expiration (永不过期)

勾选权限：
✅ write:packages
✅ read:packages  (自动勾选)
✅ delete:packages
✅ repo (如果仓库是私有的)
```

### 4. 生成并保存
- 点击底部 **Generate token**
- **立即复制并保存！** 格式类似：`ghp_xxxxxxxxxxxxxxxxxxxx`
- ⚠️ Token 只显示一次，离开页面后无法再查看

---

## 🔧 第二步：配置项目

### 1. 修改 build-and-push.sh

文件已经帮你改好了，只需修改第 37 行：

```bash
REGISTRY_NAMESPACE="你的GitHub用户名"  # 改成你的 GitHub 用户名（必须小写）
```

**示例：**
```bash
# 如果你的 GitHub 用户名是 ZhangSan
REGISTRY_NAMESPACE="zhangsan"  # 必须小写

# 镜像地址将是：
# ghcr.io/zhangsan/qmzg-server:v1.0.0
```

### 2. 修改 .env.production

复制模板并修改：
```bash
cp .env.production.ready .env.production
vim .env.production
```

必须修改的配置：
```env
# Docker 镜像配置
REGISTRY_URL=ghcr.io
REGISTRY_NAMESPACE=你的GitHub用户名  # 改成你的（小写）
VERSION=v1.0.0

# 数据库密码
DB_PASSWORD=你的强密码

# 域名配置（等有服务器IP后再改）
DOMAIN=你的服务器IP
CORS_ORIGIN=http://你的服务器IP
```

---

## 🚀 第三步：本地构建并推送

### 1. 登录 GitHub Container Registry

```bash
# 方法 1：使用 Token 登录（推荐）
echo 你的Token | docker login ghcr.io -u 你的GitHub用户名 --password-stdin

# 方法 2：交互式登录
docker login ghcr.io
# Username: 你的GitHub用户名
# Password: 粘贴你的Token
```

**示例：**
```bash
# 假设你的 GitHub 用户名是 zhangsan
# Token 是 ghp_abc123def456
echo ghp_abc123def456 | docker login ghcr.io -u zhangsan --password-stdin
```

### 2. 构建并推送镜像

```bash
# 赋予执行权限
chmod +x build-and-push.sh

# 构建并推送
./build-and-push.sh v1.0.0 --push
```

**构建过程输出：**
```
========================================
Docker 镜像构建和推送工具
项目: 启蒙之光 (QMZG)
========================================

[INFO] 版本号: v1.0.0
[INFO] 镜像仓库: ghcr.io
[INFO] 命名空间: zhangsan

确认开始构建？(y/n): y

[INFO] 登录成功
[INFO] 后端镜像构建完成
[INFO] 前端镜像构建完成
[INFO] Nginx 镜像构建完成
[INFO] 所有镜像推送完成

✅ 构建流程完成！
```

---

## 🌐 第四步：在 GitHub 上查看镜像

### 1. 访问你的 GitHub 主页
https://github.com/你的用户名

### 2. 查看 Packages
- 点击右上角头像旁边的 **Packages**
- 你会看到 3 个镜像：
  - `qmzg-server`
  - `qmzg-frontend`
  - `qmzg-nginx`

### 3. 设置镜像可见性（可选）
- 点击某个镜像 → **Package settings**
- 可以设置为：
  - **Private** - 私有（需要登录才能拉取）
  - **Public** - 公开（任何人都可以拉取）

---

## 🖥️ 第五步：服务器部署

### 1. 上传配置文件到服务器

```bash
# 在本地电脑执行
scp docker-compose.prod-image.yml root@服务器IP:/var/www/qmzgai/
scp deploy-server.sh root@服务器IP:/var/www/qmzgai/
scp .env.production root@服务器IP:/var/www/qmzgai/
```

### 2. SSH 登录服务器

```bash
ssh root@服务器IP
cd /var/www/qmzgai
```

### 3. 登录 GitHub Container Registry

```bash
# 在服务器上也需要登录
echo 你的Token | docker login ghcr.io -u 你的GitHub用户名 --password-stdin
```

### 4. 执行部署

```bash
chmod +x deploy-server.sh
./deploy-server.sh deploy v1.0.0
```

---

## 📋 常用命令

### 登录
```bash
docker login ghcr.io -u 你的用户名
```

### 构建并推送
```bash
./build-and-push.sh v1.0.1 --push
```

### 拉取镜像
```bash
docker pull ghcr.io/你的用户名/qmzg-server:v1.0.0
```

### 查看本地镜像
```bash
docker images | grep qmzg
```

### 删除本地镜像
```bash
docker rmi ghcr.io/你的用户名/qmzg-server:v1.0.0
```

---

## ❓ 常见问题

### Q1: 推送镜像时提示 "unauthorized"

**原因：** Token 权限不足或已过期

**解决：**
1. 重新生成 Token，确保勾选 `write:packages`
2. 重新登录：`docker login ghcr.io`

---

### Q2: 镜像推送成功但在 GitHub 上看不到

**原因：** 镜像还没有与仓库关联

**解决：**
1. 等待几分钟，GitHub 需要时间处理
2. 确保镜像名称包含你的用户名

---

### Q3: 服务器拉取镜像失败

**原因：** 服务器没有登录或 Token 过期

**解决：**
```bash
# 重新登录
docker login ghcr.io -u 你的用户名
```

---

### Q4: Token 忘记了怎么办？

**解决：**
1. Token 无法找回，只能重新生成
2. 访问：https://github.com/settings/tokens
3. 删除旧 Token，生成新 Token
4. 重新执行 `docker login`

---

## 🎯 镜像地址格式

```
ghcr.io/你的用户名/qmzg-server:v1.0.0
  ↑          ↑           ↑         ↑
仓库地址   用户名      镜像名    版本号
```

**示例：**
```
ghcr.io/zhangsan/qmzg-server:v1.0.0
ghcr.io/zhangsan/qmzg-frontend:v1.0.0
ghcr.io/zhangsan/qmzg-nginx:v1.0.0
```

---

## 🔐 安全建议

1. **Token 安全**
   - 不要提交到 Git
   - 不要分享给他人
   - 定期轮换

2. **镜像可见性**
   - 生产环境建议使用 Private
   - 开源项目可以使用 Public

3. **版本管理**
   - 使用语义化版本号（v1.0.0, v1.0.1）
   - 不要覆盖已发布的版本

---

**文档创建时间：** 2026-01-28
**容器仓库：** GitHub Container Registry (ghcr.io)
**费用：** 完全免费
