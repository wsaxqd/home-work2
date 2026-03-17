#!/bin/bash

# ============================================================
# 启蒙之光 (QMZG) - 生产环境自动化部署脚本
# 基于邵博士 DevOps 最佳实践
# 功能：构建镜像 → 推送仓库 → 服务器部署 → 健康检查
# ============================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================
# 配置变量
# ============================================================

# 从 .env.production 读取配置
if [ ! -f ".env.production" ]; then
    log_error ".env.production 文件不存在！"
    exit 1
fi

source .env.production

# 默认值
VERSION=${VERSION:-v1.0.0}
REGISTRY_URL=${REGISTRY_URL:-ccr.ccs.tencentyun.com}
REGISTRY_NAMESPACE=${REGISTRY_NAMESPACE:-qmzg-ai-edu}

# 镜像名称
SERVER_IMAGE="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/qmzg-server:${VERSION}"
NGINX_IMAGE="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/qmzg-nginx:${VERSION}"

# 服务器信息（需要配置）
SERVER_HOST=${SERVER_HOST:-106.53.44.162}
SERVER_USER=${SERVER_USER:-root}
SERVER_PORT=${SERVER_PORT:-22}
DEPLOY_PATH=${DEPLOY_PATH:-/opt/qmzg}

# ============================================================
# 第 1 步：部署前检查
# ============================================================

echo ""
log_info "=========================================="
log_info "  启蒙之光 - 生产环境部署脚本"
log_info "  版本: ${VERSION}"
log_info "=========================================="
echo ""

log_info "【步骤 1/8】部署前检查..."

# 检查必要文件
check_file() {
    if [ ! -f "$1" ]; then
        log_error "文件不存在: $1"
        exit 1
    fi
}

check_file ".env.production"
check_file "docker-compose.prod.yml"
check_file "nginx-production.conf"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    log_error "Docker 未运行，请先启动 Docker！"
    exit 1
fi

log_success "部署前检查通过！"

# ============================================================
# 第 2 步：构建 Docker 镜像
# ============================================================

log_info "【步骤 2/8】构建 Docker 镜像..."

# 构建后端镜像
log_info "构建后端镜像: ${SERVER_IMAGE}"
docker build -t ${SERVER_IMAGE} \
    --target production \
    --build-arg NODE_VERSION=18-alpine \
    ./server

log_success "后端镜像构建完成！"

# 构建前端（通过 docker-compose）
log_info "构建前端..."
docker-compose -f docker-compose.prod.yml build frontend-builder

log_success "前端构建完成！"

# 构建 Nginx 镜像
log_info "构建 Nginx 镜像: ${NGINX_IMAGE}"
docker build -t ${NGINX_IMAGE} \
    -f nginx/Dockerfile.nginx \
    --build-arg NGINX_VERSION=1.25-alpine \
    ./nginx

log_success "Nginx 镜像构建完成！"

# ============================================================
# 第 3 步：推送镜像到仓库
# ============================================================

log_info "【步骤 3/8】推送镜像到容器仓库..."

# 登录腾讯云容器镜像仓库
if [ -n "${REGISTRY_USERNAME}" ] && [ -n "${REGISTRY_PASSWORD}" ]; then
    log_info "登录容器镜像仓库..."
    echo "${REGISTRY_PASSWORD}" | docker login ${REGISTRY_URL} \
        -u ${REGISTRY_USERNAME} --password-stdin
else
    log_warn "未配置镜像仓库凭证，跳过推送步骤"
    log_warn "如需推送，请在 .env.production 中配置："
    log_warn "  REGISTRY_USERNAME=your_username"
    log_warn "  REGISTRY_PASSWORD=your_password"
fi

# 推送镜像
if docker login ${REGISTRY_URL} > /dev/null 2>&1; then
    log_info "推送后端镜像..."
    docker push ${SERVER_IMAGE}

    log_info "推送 Nginx 镜像..."
    docker push ${NGINX_IMAGE}

    log_success "镜像推送完成！"
else
    log_warn "未登录镜像仓库，跳过推送"
fi

# ============================================================
# 第 4 步：清理旧镜像（可选）
# ============================================================

log_info "【步骤 4/8】清理本地旧镜像..."

# 保留最近的镜像，删除 dangling 镜像
docker image prune -f

