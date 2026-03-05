#!/bin/bash
# 系统监控脚本（Linux版本）

while true; do
    clear
    echo "========================================"
    echo "系统监控 - $(date)"
    echo "========================================"
    echo ""

    echo "[1] 服务状态"
    echo "----------------------------------------"
    docker-compose ps
    echo ""

    echo "[2] 健康检查"
    echo "----------------------------------------"
    curl -s http://localhost:3001/health | jq -r '
        "状态: \(.status)",
        "运行时间: \(.uptime | floor / 60) 分钟",
        "数据库: \(.checks.database)",
        "内存: \(.checks.memoryUsage // "N/A")"
    ' 2>/dev/null || echo "服务未响应"
    echo ""

    echo "[3] 资源使用"
    echo "----------------------------------------"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    echo ""

    echo "[4] 最近日志"
    echo "----------------------------------------"
    docker-compose logs --tail=5 app
    echo ""

    echo "========================================"
    echo "按 Ctrl+C 退出监控"
    echo "自动刷新中..."
    echo "========================================"

    sleep 10
done
