@echo off
chcp 65001 >nul
echo ========================================
echo 启蒙之光 - 数据库快速启动脚本
echo ========================================
echo.

REM 检查Docker是否运行
echo [1/5] 检查Docker状态...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop未运行
    echo.
    echo 请先启动Docker Desktop，然后重新运行此脚本
    echo.
    pause
    exit /b 1
)
echo ✅ Docker正在运行

echo.
echo [2/5] 启动PostgreSQL数据库...
docker-compose up -d postgres
if %errorlevel% neq 0 (
    echo ❌ 数据库启动失败
    pause
    exit /b 1
)

echo.
echo [3/5] 等待数据库就绪...
timeout /t 10 /nobreak >nul

echo.
echo [4/5] 检查数据库健康状态...
docker-compose ps postgres

echo.
echo [5/5] 执行数据库迁移...
cd server
call npm run migrate
cd ..

echo.
echo ========================================
echo ✅ 数据库启动完成！
echo ========================================
echo.
echo 数据库信息:
echo - 主机: localhost
echo - 端口: 5433 (外部访问)
echo - 数据库: qmzg
echo - 用户: admin
echo.
echo 下一步:
echo 1. 启动后端: cd server && npm run dev
echo 2. 启动前端: 使用Live Server打开index.html
echo.
pause
