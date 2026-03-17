#!/bin/bash
# 自动化部署脚本模板
# 基于 Dr. 邵的无感知升级方案

set -e  # 遇到错误立即退出

echo "=========================================="
echo "开始部署流程"
echo "=========================================="

# 1. 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ 环境变量已加载"
else
    echo "✗ 错误: .env 文件不存在"
    exit 1
fi

# 2. 检查版本号
if [ -z "$VERSION" ]; then
    echo "✗ 错误: VERSION 未设置"
    exit 1
fi
echo "✓ 当前版本: $VERSION"

# 3. 拉取最新镜像
echo "正在拉取镜像..."
docker-compose pull
echo "✓ 镜像拉取完成"

# 4. 停止旧服务
echo "正在停止旧服务..."
docker-compose down
echo "✓ 旧服务已停止"

# 5. 启动新服务
echo "正在启动新服务..."
docker-compose up -d
echo "✓ 新服务已启动"

# 6. 等待服务就绪
echo "等待服务启动..."
sleep 10

# 7. 健康检查
echo "执行健康检查..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✓ 健康检查通过"
else
    echo "⚠ 警告: 健康检查失败，请手动检查"
fi

# 8. 清理旧镜像
echo "清理旧镜像..."
docker image prune -f
echo "✓ 清理完成"

# 9. 显示运行状态
echo ""
echo "=========================================="
echo "部署完成！当前运行的容器："
echo "=========================================="
docker-compose ps

echo ""
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo "=========================================="
