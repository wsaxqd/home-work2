#!/bin/bash

###############################################################################
# Docker 镜像构建和推送脚本
#
# 功能：
# 1. 构建后端、前端、Nginx 镜像
# 2. 推送到镜像仓库
# 3. 支持版本标签
# 4. 支持多平台构建（amd64/arm64）
#
# 使用方法：
#   ./build-and-push.sh v1.0.0
#   ./build-and-push.sh v1.0.0 --push
#   ./build-and-push.sh latest --platform linux/amd64,linux/arm64
#
# 作者：AI助手
# 日期：2026-01-28
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# 配置区域（根据实际情况修改）
# ============================================================

# 镜像仓库配置（腾讯云容器镜像服务 - 个人版）
REGISTRY_URL="ccr.ccs.tencentyun.com"
REGISTRY_NAMESPACE="qmzg"

# 项目配置
PROJECT_NAME="qmzg"
SERVER_IMAGE="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/qmzg-server"
FRONTEND_IMAGE="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/qmzg-frontend"
NGINX_IMAGE="${REGISTRY_URL}/${REGISTRY_NAMESPACE}/qmzg-nginx"

# 构建平台（默认当前平台）
PLATFORM="linux/amd64"

# ============================================================
# 函数定义
# ============================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    log_info "Docker 版本: $(docker --version)"
}

# 检查版本号参数
check_version() {
    if [ -z "$VERSION" ]; then
        log_error "请指定版本号"
        echo "使用方法: $0 <版本号> [选项]"
        echo "示例: $0 v1.0.0"
        echo "      $0 v1.0.0 --push"
        echo "      $0 v1.0.0 --platform linux/amd64,linux/arm64 --push"
        exit 1
    fi
    log_info "版本号: $VERSION"
}

# 登录镜像仓库
login_registry() {
    log_step "步骤 1: 登录镜像仓库"

    if docker login $REGISTRY_URL; then
        log_info "登录成功"
    else
        log_error "登录失败，请检查凭证"
        exit 1
    fi
}

# 构建后端镜像
build_server() {
    log_step "步骤 2: 构建后端镜像"

    log_info "镜像名称: $SERVER_IMAGE:$VERSION"
    log_info "构建平台: $PLATFORM"

    docker build \
        --platform $PLATFORM \
        --file server/Dockerfile \
        --target production \
        --tag $SERVER_IMAGE:$VERSION \
        --tag $SERVER_IMAGE:latest \
        --build-arg NODE_VERSION=18-alpine \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VERSION=$VERSION \
        ./server

    log_info "后端镜像构建完成"
}

# 构建前端镜像
build_frontend() {
    log_step "步骤 3: 构建前端镜像"

    log_info "镜像名称: $FRONTEND_IMAGE:$VERSION"

    # 前端需要注入环境变量
    docker build \
        --platform $PLATFORM \
        --file app/Dockerfile \
        --target production \
        --tag $FRONTEND_IMAGE:$VERSION \
        --tag $FRONTEND_IMAGE:latest \
        --build-arg NODE_VERSION=20-alpine \
        --build-arg VITE_API_URL=/api \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VERSION=$VERSION \
        ./app

    log_info "前端镜像构建完成"
}

# 构建 Nginx 镜像
build_nginx() {
    log_step "步骤 4: 构建 Nginx 镜像"

    log_info "镜像名称: $NGINX_IMAGE:$VERSION"

    # Nginx 镜像包含前端静态文件 + 配置
    docker build \
        --platform $PLATFORM \
        --file nginx/Dockerfile.production \
        --tag $NGINX_IMAGE:$VERSION \
        --tag $NGINX_IMAGE:latest \
        --build-arg NGINX_VERSION=1.25-alpine \
        --build-arg FRONTEND_IMAGE=$FRONTEND_IMAGE:$VERSION \
        ./nginx

    log_info "Nginx 镜像构建完成"
}

