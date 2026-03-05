@echo off
chcp 65001 >nul
echo ========================================
echo 启蒙之光 - 系统监控
echo ========================================
echo.

:loop
cls
echo ========================================
echo 系统监控 - %date% %time%
echo ========================================
echo.

echo [1] 服务状态
echo ----------------------------------------
docker-compose ps
echo.

echo [2] 健康检查
echo ----------------------------------------
curl -s http://localhost:3001/health | node -e "const data=require('fs').readFileSync(0,'utf-8'); try { const json=JSON.parse(data); console.log('状态:', json.status); console.log('运行时间:', Math.floor(json.uptime/60), '分钟'); console.log('数据库:', json.checks.database); console.log('内存:', json.checks.memoryUsage || 'N/A'); } catch(e) { console.log('服务未响应'); }"
echo.

echo [3] 资源使用
echo ----------------------------------------
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo.

echo [4] 最近日志
echo ----------------------------------------
docker-compose logs --tail=5 app
echo.

echo ========================================
echo 按 Ctrl+C 退出监控
echo 自动刷新中...
echo ========================================

timeout /t 10 /nobreak >nul
goto loop
