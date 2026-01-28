# 启蒙之光 (QMZG) - 服务器部署完整指南

## 📋 准备工作

### 您需要准备的信息

```
✅ 已完成：
- [x] 购买了服务器（轻量/CVM）
- [x] 购买了域名（备案审核中）
- [x] 生成了 JWT 密钥
- [x] 创建了预配置文件 .env.production.ready

⏳ 等待中：
- [ ] 获取服务器公网 IP
- [ ] 获取服务器登录凭证
- [ ] 域名备案完成（可选，不影响部署）
```

---

## 🚀 部署流程（共 5 个阶段）

### 阶段 1：连接服务器（5分钟）

#### Windows 用户推荐使用 PowerShell

1. **打开 PowerShell**
   ```
   按 Win + X → 选择 "Windows PowerShell"
   ```

2. **SSH 连接服务器**
   ```powershell
   # 替换为您的实际 IP 和用户名
   ssh root@您的服务器IP
   
   # 或者
   ssh ubuntu@您的服务器IP
   
   # 首次连接会提示：
   # Are you sure you want to continue connecting (yes/no)?
   # 输入：yes
   
   # 然后输入密码
   ```

3. **验证连接成功**
   ```bash
   # 看到类似提示说明已连接：
   # root@VM-xxx:~#  或  ubuntu@VM-xxx:~$
   
   # 检查系统版本
   lsb_release -a
   # 应该显示：Ubuntu 22.04 LTS
   ```

---

### 阶段 2：安装 Docker 环境（10分钟）

#### 2.1 更新系统

```bash
# 更新软件包列表
sudo apt update

# 升级已安装的软件包（可选，但推荐）
sudo apt upgrade -y
```

#### 2.2 安装 Docker

```bash
# 安装 Docker（一键脚本）
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证 Docker 安装
docker --version
# 应该显示：Docker version 24.x.x 或更高版本
```

#### 2.3 安装 Docker Compose

```bash
# 安装 Docker Compose
sudo apt install docker-compose -y

# 验证安装
docker-compose --version
# 应该显示：docker-compose version 1.29.x 或更高版本
```

#### 2.4 配置 Docker 权限（可选）

```bash
# 将当前用户添加到 docker 组（避免每次都用 sudo）
sudo usermod -aG docker $USER

# 重新加载权限（或重新登录）
newgrp docker

# 测试不用 sudo 运行
docker ps
# 应该能正常显示（即使是空列表）
```

---

### 阶段 3：上传项目代码（10分钟）

#### 方法 A：使用 Git Clone（推荐，如果 GitHub 推送成功）

```bash
# 创建项目目录
sudo mkdir -p /opt
cd /opt

# 克隆项目（替换为您的 GitHub 仓库地址）
sudo git clone https://github.com/wsaxqd/home-work2.git qmzg

# 进入项目目录
cd qmzg

# 检查文件是否完整
ls -la
# 应该看到：app/, server/, nginx/, docker-compose.prod.yml 等
```

#### 方法 B：使用 WinSCP 上传（如果 GitHub 推送失败）

1. **下载 WinSCP**
   - 访问：https://winscp.net/eng/download.php
   - 下载并安装

2. **连接服务器**
   ```
   文件协议：SFTP
   主机名：您的服务器IP
   端口号：22
   用户名：root 或 ubuntu
   密码：您的服务器密码
   ```

3. **上传项目**
   ```
   左侧：本地 D:\2025年AI\AI造物计划\项目库\qmzg - V1.0
   右侧：远程 /opt/qmzg
   
   将整个项目文件夹拖拽到右侧
   等待上传完成（约 2-5 分钟）
   ```

---

### 阶段 4：配置环境变量（5分钟）

```bash
# 进入项目目录
cd /opt/qmzg

# 复制预配置文件
cp .env.production.ready .env.production

# 编辑配置文件
nano .env.production

# 修改以下 3 项（使用方向键移动，修改后按 Ctrl+O 保存，Ctrl+X 退出）：
# 
# DB_PASSWORD=您的强密码123!  ← 改成您自己的密码
# DOMAIN=123.123.123.123      ← 改成您的服务器IP
# CORS_ORIGIN=http://123.123.123.123  ← 改成 http://您的服务器IP
#
# 其他配置保持不变即可！
```

