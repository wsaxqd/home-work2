# 📋 生产环境部署检查清单

启蒙之光 (QMZG) - 基于邵博士 DevOps 12步方法论

---

## 🎯 部署前检查（P0 - 必须完成）

### ✅ 1. 服务器准备

- [ ] 服务器已购买（腾讯云/阿里云）
- [ ] 服务器 IP：`106.53.44.162`
- [ ] SSH 可以正常连接
- [ ] 防火墙已开放端口：80、443、22
- [ ] 服务器配置满足要求：
  - 最低：2核 4GB 内存 40GB 硬盘
  - 推荐：4核 8GB 内存 100GB 硬盘

**检查命令：**
```bash
# 本地测试 SSH 连接
ssh root@106.53.44.162

# 检查服务器配置
cat /proc/cpuinfo | grep "processor" | wc -l  # CPU核心数
free -h  # 内存
df -h    # 硬盘
```

---

### ✅ 2. 域名配置

- [ ] 域名已注册：`qmzgai.com`
- [ ] DNS 已解析到服务器 IP
- [ ] A 记录配置正确
- [ ] www 子域名已配置（可选）

**检查命令：**
```bash
# 检查 DNS 解析
nslookup qmzgai.com

# 应该返回：106.53.44.162
ping qmzgai.com
```

---

### ✅ 3. SSL 证书

- [ ] 已阅读 `SSL-CERTIFICATE-GUIDE.md`
- [ ] SSL 证书已申请
- [ ] 证书文件已放到 `ssl/` 目录：
  - [ ] `ssl/fullchain.pem` 存在
  - [ ] `ssl/privkey.pem` 存在
- [ ] 证书权限正确（Linux: 600）

**检查命令：**
```bash
# 检查证书文件
ls -la ssl/

# 查看证书有效期
openssl x509 -in ssl/fullchain.pem -noout -dates
```

---

### ✅ 4. 环境变量配置

- [ ] `.env.production` 文件存在
- [ ] 数据库密码已设置
- [ ] JWT 密钥已生成
- [ ] 域名配置正确
- [ ] CORS 配置正确

**检查命令：**
```bash
# 检查必需的环境变量
grep -E "^(DB_PASSWORD|JWT_SECRET|DOMAIN|CORS_ORIGIN)" .env.production
```

**必需配置：**
```env
DB_PASSWORD=强密码
JWT_SECRET=随机64位字符串
JWT_REFRESH_SECRET=另一个随机64位字符串
DOMAIN=qmzgai.com
CORS_ORIGIN=https://qmzgai.com
```

---

### ✅ 5. Docker 配置

- [ ] 本地 Docker 已安装并运行
- [ ] 服务器 Docker 已安装
- [ ] docker-compose.prod.yml 配置正确
- [ ] Dockerfile 存在且正确

**检查命令：**
```bash
# 本地检查
docker --version
docker-compose --version
docker info

# 服务器检查
ssh root@106.53.44.162 "docker --version && docker-compose --version"
```

---

### ✅ 6. Nginx 配置

- [ ] `nginx-production.conf` 已生成
- [ ] 域名已替换（不是 `your-domain.com`）
- [ ] SSL 路径配置正确
- [ ] 后端代理地址正确

**检查命令：**
```bash
# 检查配置文件
cat nginx-production.conf | grep "server_name"
cat nginx-production.conf | grep "ssl_certificate"
```

---

### ✅ 7. 目录结构

- [ ] `ssl/` 目录已创建
- [ ] `data/postgres/` 目录已创建
- [ ] `data/uploads/` 目录已创建
- [ ] `logs/nginx/` 目录已创建
- [ ] `logs/server/` 目录已创建
- [ ] `backups/` 目录已创建

**检查命令：**
```bash
# 检查目录结构
ls -la ssl data logs backups
```

---

## 🚀 部署步骤（按顺序执行）

### 步骤 1：本地构建测试

```bash
# 1. 构建 Docker 镜像
docker-compose -f docker-compose.prod.yml build

# 2. 本地启动测试
docker-compose -f docker-compose.prod.yml up -d

# 3. 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 4. 检查日志
docker-compose -f docker-compose.prod.yml logs -f

# 5. 测试访问
curl http://localhost/api/health

# 6. 停止测试环境
docker-compose -f docker-compose.prod.yml down
```

