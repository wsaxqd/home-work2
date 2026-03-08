# 腾讯云快速部署指南

## 前提条件
- ✅ 腾讯云服务器（2核4G以上）
- ✅ Ubuntu 20.04/22.04
- ✅ 域名已备案

## 一、服务器环境准备（30分钟）

### 1. 连接服务器
```bash
ssh root@your-server-ip
```

### 2. 安装Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
node -v  # 验证版本
```

### 3. 安装PostgreSQL
```bash
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 4. 安装Nginx
```bash
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 5. 安装PM2
```bash
npm install -g pm2
```

## 二、配置数据库（30分钟）

### 1. 创建数据库和用户
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE qmzg_prod;
CREATE USER qmzg_admin WITH PASSWORD '你的强密码';
GRANT ALL PRIVILEGES ON DATABASE qmzg_prod TO qmzg_admin;
\q
```

### 2. 测试连接
```bash
psql -h localhost -U qmzg_admin -d qmzg_prod
```

## 三、上传代码（10分钟）

### 1. 创建项目目录
```bash
mkdir -p /var/www/qmzg
cd /var/www/qmzg
```

### 2. 上传代码（本地执行）
```bash
# 方式1: 使用Git
git clone https://github.com/你的用户名/qmzg.git .

# 方式2: 使用SCP
scp -r D:\2025年AI\AI造物计划\项目库\qmzg-V1.0/* root@your-server-ip:/var/www/qmzg/
```

## 四、配置环境变量（15分钟）

### 1. 创建生产环境配置
```bash
cd /var/www/qmzg/server
cp .env.example .env.production
nano .env.production
```

### 2. 填写配置（必填项）
```env
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qmzg_prod
DB_USER=qmzg_admin
DB_PASSWORD=你的数据库密码

# JWT密钥（生成随机密钥）
JWT_SECRET=你的JWT密钥32位以上
JWT_REFRESH_SECRET=你的刷新密钥32位以上

# 服务器
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://你的域名.com

# AI服务（至少配置一个）
DIFY_API_KEY=你的Dify密钥
# 或
DEEPSEEK_API_KEY=你的DeepSeek密钥
```

### 3. 生成随机密钥
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 五、部署应用（30分钟）

### 1. 运行部署脚本
```bash
cd /var/www/qmzg
chmod +x deploy.sh
bash deploy.sh
```

### 2. 启动服务
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. 查看状态
```bash
pm2 status
pm2 logs qmzg-server
```

## 六、配置Nginx（20分钟）

### 1. 复制配置文件
```bash
cp /var/www/qmzg/nginx.conf /etc/nginx/sites-available/qmzg
```

### 2. 修改域名
```bash
nano /etc/nginx/sites-available/qmzg
# 将 your-domain.com 改为你的实际域名
```

### 3. 启用站点
```bash
ln -s /etc/nginx/sites-available/qmzg /etc/nginx/sites-enabled/
nginx -t  # 测试配置
systemctl reload nginx
```

## 七、配置SSL证书（20分钟）

### 1. 安装Certbot
```bash
apt-get install -y certbot python3-certbot-nginx
```

### 2. 申请证书
```bash
certbot --nginx -d 你的域名.com
```

### 3. 自动续期
```bash
certbot renew --dry-run
```

## 八、验证部署（10分钟）

### 1. 检查服务状态
```bash
pm2 status
systemctl status nginx
systemctl status postgresql
```

### 2. 测试API
```bash
curl http://localhost:3000/health
```

### 3. 访问网站
```
https://你的域名.com
```

## 九、常用命令

### PM2管理
```bash
pm2 restart qmzg-server  # 重启
pm2 stop qmzg-server      # 停止
pm2 logs qmzg-server      # 查看日志
pm2 monit                 # 监控
```

### Nginx管理
```bash
systemctl reload nginx    # 重载配置
systemctl restart nginx   # 重启
nginx -t                  # 测试配置
```

### 数据库备份
```bash
pg_dump -U qmzg_admin qmzg_prod > backup.sql
```

## 十、故障排查

### 1. 服务无法启动
```bash
pm2 logs qmzg-server --lines 100
```

### 2. 数据库连接失败
```bash
psql -h localhost -U qmzg_admin -d qmzg_prod
```

### 3. Nginx 502错误
```bash
systemctl status nginx
pm2 status
```

### 4. 查看端口占用
```bash
netstat -tulpn | grep 3000
```

---

## 🎉 部署完成！

访问 https://你的域名.com 查看效果

**预计总时间：2-3小时**
