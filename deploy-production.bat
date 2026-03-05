@echo off
chcp 65001 >nul
echo ========================================
echo 启蒙之光 - 生产环境部署脚本
echo ========================================
echo.

echo ⚠️ 警告: 此脚本将部署到生产环境
echo.
set /p confirm="确认继续? (y/n): "
if /i not "%confirm%"=="y" (
    echo 已取消部署
    pause
    exit /b 0
)

echo.
echo [1/8] 检查环境配置...
if not exist "server\.env.production" (
    echo ❌ 错误: server\.env.production 不存在
    echo 请先配置生产环境变量
    pause
    exit /b 1
)
echo ✅ 环境配置文件存在

echo.
echo [2/8] 运行代码质量检查...
call check-quality.bat
if %errorlevel% neq 0 (
    echo ❌ 代码质量检查失败
    pause
    exit /b 1
)

echo.
echo [3/8] 备份当前数据库...
echo 正在备份数据库...
docker exec qmzg-postgres pg_dump -U admin qmzg > backup_%date:~0,4%%date:~5,2%%date:~8,2%.sql
if %errorlevel% equ 0 (
    echo ✅ 数据库备份成功
) else (
    echo ⚠️ 数据库备份失败，继续部署
)

echo.
echo [4/8] 停止当前服务...
docker-compose down
echo ✅ 服务已停止

echo.
echo [5/8] 拉取最新代码...
git pull origin main
if %errorlevel% neq 0 (
    echo ⚠️ Git拉取失败，使用本地代码
)

echo.
echo [6/8] 安装依赖...
cd server
call npm ci --only=production
cd ..
echo ✅ 依赖安装完成

echo.
echo [7/8] 启动生产环境...
docker-compose -f docker-compose.prod.yml up -d
if %errorlevel% neq 0 (
    echo ❌ 启动失败
    pause
    exit /b 1
)
echo ✅ 生产环境已启动

echo.
echo [8/8] 等待服务就绪...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo ✅ 部署完成！
echo ========================================
echo.
echo 服务状态:
docker-compose -f docker-compose.prod.yml ps
echo.
echo 访问地址:
echo - 应用: http://localhost:3001
echo.
echo 查看日志:
echo docker-compose -f docker-compose.prod.yml logs -f
echo.
pause
