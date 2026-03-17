# Dr. 邵 DevOps 快速参考手册

## 🚀 常用命令速查

### Docker 命令
```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f [服务名]

# 重启服务
docker-compose restart [服务名]

# 进入容器
docker exec -it [容器名] bash

# 清理未使用的镜像
docker image prune -a -f

# 清理所有（危险！）
docker system prune -a --volumes
```

### Nginx 命令
```bash
# 测试配置文件
nginx -t

# 重载配置（不停机）
nginx -s reload

# 查看错误日志
tail -f /var/log/nginx/error.log

# 查看访问日志
tail -f /var/log/nginx/access.log
```

### SSL 证书命令
```bash
# 申请证书（Let's Encrypt）
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 查看证书信息
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -noout -text

# 检查证书有效期
openssl x509 -in cert.pem -noout -dates

# 测试 SSL 配置
openssl s_client -connect yourdomain.com:443

# 手动续期
certbot renew

# 自动续期（添加到 crontab）
0 0 * * * certbot renew --quiet
```

### 服务器管理
```bash
# 查看系统资源
htop
df -h          # 磁盘使用
free -h        # 内存使用
netstat -tulpn # 端口占用

# 查看进程
ps aux | grep nginx
ps aux | grep docker

# 防火墙（Ubuntu/Debian）
ufw status
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# 查看系统日志
journalctl -u docker -f
```

## 🔧 故障排查流程

### 问题 1: 网站无法访问（白屏/502）

**排查步骤**：
```bash
# 1. 检查容器状态
docker-compose ps

# 2. 查看 Nginx 日志
docker logs nginx-container-name

# 3. 查看后端日志
docker logs backend-container-name

# 4. 测试后端是否响应
curl http://localhost:3000/health

# 5. 检查 Nginx 配置
docker exec -it nginx-container nginx -t

# 6. 检查端口映射
docker port nginx-container-name
```

**常见原因**：
- ✗ 后端服务未启动
- ✗ Nginx 配置中的 proxy_pass 地址错误
- ✗ 端口映射不正确
- ✗ 防火墙阻止了端口
- ✗ 浏览器缓存问题

### 问题 2: SSL 证书不生效

**排查步骤**：
```bash
# 1. 检查证书文件是否存在
ls -la /etc/letsencrypt/live/yourdomain.com/

# 2. 检查证书权限
ls -la /etc/letsencrypt/archive/yourdomain.com/

# 3. 测试 SSL 连接
openssl s_client -connect yourdomain.com:443

# 4. 检查 Nginx SSL 配置
docker exec -it nginx-container cat /etc/nginx/nginx.conf | grep ssl

# 5. 重启 Nginx
docker-compose restart nginx
```

### 问题 3: 容器无法启动

**排查步骤**：
```bash
# 1. 查看容器日志
docker logs container-name

# 2. 检查端口冲突
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# 3. 检查挂载路径
docker inspect container-name | grep -A 10 Mounts

# 4. 检查环境变量
docker exec -it container-name env

# 5. 手动启动测试
docker run -it --rm image-name /bin/bash
```

## 📋 部署检查清单

### 部署前检查
- [ ] 代码已推送到 Git 仓库
- [ ] 镜像已构建并推送到镜像仓库
- [ ] .env 文件已配置并上传到服务器
- [ ] SSL 证书已申请
- [ ] 域名 DNS 已解析到服务器 IP
- [ ] 防火墙已开放 80、443 端口
- [ ] 数据库已创建
- [ ] 备份了旧版本（如果是更新）

### 部署后检查
- [ ] 所有容器都在运行（docker-compose ps）
- [ ] 网站可以通过 HTTP 访问
- [ ] HTTP 自动重定向到 HTTPS
- [ ] HTTPS 证书有效（浏览器显示安全）
- [ ] API 接口正常响应
- [ ] 数据库连接正常
- [ ] 静态资源加载正常
- [ ] 日志正常输出
- [ ] 监控告警正常

## 🎯 反问法实战模板

### 模板 1: 不知道如何开始
```
我想 [做什么事情]，但不知道需要哪些信息/步骤。
你需要我提供什么信息才能帮我完成？
```

### 模板 2: 遇到错误
```
我在 [做什么] 时遇到了 [错误信息]。
我应该检查哪些地方？需要提供什么日志给你？
```

### 模板 3: 配置文件
```
我需要配置 [某个服务]，但不确定需要哪些配置项。
根据我的项目情况 [简述项目]，你建议配置哪些功能？
```

### 模板 4: 优化建议
```
我的 [某个服务] 遇到了 [性能/安全] 问题。
你需要了解哪些信息才能给出优化建议？
```

## 🔐 安全最佳实践

### 必须做的
- ✅ 使用 HTTPS（强制重定向）
- ✅ 定期更新系统和软件包
- ✅ 使用强密码（至少 16 位随机字符）
- ✅ 限制 SSH 登录（禁用密码登录，使用密钥）
- ✅ 配置防火墙（只开放必要端口）
- ✅ 定期备份数据
- ✅ 使用环境变量存储敏感信息
- ✅ 限制容器权限（不使用 root）

### 不要做的
- ✗ 不要在代码中硬编码密码
- ✗ 不要将 .env 文件提交到 Git
- ✗ 不要使用默认密码
- ✗ 不要开放所有端口
- ✗ 不要在生产环境开启调试模式
- ✗ 不要让 AI 直接操作已上线的生产服务器
- ✗ 不要忽略安全更新

## 📊 性能优化建议

### Nginx 优化
```nginx
# 启用 Gzip 压缩
gzip on;
gzip_comp_level 6;

# 静态资源缓存
location /static/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# 连接优化
keepalive_timeout 65;
keepalive_requests 100;

# 缓冲区优化
client_body_buffer_size 128k;
client_max_body_size 10m;
```

### Docker 优化
```yaml
# 限制资源使用
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 数据库优化
```sql
-- 添加索引
CREATE INDEX idx_column_name ON table_name(column_name);

-- 定期清理
VACUUM ANALYZE;

-- 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

## 🆘 紧急情况处理

### 服务器宕机
```bash
# 1. 快速重启所有服务
docker-compose restart

# 2. 如果不行，完全重启
docker-compose down && docker-compose up -d

# 3. 检查系统资源
df -h  # 磁盘是否满了
free -h  # 内存是否耗尽
```

### 数据库损坏
```bash
# 1. 立即停止写入
docker-compose stop backend

# 2. 备份当前状态
docker exec database pg_dump dbname > backup.sql

# 3. 尝试修复
docker exec -it database psql -U user -d dbname -c "REINDEX DATABASE dbname;"
```

### 被攻击
```bash
# 1. 查看异常连接
netstat -an | grep ESTABLISHED | wc -l

# 2. 封禁可疑 IP
ufw deny from 攻击者IP

# 3. 查看访问日志
tail -f /var/log/nginx/access.log | grep "攻击特征"

# 4. 启用 fail2ban（如果未安装）
apt install fail2ban
systemctl enable fail2ban
```

---

**记住**: 遇到问题时，先用反问法让 AI 引导你！