log_success "镜像清理完成！"

# ============================================================
# 第 5 步：上传配置到服务器
# ============================================================

log_info "【步骤 5/8】上传配置文件到服务器..."

# 检查是否配置了服务器信息
if [ "${SERVER_HOST}" == "your-server-ip" ] || [ -z "${SERVER_HOST}" ]; then
    log_warn "未配置服务器信息，跳过服务器部署"
    log_warn "如需部署到服务器，请在 .env.production 中配置："
    log_warn "  SERVER_HOST=your_server_ip"
    log_warn "  SERVER_USER=root"
    log_warn "  SERVER_PORT=22"

    log_info ""
    log_info "本地部署命令："
    log_info "  docker-compose -f docker-compose.prod.yml up -d"
    exit 0
fi

# 创建远程目录
log_info "创建远程部署目录..."
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} \
    "mkdir -p ${DEPLOY_PATH}/{ssl,data/postgres,data/uploads,logs/nginx,logs/server,nginx}"

# 上传配置文件
log_info "上传配置文件..."
scp -P ${SERVER_PORT} .env.production ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/.env
scp -P ${SERVER_PORT} docker-compose.prod.yml ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp -P ${SERVER_PORT} nginx-production.conf ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/nginx/

# 上传 SSL 证书（如果存在）
if [ -f "ssl/fullchain.pem" ] && [ -f "ssl/privkey.pem" ]; then
    log_info "上传 SSL 证书..."
    scp -P ${SERVER_PORT} ssl/*.pem ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/ssl/
fi

log_success "配置文件上传完成！"

# ============================================================
# 第 6 步：服务器部署
# ============================================================

log_info "【步骤 6/8】在服务器上部署应用..."

# 远程执行部署命令
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
set -e

cd /opt/qmzg

echo "拉取最新镜像..."
docker-compose -f docker-compose.prod.yml pull

echo "停止旧容器..."
docker-compose -f docker-compose.prod.yml down

echo "启动新容器..."
docker-compose -f docker-compose.prod.yml up -d

echo "等待服务启动..."
sleep 10

echo "检查容器状态..."
docker-compose -f docker-compose.prod.yml ps

ENDSSH

log_success "服务器部署完成！"

# ============================================================
# 第 7 步：健康检查
# ============================================================

log_info "【步骤 7/8】健康检查..."

# 等待服务启动
sleep 5

# 检查后端健康
log_info "检查后端服务..."
if curl -f -s -o /dev/null http://${SERVER_HOST}/api/health; then
    log_success "后端服务健康 ✓"
else
    log_error "后端服务健康检查失败 ✗"
fi

# 检查前端
log_info "检查前端服务..."
if curl -f -s -o /dev/null http://${SERVER_HOST}/; then
    log_success "前端服务健康 ✓"
else
    log_warn "前端服务可能需要时间启动"
fi

# ============================================================
# 第 8 步：部署总结
# ============================================================

log_info "【步骤 8/8】部署总结"

echo ""
log_success "=========================================="
log_success "  部署成功完成！"
log_success "=========================================="
echo ""
log_info "访问地址："
log_info "  HTTP:  http://${DOMAIN}"
log_info "  HTTPS: https://${DOMAIN} (需配置SSL)"
log_info "  IP:    http://${SERVER_HOST}"
echo ""
log_info "查看日志："
log_info "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
log_info "查看容器状态："
log_info "  docker-compose -f docker-compose.prod.yml ps"
echo ""
log_info "停止服务："
log_info "  docker-compose -f docker-compose.prod.yml down"
echo ""

# ============================================================
# 部署后提醒
# ============================================================

if [ ! -f "ssl/fullchain.pem" ]; then
    echo ""
    log_warn "=========================================="
    log_warn "  ⚠️  SSL 证书未配置"
    log_warn "=========================================="
    log_warn "生产环境必须使用 HTTPS！"
    log_warn "请按照以下步骤申请 SSL 证书："
    log_warn "  1. 查看 SSL-CERTIFICATE-GUIDE.md"
    log_warn "  2. 使用 Let's Encrypt 申请免费证书"
    log_warn "  3. 将证书放到 ssl/ 目录"
    log_warn "  4. 重新运行部署脚本"
    echo ""
fi

log_info "部署完成！🎉"
