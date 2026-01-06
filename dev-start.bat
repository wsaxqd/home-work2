@echo off
REM ============================================================
REM 启蒙之光 - 开发环境启动脚本（Windows）
REM 项目：qmzg (启蒙之光)
REM 用途：一键启动开发环境
REM ============================================================

setlocal enabledelayedexpansion

REM 项目信息
set PROJECT_NAME=启蒙之光 (qmzg)
set COMPOSE_FILE=docker-compose.dev.yml
set ENV_FILE=.env.development

REM 颜色定义（Windows 10+ 支持 ANSI 颜色）
set "ESC="
set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "BLUE=%ESC%[94m"
set "NC=%ESC%[0m"

REM 启用 ANSI 颜色支持
for /f "tokens=*" %%i in ('echo prompt $E ^| cmd') do set "ESC=%%i"

:MAIN
call :PRINT_HEADER
call :CHECK_DOCKER
call :CHECK_ENV_FILE
call :SHOW_MENU
goto :EOF

REM ========== 函数定义 ==========

:PRINT_HEADER
echo.
echo ============================================================
echo   %PROJECT_NAME% - 开发环境管理
echo ============================================================
echo.
goto :EOF

:PRINT_INFO
echo [i] %~1
goto :EOF

:PRINT_SUCCESS
echo [√] %~1
goto :EOF

:PRINT_WARNING
echo [!] %~1
goto :EOF

:PRINT_ERROR
echo [X] %~1
goto :EOF

:CHECK_DOCKER
call :PRINT_INFO "检查 Docker 环境..."

docker --version >nul 2>&1
if errorlevel 1 (
    call :PRINT_ERROR "Docker 未安装，请先安装 Docker Desktop"
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        call :PRINT_ERROR "Docker Compose 未安装"
        pause
        exit /b 1
    )
)

call :PRINT_SUCCESS "Docker 环境检查通过"
goto :EOF

:CHECK_ENV_FILE
call :PRINT_INFO "检查环境变量配置..."

if not exist "%ENV_FILE%" (
    call :PRINT_WARNING "环境变量文件 %ENV_FILE% 不存在"

    if exist ".env.development.example" (
        call :PRINT_INFO "从示例文件创建 %ENV_FILE%"
        copy .env.development.example "%ENV_FILE%" >nul
        call :PRINT_WARNING "请编辑 %ENV_FILE% 文件，配置 Dify API 密钥等参数"
        pause
    ) else (
        call :PRINT_ERROR "示例配置文件不存在，无法创建环境变量文件"
        pause
        exit /b 1
    )
)

call :PRINT_SUCCESS "环境变量文件检查通过"
goto :EOF

:SHOW_MENU
cls
call :PRINT_HEADER
echo 请选择操作：
echo.
echo   1) 启动开发环境（构建 + 启动）
echo   2) 启动开发环境（不重新构建）
echo   3) 重启所有服务
echo   4) 停止所有服务
echo   5) 停止并删除所有容器
echo   6) 停止并删除所有数据（危险）
echo   7) 查看服务状态
echo   8) 查看实时日志
echo   9) 进入后端容器
echo  10) 清理 Docker 资源
echo  11) 验证架构配置
echo   0) 退出
echo.
set /p choice="请输入选项 [0-11]: "

if "%choice%"=="1" goto START_WITH_BUILD
if "%choice%"=="2" goto START_WITHOUT_BUILD
if "%choice%"=="3" goto RESTART_SERVICES
if "%choice%"=="4" goto STOP_SERVICES
if "%choice%"=="5" goto REMOVE_CONTAINERS
if "%choice%"=="6" goto REMOVE_ALL_DATA
if "%choice%"=="7" goto SHOW_STATUS
if "%choice%"=="8" goto SHOW_LOGS
if "%choice%"=="9" goto ENTER_BACKEND
if "%choice%"=="10" goto CLEANUP_DOCKER
if "%choice%"=="11" goto VERIFY_ARCHITECTURE
if "%choice%"=="0" goto EXIT_SCRIPT

call :PRINT_ERROR "无效选项，请重新选择"
timeout /t 2 >nul
goto SHOW_MENU

:START_WITH_BUILD
call :PRINT_INFO "启动开发环境（重新构建镜像）..."
docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% up -d --build

if errorlevel 1 (
    call :PRINT_ERROR "启动失败，请查看错误信息"
) else (
    call :PRINT_SUCCESS "开发环境启动成功！"
    call :SHOW_ACCESS_INFO
)
pause
goto SHOW_MENU

:START_WITHOUT_BUILD
call :PRINT_INFO "启动开发环境..."
docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% up -d

if errorlevel 1 (
    call :PRINT_ERROR "启动失败，请查看错误信息"
) else (
    call :PRINT_SUCCESS "开发环境启动成功！"
    call :SHOW_ACCESS_INFO
)
pause
goto SHOW_MENU

:RESTART_SERVICES
call :PRINT_INFO "重启所有服务..."
docker-compose -f %COMPOSE_FILE% restart
call :PRINT_SUCCESS "服务重启完成"
pause
goto SHOW_MENU