---

### 步骤 2：服务器环境准备

在服务器上执行：

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker

# 3. 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 创建部署目录
mkdir -p /opt/qmzg/{ssl,data/postgres,data/uploads,logs/nginx,logs/server}

# 5. 配置防火墙
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

### 步骤 3：申请 SSL 证书

```bash
# 方法 1：使用 Certbot（推荐）
sudo apt install certbot
sudo certbot certonly --standalone -d qmzgai.com -d www.qmzgai.com

# 方法 2：使用腾讯云/阿里云证书
# 在控制台申请后下载

# 复制证书到部署目录
sudo cp /etc/letsencrypt/live/qmzgai.com/fullchain.pem /opt/qmzg/ssl/
sudo cp /etc/letsencrypt/live/qmzgai.com/privkey.pem /opt/qmzg/ssl/
sudo chmod 644 /opt/qmzg/ssl/fullchain.pem
sudo chmod 600 /opt/qmzg/ssl/privkey.pem
```

**详细步骤见：** `SSL-CERTIFICATE-GUIDE.md`

---

### 步骤 4：执行自动化部署

```bash
# 在本地项目目录执行
bash deploy-production.sh
```

部署脚本会自动：
1. ✅ 检查配置文件
2. ✅ 构建 Docker 镜像
3. ✅ 推送到镜像仓库（如果配置）
4. ✅ 上传配置到服务器
5. ✅ 在服务器上启动服务
6. ✅ 执行健康检查

---

### 步骤 5：手动部署（如果自动部署失败）

**5.1 上传文件到服务器**

```bash
# 上传配置文件
scp .env.production root@106.53.44.162:/opt/qmzg/.env
scp docker-compose.prod.yml root@106.53.44.162:/opt/qmzg/
scp nginx-production.conf root@106.53.44.162:/opt/qmzg/nginx/

# 上传 SSL 证书
scp ssl/*.pem root@106.53.44.162:/opt/qmzg/ssl/
```

**5.2 在服务器上启动**

```bash
# SSH 到服务器
ssh root@106.53.44.162

# 进入部署目录
cd /opt/qmzg

# 拉取镜像（如果使用镜像仓库）
docker-compose -f docker-compose.prod.yml pull

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

---

## ✅ 部署后验证（P0 - 必须通过）

### 1. 容器状态检查

```bash
# 检查所有容器是否运行
docker-compose -f docker-compose.prod.yml ps

# 应该看到 4 个容器运行：
# - qmzg-postgres   (Up)
# - qmzg-server     (Up)
# - qmzg-nginx      (Up)
# - qmzg-frontend-builder (Exited 0)
```

---

### 2. 服务健康检查

```bash
# 检查后端健康
curl http://106.53.44.162/api/health
# 应该返回：OK 或 {"status": "healthy"}

# 检查前端
curl -I http://106.53.44.162/
# 应该返回：200 OK

# 检查 HTTPS（如果配置了 SSL）
curl -I https://qmzgai.com/
# 应该返回：200 OK
```

---

### 3. 数据库连接测试

```bash
# 进入后端容器
docker exec -it qmzg-server sh

# 测试数据库连接
npm run test:db  # 如果有此命令

# 或直接连接数据库
docker exec -it qmzg-postgres psql -U qmzg_admin -d qmzg_prod
# 执行：\dt  # 查看表
```

---

### 4. 日志检查

```bash
# 查看 Nginx 日志
docker-compose -f docker-compose.prod.yml logs nginx | tail -50

# 查看后端日志
docker-compose -f docker-compose.prod.yml logs server | tail -50

# 查看数据库日志
docker-compose -f docker-compose.prod.yml logs postgres | tail -50
```

---

### 5. 功能测试

- [ ] 访问首页：https://qmzgai.com
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] API 接口响应正常
- [ ] 文件上传功能正常
- [ ] 数据库读写正常

---

### 6. 安全检查

```bash
# 检查 HTTPS 重定向
curl -I http://qmzgai.com/
# 应该返回：301 Moved Permanently
# Location: https://qmzgai.com/

# 检查安全头
curl -I https://qmzgai.com/ | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"

