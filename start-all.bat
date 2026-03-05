@echo off
chcp 65001 >nul
echo ========================================
echo 启蒙之光 - 完整启动脚本
echo ========================================
echo.

REM 检查Docker
echo [1/6] 检查Docker状态...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop未运行，正在尝试启动...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo 等待Docker启动（30秒）...
    timeout /t 30 /nobreak >nul
)

docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker启动失败，请手动启动Docker Desktop
    pause
    exit /b 1
)
echo ✅ Docker正在运行

echo.
echo [2/6] 启动数据库...
docker-compose up -d postgres redis
if %errorlevel% neq 0 (
    echo ❌ 数据库启动失败
    pause
    exit /b 1
)
echo ✅ 数据库已启动

echo.
echo [3/6] 等待数据库就绪...
timeout /t 10 /nobreak >nul
echo ✅ 数据库就绪

echo.
echo [4/6] 执行数据库迁移...
cd server
call npm run migrate
if %errorlevel% neq 0 (
    echo ⚠️ 迁移失败，请检查数据库连接
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ 迁移完成

echo.
echo [5/6] 启动后端服务...
start "QMZG Backend" cmd /k "cd server && npm run dev"
timeout /t 5 /nobreak >nul
echo ✅ 后端服务已启动

echo.
echo [6/6] 启动前端服务...
start "QMZG Frontend" cmd /k "http-server -p 5174"
timeout /t 3 /nobreak >nul
echo ✅ 前端服务已启动

echo.
echo ========================================
echo ✅ 所有服务启动完成！
echo ========================================
echo.
echo 访问地址:
echo - 前端: http://localhost:5174
echo - 后端: http://localhost:3000
echo - 数据库: localhost:5433
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:5174
