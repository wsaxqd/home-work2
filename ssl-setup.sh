#!/bin/bash

###############################################################################
# SSL 证书自动申请和配置脚本
#
# 功能：
# 1. 自动安装 Certbot（Let's Encrypt 客户端）
# 2. 申请免费 SSL 证书（有效期 90 天）
# 3. 配置 Nginx 支持 HTTPS
# 4. 设置自动续期任务
#
# 使用方法：
#   sudo bash ssl-setup.sh
#
# 作者：AI助手
# 日期：2026-01-28
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 域名配置
DOMAIN="qmzgai.com"
WWW_DOMAIN="www.qmzgai.com"
API_DOMAIN="api.qmzgai.com"
EMAIL="admin@qmzgai.com"  # 用于接收证书过期提醒

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 权限运行此脚本"
        echo "使用方法: sudo bash ssl-setup.sh"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    log_info "检测到操作系统: $OS $VERSION"
}

# 安装 Certbot
install_certbot() {
    log_info "开始安装 Certbot..."

    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y epel-release
        yum install -y certbot python3-certbot-nginx
    else
        log_error "不支持的操作系统: $OS"
        exit 1
    fi

    log_info "Certbot 安装完成"
}

# 检查 Nginx 是否安装
check_nginx() {
    if ! command -v nginx &> /dev/null; then
        log_error "Nginx 未安装，请先安装 Nginx"
        echo ""
        echo "Ubuntu/Debian: sudo apt-get install nginx"
        echo "CentOS/RHEL:   sudo yum install nginx"
        exit 1
    fi
    log_info "检测到 Nginx: $(nginx -v 2>&1 | awk '{print $3}')"
}

# 检查 DNS 是否已解析
check_dns() {
    log_info "检查 DNS 解析..."

    CURRENT_IP=$(curl -s ifconfig.me)
    log_info "当前服务器 IP: $CURRENT_IP"

    for domain in $DOMAIN $WWW_DOMAIN $API_DOMAIN; do
        RESOLVED_IP=$(dig +short $domain | tail -n1)
        if [ -z "$RESOLVED_IP" ]; then
            log_warn "$domain DNS 解析未生效，跳过此域名"
        elif [ "$RESOLVED_IP" = "$CURRENT_IP" ]; then
            log_info "$domain -> $RESOLVED_IP ✓"
        else
            log_warn "$domain 解析到 $RESOLVED_IP，但当前服务器是 $CURRENT_IP"
        fi
    done
}

# 备份现有 Nginx 配置
backup_nginx_config() {
    log_info "备份 Nginx 配置..."

    BACKUP_DIR="/etc/nginx/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    if [ -d /etc/nginx/sites-available ]; then
        cp -r /etc/nginx/sites-available "$BACKUP_DIR/"
    fi

    if [ -d /etc/nginx/conf.d ]; then
        cp -r /etc/nginx/conf.d "$BACKUP_DIR/"
    fi

    log_info "配置已备份到: $BACKUP_DIR"
}

# 创建临时 Nginx 配置（用于验证域名所有权）
create_temp_nginx_config() {
    log_info "创建临时 Nginx 配置..."

    cat > /etc/nginx/conf.d/qmzgai-temp.conf << 'EOF'
# 临时配置 - 用于 SSL 证书申请
server {
    listen 80;
    server_name qmzgai.com www.qmzgai.com api.qmzgai.com;

    # Let's Encrypt 验证目录
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # 临时根目录
    location / {
        root /var/www/html;
        index index.html;
    }
}
EOF

    # 创建 webroot 目录
    mkdir -p /var/www/html
    echo "<h1>SSL Certificate Setup in Progress...</h1>" > /var/www/html/index.html

    # 测试配置
    nginx -t

    # 重载 Nginx
    systemctl reload nginx

    log_info "临时配置创建完成"
}

# 申请 SSL 证书
request_certificate() {
    log_info "开始申请 SSL 证书..."

    # 构建域名参数
    DOMAIN_ARGS="-d $DOMAIN -d $WWW_DOMAIN"

    # 检查 api 域名是否解析
    if dig +short $API_DOMAIN | grep -q .; then
        DOMAIN_ARGS="$DOMAIN_ARGS -d $API_DOMAIN"
        log_info "将包含 API 子域名: $API_DOMAIN"
    else
        log_warn "API 域名未解析，跳过"
    fi

    # 申请证书
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/html \
        $DOMAIN_ARGS \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --non-interactive

    if [ $? -eq 0 ]; then
        log_info "SSL 证书申请成功！"
        log_info "证书位置: /etc/letsencrypt/live/$DOMAIN/"
    else
        log_error "SSL 证书申请失败"
        exit 1
    fi
}