# 应该看到：
# Strict-Transport-Security: max-age=31536000
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
```

---

### 7. 性能检查

```bash
# 检查 Gzip 压缩
curl -I -H "Accept-Encoding: gzip" https://qmzgai.com/
# 应该看到：Content-Encoding: gzip

# 检查响应时间
time curl -s https://qmzgai.com/ > /dev/null
# 应该在 1 秒内
```

---

## 🔧 维护任务（P1 - 上线后配置）

### 1. 配置自动备份

```bash
# 设置定时任务
crontab -e

# 添加：每天凌晨 2 点备份数据库
0 2 * * * /opt/qmzg/backup-database.sh >> /opt/qmzg/logs/backup.log 2>&1
```

---

### 2. 配置 SSL 自动续期

```bash
# 添加续期任务
0 3 1 * * certbot renew --quiet && /opt/qmzg/reload-ssl.sh
```

---

### 3. 配置监控（可选）

- [ ] 配置服务器监控（CPU、内存、硬盘）
- [ ] 配置应用监控（访问量、错误率）
- [ ] 配置告警通知（邮件/短信）

---

### 4. 填写 AI 服务配置

参考 `AI-SERVICES-CONFIG-GUIDE.md` 配置：
- [ ] Dify AI
- [ ] DeepSeek AI
- [ ] 智谱 AI
- [ ] 腾讯云 OCR
- [ ] 邮件服务

---

## 🚨 常见问题排查

### 问题 1：容器启动失败

**检查步骤：**
```bash
# 1. 查看容器日志
docker-compose -f docker-compose.prod.yml logs [容器名]

# 2. 检查端口占用
netstat -tulpn | grep -E ":(80|443|5432|3000)"

# 3. 检查磁盘空间
df -h

# 4. 检查内存
free -h
```

---

### 问题 2：502 Bad Gateway

**原因：** 后端服务未启动或无法连接

**检查步骤：**
```bash
# 1. 检查后端容器状态
docker ps | grep qmzg-server

# 2. 检查后端日志
docker logs qmzg-server

# 3. 测试后端直接访问
curl http://localhost:3000/api/health  # 在服务器上执行

# 4. 检查 Nginx 配置
docker exec qmzg-nginx nginx -t
```

---

### 问题 3：数据库连接失败

**检查步骤：**
```bash
# 1. 检查数据库容器
docker ps | grep postgres

# 2. 测试数据库连接
docker exec -it qmzg-postgres psql -U qmzg_admin -d qmzg_prod

# 3. 检查环境变量
docker exec qmzg-server env | grep DB_
```

---

### 问题 4：SSL 证书不生效

**检查步骤：**
```bash
# 1. 检查证书文件
ls -la ssl/

# 2. 验证证书
openssl x509 -in ssl/fullchain.pem -text -noout

# 3. 检查 Nginx 配置
grep ssl nginx-production.conf

# 4. 重启 Nginx
docker-compose restart nginx
```

---

## 📊 性能优化建议

### 1. 数据库优化
- 定期 VACUUM
- 添加索引
- 调整连接池

### 2. Nginx 优化
- 已启用 Gzip 压缩 ✅
- 已配置静态资源缓存 ✅
- 可调整 worker 进程数

### 3. Docker 优化
- 定期清理未使用的镜像
- 限制容器资源使用
- 优化镜像大小

---

## ✅ 最终检查清单

- [ ] 所有容器正常运行
- [ ] HTTPS 访问正常
- [ ] HTTP 自动重定向到 HTTPS
- [ ] 前端页面加载正常
- [ ] 后端 API 响应正常
- [ ] 数据库读写正常
- [ ] 文件上传功能正常
- [ ] 安全头配置正确
- [ ] Gzip 压缩生效
- [ ] 日志记录正常
- [ ] 备份脚本配置
- [ ] SSL 证书有效

---

## 🎉 部署完成！

**访问地址：**
- 主域名：https://qmzgai.com
- 备用IP：http://106.53.44.162

**管理命令：**
```bash
# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 备份数据库
bash backup-database.sh
```

---

**遇到问题？** 查看详细文档：
- `SSL-CERTIFICATE-GUIDE.md` - SSL 证书申请
- `AI-SERVICES-CONFIG-GUIDE.md` - AI 服务配置
- `docker-compose.prod.yml` 文件底部的使用说明
