#!/bin/bash

# ============================================
# 启蒙之光 - 部署后验证测试脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试计数
test_passed=0
test_failed=0

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
    ((test_passed++))
}

print_fail() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
    ((test_failed++))
}

# 获取域名或IP
if [ -f ".env.production" ]; then
    DOMAIN=$(grep "^DOMAIN=" .env.production | cut -d'=' -f2)
else
    DOMAIN="localhost"
fi

echo "============================================"
echo "  启蒙之光 (QMZG) - 部署后验证测试"
echo "============================================"
echo "测试目标: $DOMAIN"
echo ""

# 1. 检查 Docker 容器状态
print_test "检查 Docker 容器状态..."
containers=(qmzg-postgres qmzg-server qmzg-nginx)
for container in "${containers[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        status=$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null || echo "running")
        if [ "$status" == "healthy" ] || [ "$status" == "running" ]; then
            print_pass "容器 $container 运行正常 ($status)"
        else
            print_fail "容器 $container 状态异常: $status"
        fi
    else
        print_fail "容器 $container 未运行"
    fi
done

# 2. 检查端口监听
print_test "检查端口监听..."
if netstat -tuln 2>/dev/null | grep -q ":80 "; then
    print_pass "HTTP 端口 (80) 正在监听"
else
    print_fail "HTTP 端口 (80) 未监听"
fi

# 3. 测试后端 API 健康检查
print_test "测试后端 API 健康检查..."
health_url="http://${DOMAIN}/api/health"
if curl -f -s "$health_url" > /dev/null 2>&1; then
    response=$(curl -s "$health_url")
    if echo "$response" | grep -q "ok"; then
        print_pass "API 健康检查通过: $health_url"
    else
        print_fail "API 健康检查响应异常: $response"
    fi
else
    print_fail "API 健康检查失败: $health_url"
fi

# 4. 测试前端页面访问
print_test "测试前端页面访问..."
frontend_url="http://${DOMAIN}"
http_code=$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url")
if [ "$http_code" == "200" ]; then
    print_pass "前端页面可访问: $frontend_url (HTTP $http_code)"
else
    print_fail "前端页面访问失败: $frontend_url (HTTP $http_code)"
fi

# 5. 测试数据库连接
print_test "测试数据库连接..."
if docker exec qmzg-postgres pg_isready -U qmzg_admin > /dev/null 2>&1; then
    print_pass "数据库连接正常"
else
    print_fail "数据库连接失败"
fi

# 6. 检查数据库表是否创建
print_test "检查数据库表..."
table_count=$(docker exec qmzg-postgres psql -U qmzg_admin -d qmzg_prod -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
if [ "$table_count" -gt 0 ]; then
    print_pass "数据库表已创建 ($table_count 个表)"
else
    print_fail "数据库表未创建"
fi

# 7. 测试 Nginx 配置
print_test "测试 Nginx 配置..."
if docker exec qmzg-nginx nginx -t > /dev/null 2>&1; then
    print_pass "Nginx 配置正确"
else
    print_fail "Nginx 配置错误"
fi

# 8. 检查日志文件
print_test "检查应用日志..."
if docker logs qmzg-server --tail 10 2>&1 | grep -qi "error"; then
    print_fail "后端日志中发现错误信息"
else
    print_pass "后端日志正常"
fi

# 9. 测试 API 端点（可选）
print_test "测试基础 API 端点..."
api_endpoints=(
    "/api/health:200"
    "/api/auth/check:401"
)

for endpoint_test in "${api_endpoints[@]}"; do
    endpoint=$(echo "$endpoint_test" | cut -d':' -f1)
    expected_code=$(echo "$endpoint_test" | cut -d':' -f2)
    url="http://${DOMAIN}${endpoint}"
    actual_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$actual_code" == "$expected_code" ]; then
        print_pass "API 端点 $endpoint 响应正确 (HTTP $actual_code)"
    else
        print_fail "API 端点 $endpoint 响应异常 (期望 $expected_code, 实际 $actual_code)"
    fi
done

echo ""
echo "============================================"
echo "  测试完成"
echo "============================================"
echo -e "通过: ${GREEN}$test_passed${NC} 项"
echo -e "失败: ${RED}$test_failed${NC} 项"
echo ""

if [ $test_failed -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过，部署成功！${NC}"
    echo ""
    echo "访问地址："
    echo "  前端: http://$DOMAIN"
    echo "  API:  http://$DOMAIN/api/health"
    exit 0
else
    echo -e "${RED}✗ 发现 $test_failed 个问题，请检查日志。${NC}"
    echo ""
    echo "查看日志命令："
    echo "  docker-compose -f docker-compose.prod.yml logs -f"
    exit 1
fi
