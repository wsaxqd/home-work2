#!/bin/bash

# ================================
# 启蒙之光 - 自动化部署脚本
# ================================
# 使用方法：
#   bash deploy.sh [环境]
# 示例：
#   bash deploy.sh production
#   bash deploy.sh staging
# ================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# 检查参数
ENVIRONMENT=${1:-production}
log_info "部署环境: $ENVIRONMENT"

# 检查必要的命令
check_commands() {
    log_info "检查必要的命令..."

    commands=("node" "npm" "git" "psql")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd 未安装"
            exit 1
        fi
    done

    log_info "所有必要命令已安装"
}

# 检查环境变量文件
check_env_file() {
    log_info "检查环境变量文件..."

    if [ ! -f ".env.$ENVIRONMENT" ]; then
        log_error ".env.$ENVIRONMENT 文件不存在"
        log_warn "请从 .env.production.template 复制并配置"
        exit 1
    fi

    # 检查是否还有未修改的占位符
    if grep -q "CHANGE_THIS" ".env.$ENVIRONMENT"; then
        log_error ".env.$ENVIRONMENT 中仍有未修改的配置项"
        exit 1
    fi

    log_info "环境变量文件检查通过"
}

# 备份当前版本
backup_current() {
    log_info "备份当前版本..."

    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    if [ -d "server/dist" ]; then
        cp -r server/dist "$BACKUP_DIR/server_dist"
    fi

    if [ -d "app/dist" ]; then
        cp -r app/dist "$BACKUP_DIR/app_dist"
    fi

    log_info "备份完成: $BACKUP_DIR"
}

# 安装依赖
install_dependencies() {
    log_info "安装依赖..."

    # 后端依赖
    log_info "安装后端依赖..."
    cd server
    npm ci --production=false
    cd ..

    # 前端依赖
    log_info "安装前端依赖..."
    cd app
    npm ci --production=false
    cd ..

    log_info "依赖安装完成"
}

# 运行数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."

    cd server

    # 复制环境变量文件
    cp "../.env.$ENVIRONMENT" .env

    # 运行迁移
    npm run migrate

    if [ $? -eq 0 ]; then
        log_info "数据库迁移完成"
    else
        log_error "数据库迁移失败"
        exit 1
    fi

    cd ..
}

# 构建项目
build_project() {
    log_info "构建项目..."

    # 构建后端
    log_info "构建后端..."
    cd server
    npm run build

    if [ $? -ne 0 ]; then
        log_error "后端构建失败"
        exit 1
    fi
    cd ..

    # 构建前端
    log_info "构建前端..."
    cd app
    npm run build

    if [ $? -ne 0 ]; then
        log_error "前端构建失败"
        exit 1
    fi
    cd ..

    log_info "项目构建完成"
}

# 运行测试
run_tests() {
    log_info "运行测试..."

    # 后端测试
    if [ -f "server/package.json" ] && grep -q "\"test\"" server/package.json; then
        log_info "运行后端测试..."
        cd server
        npm test || log_warn "后端测试失败，但继续部署"
        cd ..
    fi

    # 前端测试
    if [ -f "app/package.json" ] && grep -q "\"test\"" app/package.json; then
        log_info "运行前端测试..."
        cd app
        npm test || log_warn "前端测试失败，但继续部署"
        cd ..
    fi

    log_info "测试完成"
}

# 停止旧服务
stop_services() {
    log_info "停止旧服务..."

    # 查找并停止后端进程
    if [ -f "server/.pid" ]; then
        PID=$(cat server/.pid)
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            log_info "已停止后端服务 (PID: $PID)"
        fi
        rm server/.pid
    fi

    log_info "服务停止完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."

    cd server

    # 复制环境变量文件
    cp "../.env.$ENVIRONMENT" .env

    # 使用 PM2 启动（如果已安装）
    if command -v pm2 &> /dev/null; then
        pm2 start dist/index.js --name qmzg-server
        log_info "已使用 PM2 启动后端服务"
    else
        # 使用 nohup 后台启动
        nohup node dist/index.js > ../logs/server.log 2>&1 &
        echo $! > .pid
        log_info "已启动后端服务 (PID: $!)"
    fi

    cd ..

    log_info "服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    sleep 3  # 等待服务启动

    # 检查后端健康
    HEALTH_URL="http://localhost:3000/health"

    for i in {1..5}; do
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            log_info "后端服务健康检查通过"
            return 0
        fi
        log_warn "健康检查失败，重试 $i/5..."
        sleep 2
    done

    log_error "健康检查失败"
    return 1
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    # 可以在这里添加清理逻辑
}

# 主流程
main() {
    echo "================================"
    echo "启蒙之光 - 自动化部署"
    echo "环境: $ENVIRONMENT"
    echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "================================"
    echo ""

    # 创建必要的目录
    mkdir -p logs
    mkdir -p backups

    # 执行部署步骤
    check_commands
    check_env_file
    backup_current
    install_dependencies
    run_migrations
    build_project
    run_tests
    stop_services
    start_services

    # 健康检查
    if health_check; then
        log_info "================================"
        log_info "部署成功！"
        log_info "================================"
        log_info "后端服务: http://localhost:3000"
        log_info "前端构建: app/dist"
        log_info "日志文件: logs/server.log"
        exit 0
    else
        log_error "================================"
        log_error "部署失败！"
        log_error "================================"
        log_error "请检查日志: logs/server.log"
        exit 1
    fi
}

# 捕获错误
trap cleanup EXIT

# 运行主流程
main
