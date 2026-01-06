#!/bin/bash

# ============================================================
# 启蒙之光 - 开发环境启动脚本（Linux/Mac）
# 项目：qmzg (启蒙之光)
# 用途：一键启动开发环境
# ============================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="启蒙之光 (qmzg)"
COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env.development"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 打印标题
print_header() {
    echo ""
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}  $PROJECT_NAME - 开发环境管理${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo ""
}

# 检查 Docker 是否安装
check_docker() {
    print_info "检查 Docker 环境..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    print_success "Docker 环境检查通过"
}

# 检查环境变量文件
check_env_file() {
    print_info "检查环境变量配置..."

    if [ ! -f "$ENV_FILE" ]; then
        print_warning "环境变量文件 $ENV_FILE 不存在"

        if [ -f ".env.development.example" ]; then
            print_info "从示例文件创建 $ENV_FILE"
            cp .env.development.example "$ENV_FILE"
            print_warning "请编辑 $ENV_FILE 文件，配置 Dify API 密钥等参数"
            read -p "按回车键继续..."
        else
            print_error "示例配置文件不存在，无法创建环境变量文件"
            exit 1
        fi
    fi

    print_success "环境变量文件检查通过"
}

# 显示菜单
show_menu() {
    print_header
    echo "请选择操作："
    echo ""
    echo "  1) 🚀 启动开发环境（构建 + 启动）"
    echo "  2) ▶️  启动开发环境（不重新构建）"
    echo "  3) 🔄 重启所有服务"
    echo "  4) ⏸️  停止所有服务"
    echo "  5) 🗑️  停止并删除所有容器"
    echo "  6) 💥 停止并删除所有数据（危险）"
    echo "  7) 📊 查看服务状态"
    echo "  8) 📜 查看实时日志"
    echo "  9) 🔍 进入后端容器"
    echo " 10) 🧹 清理 Docker 资源"
    echo " 11) 🔬 验证架构配置"
    echo "  0) 🚪 退出"
    echo ""
    echo -n "请输入选项 [0-11]: "
}

# 启动开发环境（构建）
start_with_build() {
    print_info "启动开发环境（重新构建镜像）..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

    if [ $? -eq 0 ]; then
        print_success "开发环境启动成功！"
        show_access_info
    else
        print_error "启动失败，请查看错误信息"
    fi
}

# 启动开发环境（不构建）
start_without_build() {
    print_info "启动开发环境..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    if [ $? -eq 0 ]; then
        print_success "开发环境启动成功！"
        show_access_info
    else
        print_error "启动失败，请查看错误信息"
    fi
}

# 重启服务
restart_services() {
    print_info "重启所有服务..."
    docker-compose -f "$COMPOSE_FILE" restart
    print_success "服务重启完成"
}

# 停止服务
stop_services() {
    print_info "停止所有服务..."
    docker-compose -f "$COMPOSE_FILE" stop
    print_success "服务已停止"
}

# 删除容器
remove_containers() {
    print_warning "即将停止并删除所有容器（保留数据卷）"
    read -p "确认操作？(y/N): " confirm

    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        print_info "删除容器..."
        docker-compose -f "$COMPOSE_FILE" down
        print_success "容器已删除"
    else
        print_info "操作已取消"
    fi
}

# 删除所有数据
remove_all_data() {
    print_error "⚠️  危险操作：即将删除所有容器和数据卷！"
    print_warning "这将删除数据库数据、上传文件等所有持久化数据"
    read -p "确认删除所有数据？(yes/N): " confirm

    if [ "$confirm" = "yes" ]; then
        print_info "删除所有容器和数据..."
        docker-compose -f "$COMPOSE_FILE" down -v
        print_success "所有数据已删除"
    else
        print_info "操作已取消"
    fi
}

# 查看服务状态
show_status() {
    print_info "服务运行状态："
    echo ""
    docker-compose -f "$COMPOSE_FILE" ps
}

# 查看日志
show_logs() {
    print_info "显示实时日志（Ctrl+C 退出）..."
    docker-compose -f "$COMPOSE_FILE" logs -f
}

# 进入后端容器
enter_backend() {
    print_info "进入后端容器（输入 exit 退出）..."
    docker exec -it qmzg-server-dev sh
}