# 创建生产环境 Nginx 配置
create_production_nginx_config() {
    log_info "创建生产环境 Nginx 配置..."

    cat > /etc/nginx/conf.d/qmzgai.conf << 'EOF'
# 启蒙之光 - 生产环境 Nginx 配置
# 域名：qmzgai.com

# HTTP 跳转到 HTTPS
server {
    listen 80;
    server_name qmzgai.com www.qmzgai.com;

    # Let's Encrypt 验证
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 主站配置
server {
    listen 443 ssl http2;
    server_name qmzgai.com www.qmzgai.com;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/qmzgai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qmzgai.com/privkey.pem;

    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 日志
    access_log /var/log/nginx/qmzgai.access.log;
    error_log /var/log/nginx/qmzgai.error.log;

    # 前端静态文件（如果使用 Docker，这里会被覆盖）
    location / {
        root /var/www/qmzgai/app;
        try_files $uri $uri/ /index.html;
        index index.html;

        # 缓存策略
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 上传文件
    location /uploads/ {
        alias /var/www/qmzgai/server/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API 子域名配置（可选）
server {
    listen 443 ssl http2;
    server_name api.qmzgai.com;

    ssl_certificate /etc/letsencrypt/live/qmzgai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qmzgai.com/privkey.pem;

    # SSL 配置（同上）
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # 日志
    access_log /var/log/nginx/api.qmzgai.access.log;
    error_log /var/log/nginx/api.qmzgai.error.log;

    # API 反向代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    # 删除临时配置
    rm -f /etc/nginx/conf.d/qmzgai-temp.conf

    # 测试配置
    nginx -t

    # 重载 Nginx
    systemctl reload nginx

    log_info "生产环境配置创建完成"
}

# 设置自动续期
setup_auto_renewal() {
    log_info "设置证书自动续期..."

    # 测试续期命令
    certbot renew --dry-run

    if [ $? -eq 0 ]; then
        log_info "续期测试成功"

        # 创建续期钩子（续期后重载 Nginx）
        cat > /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF
        chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh

        # Certbot 会自动添加 cron 任务或 systemd timer
        log_info "自动续期已配置（每天检查2次）"
    else
        log_warn "续期测试失败，请手动检查"
    fi
}

# 显示证书信息
show_certificate_info() {
    log_info "SSL 证书信息："
    certbot certificates

    echo ""
    log_info "证书有效期：90 天"
    log_info "自动续期时间：到期前 30 天"
    log_info "下次续期时间：$(date -d '+60 days' '+%Y-%m-%d')"
}

# 主函数
main() {
    echo "=========================================="
    echo "  启蒙之光 - SSL 证书自动配置工具"
    echo "  域名: $DOMAIN"
    echo "=========================================="
    echo ""

    check_root
    detect_os
    check_nginx
    check_dns

    echo ""
    log_warn "即将开始 SSL 证书申请，请确认："
    log_warn "1. DNS 已正确解析到本服务器"
    log_warn "2. 防火墙已开放 80 和 443 端口"
    log_warn "3. Nginx 当前可以正常访问"
    echo ""
    read -p "是否继续？(y/n): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi

    backup_nginx_config
    install_certbot
    create_temp_nginx_config
    request_certificate
    create_production_nginx_config
    setup_auto_renewal
    show_certificate_info

    echo ""
    echo "=========================================="
    log_info "SSL 证书配置完成！"
    echo "=========================================="
    echo ""
    log_info "现在可以通过 HTTPS 访问网站："
    echo "  https://$DOMAIN"
    echo "  https://$WWW_DOMAIN"
    echo ""
    log_info "下一步："
    echo "  1. 更新前端 API 地址为 HTTPS"
    echo "  2. 测试网站功能是否正常"
    echo "  3. 配置 CDN 加速（可选）"
    echo ""
}

# 执行主函数
main
