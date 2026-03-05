@echo off
chcp 65001 >nul
echo ========================================
echo 启蒙之光 - 停止所有服务
echo ========================================
echo.

echo [1/3] 停止Docker容器...
docker-compose down
echo ✅ Docker容器已停止

echo.
echo [2/3] 清理进程...
taskkill /F /FI "WINDOWTITLE eq QMZG*" >nul 2>&1
echo ✅ 进程已清理

echo.
echo [3/3] 完成
echo ========================================
echo ✅ 所有服务已停止
echo ========================================
echo.
pause