# 推送镜像到仓库
push_images() {
    log_step "步骤 5: 推送镜像到仓库"

    if [ "$PUSH" = "true" ]; then
        log_info "推送后端镜像..."
        docker push $SERVER_IMAGE:$VERSION
        docker push $SERVER_IMAGE:latest

        log_info "推送前端镜像..."
        docker push $FRONTEND_IMAGE:$VERSION
        docker push $FRONTEND_IMAGE:latest

        log_info "推送 Nginx 镜像..."
        docker push $NGINX_IMAGE:$VERSION
        docker push $NGINX_IMAGE:latest

        log_info "所有镜像推送完成"
    else
        log_warn "跳过推送（使用 --push 参数启用推送）"
    fi
}

# 显示镜像信息
show_images() {
    log_step "构建完成"

    echo ""
    log_info "已构建的镜像："
    echo ""
    docker images | grep -E "qmzg-(server|frontend|nginx)" | head -6
    echo ""

    if [ "$PUSH" = "true" ]; then
        log_info "镜像已推送到仓库："
        echo "  $SERVER_IMAGE:$VERSION"
        echo "  $FRONTEND_IMAGE:$VERSION"
        echo "  $NGINX_IMAGE:$VERSION"
        echo ""
        log_info "在生产服务器执行以下命令部署："
        echo ""
        echo "  export VERSION=$VERSION"
        echo "  docker-compose -f docker-compose.prod-image.yml pull"
        echo "  docker-compose -f docker-compose.prod-image.yml up -d"
        echo ""
    else
        log_info "本地测试命令："
        echo ""
        echo "  docker run -d -p 3000:3000 $SERVER_IMAGE:$VERSION"
        echo "  docker run -d -p 8080:80 $NGINX_IMAGE:$VERSION"
        echo ""
    fi
}

# 清理旧镜像
cleanup_old_images() {
    log_step "清理 dangling 镜像"

    docker image prune -f

    log_info "清理完成"
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "  Docker 镜像构建和推送工具"
    echo "  项目: 启蒙之光 (QMZG)"
    echo "=========================================="
    echo ""

    check_docker
    check_version

    # 显示配置信息
    log_info "镜像仓库: $REGISTRY_URL"
    log_info "命名空间: $REGISTRY_NAMESPACE"
    log_info "构建平台: $PLATFORM"
    log_info "是否推送: $PUSH"
    echo ""

    # 确认
    if [ "$SKIP_CONFIRM" != "true" ]; then
        read -p "确认开始构建？(y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "操作已取消"
            exit 0
        fi
    fi

    # 记录开始时间
    START_TIME=$(date +%s)

    # 登录仓库
    if [ "$PUSH" = "true" ]; then
        login_registry
    fi

    # 构建镜像
    build_server
    build_frontend
    build_nginx

    # 推送镜像
    push_images

    # 清理
    cleanup_old_images

    # 记录结束时间
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    # 显示结果
    show_images

    log_info "总耗时: ${DURATION}秒"
    echo ""
    echo "=========================================="
    log_info "✅ 构建流程完成！"
    echo "=========================================="
    echo ""
}

# ============================================================
# 参数解析
# ============================================================

VERSION=""
PUSH="false"
SKIP_CONFIRM="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --push)
            PUSH="true"
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --skip-confirm|-y)
            SKIP_CONFIRM="true"
            shift
            ;;
        --help|-h)
            echo "使用方法: $0 <版本号> [选项]"
            echo ""
            echo "选项："
            echo "  --push              构建后推送到镜像仓库"
            echo "  --platform <平台>   指定构建平台（默认：linux/amd64）"
            echo "  --skip-confirm,-y   跳过确认提示"
            echo "  --help,-h           显示帮助信息"
            echo ""
            echo "示例："
            echo "  $0 v1.0.0                                # 仅构建"
            echo "  $0 v1.0.0 --push                         # 构建并推送"
            echo "  $0 v1.0.0 --push -y                      # 构建并推送（无确认）"
            echo "  $0 v1.0.0 --platform linux/amd64,linux/arm64 --push"
            echo ""
            exit 0
            ;;
        *)
            VERSION="$1"
            shift
            ;;
    esac
done

# 执行主函数
main
