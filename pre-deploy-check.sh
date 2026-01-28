#!/bin/bash

# ============================================
# 启蒙之光 - 部署前环境检查脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_passed=0
check_failed=0

print_check() {
    echo -e "${GREEN}[CHECK]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
    ((check_passed++))
}

print_fail() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
    ((check_failed++))
}

print_warn() {
    echo -e "${YELLOW}[! WARN]${NC} $1"
}

echo "============================================"
echo "  启蒙之光 (QMZG) - 部署前环境检查"
echo "============================================"
echo ""

# 1. 检查操作系统
print_check "检查操作系统..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "ubuntu" ]]; then
        print_pass "操作系统: $PRETTY_NAME"
    else
        print_warn "操作系统不是 Ubuntu: $PRETTY_NAME"
    fi
else
    print_fail "无法检测操作系统"
fi

# 2. 检查内存
print_check "检查系统内存..."
total_mem=$(free -m | awk '/^Mem:/{print $2}')
if [ "$total_mem" -ge 1800 ]; then
    print_pass "系统内存: ${total_mem}MB (充足)"
else
    print_fail "系统内存不足: ${total_mem}MB (建议至少 2GB)"
fi

# 3. 检查磁盘空间
print_check "检查磁盘空间..."
available_space=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$available_space" -ge 10 ]; then
    print_pass "磁盘可用空间: ${available_space}GB (充足)"
else
    print_fail "磁盘空间不足: ${available_space}GB (建议至少 10GB)"
fi

# 4. 检查 Docker
print_check "检查 Docker 安装..."
if command -v docker &> /dev/null; then
    docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_pass "Docker 已安装: $docker_version"
    
    # 检查 Docker 服务状态
    if systemctl is-active --quiet docker; then
        print_pass "Docker 服务正在运行"
    else
        print_fail "Docker 服务未运行"
    fi
else
    print_fail "Docker 未安装"
fi

# 5. 检查 Docker Compose
print_check "检查 Docker Compose 安装..."
if command -v docker-compose &> /dev/null; then
    compose_version=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
    print_pass "Docker Compose 已安装: $compose_version"
else
    print_fail "Docker Compose 未安装"
fi

# 6. 检查端口占用
print_check "检查端口占用情况..."
ports=(80 443 3000 5432)
for port in "${ports[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        print_warn "端口 $port 已被占用"
    else
        print_pass "端口 $port 可用"
    fi
done

# 7. 检查必要的命令
print_check "检查必要的系统命令..."
commands=(curl wget git)
for cmd in "${commands[@]}"; do
    if command -v "$cmd" &> /dev/null; then
        print_pass "命令 $cmd 可用"
    else
        print_warn "命令 $cmd 未安装（可选）"
    fi
done

# 8. 检查环境变量文件
print_check "检查环境变量配置..."
if [ -f ".env.production" ]; then
    print_pass "环境变量文件存在"
    
    # 检查必需的环境变量
    required_vars=("DB_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET" "DOMAIN")
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env.production && ! grep -q "^${var}=.*CHANGE" .env.production; then
            print_pass "环境变量 $var 已配置"
        else
            print_fail "环境变量 $var 未正确配置"
        fi
    done
else
    print_warn "环境变量文件 .env.production 不存在（部署时会创建）"
fi

# 9. 检查项目文件
print_check "检查项目文件完整性..."
required_files=(
    "docker-compose.prod.yml"
    "deploy.sh"
    "app/package.json"
    "server/package.json"
    "nginx/nginx.conf"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_pass "文件存在: $file"
    else
        print_fail "文件缺失: $file"
    fi
done

echo ""
echo "============================================"
echo "  检查完成"
echo "============================================"
echo -e "通过: ${GREEN}$check_passed${NC} 项"
echo -e "失败: ${RED}$check_failed${NC} 项"
echo ""

if [ $check_failed -eq 0 ]; then
    echo -e "${GREEN}✓ 环境检查全部通过，可以开始部署！${NC}"
    exit 0
else
    echo -e "${RED}✗ 发现 $check_failed 个问题，请先解决后再部署。${NC}"
    exit 1
fi