**配置示例**：

```env
DB_PASSWORD=MySecure2025Pass!
DOMAIN=43.156.89.123
CORS_ORIGIN=http://43.156.89.123
```

---

### 阶段 5：执行部署（15分钟）

#### 5.1 赋予执行权限

```bash
chmod +x deploy.sh
```

#### 5.2 运行部署脚本

```bash
# 运行部署脚本
./deploy.sh

# 脚本会自动执行以下操作：
# ✅ 检查 Docker 环境
# ✅ 检查环境变量配置
# ✅ 创建必要的目录
# ✅ 构建 Docker 镜像（约 5-10 分钟）
# ✅ 启动所有容器
# ✅ 执行数据库迁移
# ✅ 显示服务状态
```

#### 5.3 查看部署状态

```bash
# 查看容器运行状态
docker-compose -f docker-compose.prod.yml ps

# 应该显示 3 个容器都是 healthy 状态：
# qmzg-postgres   Up (healthy)
# qmzg-server     Up (healthy)
# qmzg-nginx      Up (healthy)
```

#### 5.4 查看日志（如果有问题）

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 只查看后端日志
docker-compose -f docker-compose.prod.yml logs -f server

# 只查看数据库日志
docker-compose -f docker-compose.prod.yml logs -f postgres

# 按 Ctrl+C 退出日志查看
```

---

## ✅ 验证部署成功

### 1. 检查容器状态

```bash
docker-compose -f docker-compose.prod.yml ps
```

所有容器都应该是 `Up` 且 `healthy` 状态。

### 2. 测试前端访问

打开浏览器访问：

```
http://您的服务器IP
```

应该能看到启蒙之光的登录页面。

### 3. 测试后端 API

打开浏览器访问：

```
http://您的服务器IP/api/health
```

应该返回：

```json
{
  "status": "ok",
  "timestamp": "2026-01-28T..."
}
```

### 4. 测试注册功能

1. 访问 `http://您的服务器IP`
2. 点击"注册"
3. 填写信息并提交
4. 如果能成功注册，说明数据库连接正常

---

## 🔧 常见问题排查

### 问题 1：容器无法启动

```bash
# 查看详细错误日志
docker-compose -f docker-compose.prod.yml logs server

# 常见原因：
# - 端口被占用：netstat -tulpn | grep 80
# - 环境变量配置错误：cat .env.production
```

### 问题 2：数据库连接失败

```bash
# 检查 postgres 容器状态
docker-compose -f docker-compose.prod.yml ps postgres

# 查看 postgres 日志
docker-compose -f docker-compose.prod.yml logs postgres

# 进入 postgres 容器测试
docker-compose -f docker-compose.prod.yml exec postgres psql -U qmzg_admin -d qmzg_prod
```

### 问题 3：前端页面无法访问

```bash
# 检查 nginx 配置
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# 查看 nginx 日志
docker-compose -f docker-compose.prod.yml logs nginx

# 检查防火墙
sudo ufw status
```

---

## 🔄 常用维护命令

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 进入容器
docker-compose -f docker-compose.prod.yml exec server sh

# 备份数据库
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U qmzg_admin qmzg_prod > backup_$(date +%Y%m%d).sql

# 更新代码
cd /opt/qmzg
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🌐 域名配置（备案完成后）

### 1. 配置 DNS 解析

在域名提供商控制台添加 A 记录：

```
类型：A
主机记录：@
记录值：您的服务器IP
TTL：600
```

### 2. 配置 SSL 证书（使用 Let's Encrypt）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx -y

# 申请证书
sudo certbot --nginx -d your-domain.com

# 证书会自动配置到 Nginx
# 并设置自动续期
```

### 3. 更新环境变量

```bash
nano .env.production

# 修改：
DOMAIN=your-domain.com
CORS_ORIGIN=https://your-domain.com

# 重启服务
docker-compose -f docker-compose.prod.yml restart
```

### 4. 访问

```
https://your-domain.com
```

---

## 📞 获取帮助

如果遇到问题，请提供以下信息：

1. 错误日志：`docker-compose -f docker-compose.prod.yml logs`
2. 容器状态：`docker-compose -f docker-compose.prod.yml ps`
3. 系统信息：`uname -a && docker --version`

---

**部署完成！** 🎉