# 清理 Docker 资源
cleanup_docker() {
    print_warning "清理未使用的 Docker 资源"
    echo ""
    echo "将清理："
    echo "  - 未使用的容器"
    echo "  - 未使用的镜像"
    echo "  - 未使用的网络"
    echo ""
    read -p "确认清理？(y/N): " confirm

    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        print_info "清理中..."
        docker system prune -f
        print_success "清理完成"
    else
        print_info "操作已取消"
    fi
}

# 验证架构配置
verify_architecture() {
    print_header
    print_info "验证工业级架构配置..."
    echo ""

    # 1. 检查显式网络
    print_info "【原则1: 内部通话】检查显式命名网络..."
    if docker network ls | grep -q "qmzg-internal-dev-network"; then
        print_success "✓ 显式网络已创建：qmzg-internal-dev-network"
        docker network inspect qmzg-internal-dev-network --format '子网: {{range .IPAM.Config}}{{.Subnet}}{{end}}'
    else
        print_warning "✗ 显式网络未找到"
    fi
    echo ""

    # 2. 检查匿名卷保护
    print_info "【原则2: 依赖保护区】检查 node_modules 匿名卷..."
    if docker ps | grep -q "qmzg-server-dev"; then
        print_info "后端容器 node_modules 内容："
        docker exec qmzg-server-dev sh -c "ls /app/node_modules | head -5"
        print_success "✓ node_modules 匿名卷保护生效"
    else
        print_warning "✗ 后端容器未运行"
    fi
    echo ""

    # 3. 检查命名卷
    print_info "【原则3: 数据安全】检查命名卷持久化..."
    docker volume ls | grep qmzg | awk '{print "✓ " $2}'
    echo ""

    # 4. 检查环境变量
    print_info "【原则4: 变量剥离】检查环境变量配置..."
    if [ -f "$ENV_FILE" ]; then
        print_success "✓ 环境变量文件存在：$ENV_FILE"
        echo "  配置项数量: $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | wc -l)"
    else
        print_warning "✗ 环境变量文件不存在"
    fi
    echo ""

    # 5. 测试内部通信
    print_info "【内部通信测试】后端 → 数据库..."
    if docker ps | grep -q "qmzg-server-dev"; then
        if docker exec qmzg-server-dev ping -c 1 postgres &> /dev/null; then
            print_success "✓ 内部通信正常（server → postgres）"
        else
            print_warning "✗ 内部通信失败"
        fi
    fi

    echo ""
    print_success "架构验证完成！"
    echo ""
    read -p "按回车键返回主菜单..."
}

# 显示访问信息
show_access_info() {
    echo ""
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN}  🌐 服务访问地址${NC}"
    echo -e "${GREEN}============================================================${NC}"
    echo ""
    echo -e "  📱 React 前端:     ${BLUE}http://localhost:5173${NC}"
    echo -e "  🚀 后端 API:       ${BLUE}http://localhost:3000${NC}"
    echo -e "  📄 静态 HTML:      ${BLUE}http://localhost:8080${NC}"
    echo -e "  🗄️  PostgreSQL:    ${BLUE}localhost:5432${NC}"
    echo ""
    echo -e "${GREEN}============================================================${NC}"
    echo ""
}

# 主函数
main() {
    # 检查环境
    check_docker
    check_env_file

    # 显示菜单并处理选项
    while true; do
        show_menu
        read choice

        case $choice in
            1)
                start_with_build
                read -p "按回车键继续..."
                ;;
            2)
                start_without_build
                read -p "按回车键继续..."
                ;;
            3)
                restart_services
                read -p "按回车键继续..."
                ;;
            4)
                stop_services
                read -p "按回车键继续..."
                ;;
            5)
                remove_containers
                read -p "按回车键继续..."
                ;;
            6)
                remove_all_data
                read -p "按回车键继续..."
                ;;
            7)
                show_status
                echo ""
                read -p "按回车键继续..."
                ;;
            8)
                show_logs
                ;;
            9)
                enter_backend
                ;;
            10)
                cleanup_docker
                read -p "按回车键继续..."
                ;;
            11)
                verify_architecture
                ;;
            0)
                print_info "退出脚本"
                exit 0
                ;;
            *)
                print_error "无效选项，请重新选择"
                sleep 2
                ;;
        esac
    done
}

# 运行主函数
main