:STOP_SERVICES
call :PRINT_INFO "停止所有服务..."
docker-compose -f %COMPOSE_FILE% stop
call :PRINT_SUCCESS "服务已停止"
pause
goto SHOW_MENU

:REMOVE_CONTAINERS
call :PRINT_WARNING "即将停止并删除所有容器（保留数据卷）"
set /p confirm="确认操作？(y/N): "

if /i "%confirm%"=="y" (
    call :PRINT_INFO "删除容器..."
    docker-compose -f %COMPOSE_FILE% down
    call :PRINT_SUCCESS "容器已删除"
) else (
    call :PRINT_INFO "操作已取消"
)
pause
goto SHOW_MENU

:REMOVE_ALL_DATA
call :PRINT_ERROR "危险操作：即将删除所有容器和数据卷！"
call :PRINT_WARNING "这将删除数据库数据、上传文件等所有持久化数据"
set /p confirm="确认删除所有数据？(yes/N): "

if /i "%confirm%"=="yes" (
    call :PRINT_INFO "删除所有容器和数据..."
    docker-compose -f %COMPOSE_FILE% down -v
    call :PRINT_SUCCESS "所有数据已删除"
) else (
    call :PRINT_INFO "操作已取消"
)
pause
goto SHOW_MENU

:SHOW_STATUS
call :PRINT_INFO "服务运行状态："
echo.
docker-compose -f %COMPOSE_FILE% ps
echo.
pause
goto SHOW_MENU

:SHOW_LOGS
call :PRINT_INFO "显示实时日志（Ctrl+C 退出）..."
docker-compose -f %COMPOSE_FILE% logs -f
goto SHOW_MENU

:ENTER_BACKEND
call :PRINT_INFO "进入后端容器（输入 exit 退出）..."
docker exec -it qmzg-server-dev sh
goto SHOW_MENU

:CLEANUP_DOCKER
call :PRINT_WARNING "清理未使用的 Docker 资源"
echo.
echo 将清理：
echo   - 未使用的容器
echo   - 未使用的镜像
echo   - 未使用的网络
echo.
set /p confirm="确认清理？(y/N): "

if /i "%confirm%"=="y" (
    call :PRINT_INFO "清理中..."
    docker system prune -f
    call :PRINT_SUCCESS "清理完成"
) else (
    call :PRINT_INFO "操作已取消"
)
pause
goto SHOW_MENU

:VERIFY_ARCHITECTURE
cls
call :PRINT_HEADER
call :PRINT_INFO "验证工业级架构配置..."
echo.

REM 1. 检查显式网络
call :PRINT_INFO "[原则1: 内部通话] 检查显式命名网络..."
docker network ls | findstr "qmzg-internal-dev-network" >nul
if errorlevel 1 (
    call :PRINT_WARNING "显式网络未找到"
) else (
    call :PRINT_SUCCESS "显式网络已创建：qmzg-internal-dev-network"
)
echo.

REM 2. 检查匿名卷保护
call :PRINT_INFO "[原则2: 依赖保护区] 检查 node_modules 匿名卷..."
docker ps | findstr "qmzg-server-dev" >nul
if errorlevel 1 (
    call :PRINT_WARNING "后端容器未运行"
) else (
    docker exec qmzg-server-dev sh -c "ls /app/node_modules | head -5" 2>nul
    if errorlevel 1 (
        call :PRINT_WARNING "无法访问 node_modules"
    ) else (
        call :PRINT_SUCCESS "node_modules 匿名卷保护生效"
    )
)
echo.

REM 3. 检查命名卷
call :PRINT_INFO "[原则3: 数据安全] 检查命名卷持久化..."
docker volume ls | findstr "qmzg"
echo.

REM 4. 检查环境变量
call :PRINT_INFO "[原则4: 变量剥离] 检查环境变量配置..."
if exist "%ENV_FILE%" (
    call :PRINT_SUCCESS "环境变量文件存在：%ENV_FILE%"
) else (
    call :PRINT_WARNING "环境变量文件不存在"
)
echo.

REM 5. 测试内部通信
call :PRINT_INFO "[内部通信测试] 后端 → 数据库..."
docker ps | findstr "qmzg-server-dev" >nul
if not errorlevel 1 (
    docker exec qmzg-server-dev ping -c 1 postgres >nul 2>&1
    if errorlevel 1 (
        call :PRINT_WARNING "内部通信失败"
    ) else (
        call :PRINT_SUCCESS "内部通信正常（server → postgres）"
    )
)

echo.
call :PRINT_SUCCESS "架构验证完成！"
echo.
pause
goto SHOW_MENU

:SHOW_ACCESS_INFO
echo.
echo ============================================================
echo   服务访问地址
echo ============================================================
echo.
echo   React 前端:     http://localhost:5173
echo   后端 API:       http://localhost:3000
echo   静态 HTML:      http://localhost:8080
echo   PostgreSQL:     localhost:5432
echo.
echo ============================================================
echo.
goto :EOF

:EXIT_SCRIPT
call :PRINT_INFO "退出脚本"
exit /b 0

endlocal
