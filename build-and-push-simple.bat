@echo off
REM ============================================================
REM 启蒙之光 - Docker 镜像构建和推送脚本 (Windows 版)
REM ============================================================

echo ========================================
echo   启蒙之光 Docker 镜像构建工具
echo ========================================
echo.

REM 配置信息
set REGISTRY_URL=ccr.ccs.tencentyun.com
set NAMESPACE=qmzg
set VERSION=v1.0.0

echo [信息] 镜像仓库: %REGISTRY_URL%
echo [信息] 命名空间: %NAMESPACE%
echo [信息] 版本标签: %VERSION%
echo.

REM 步骤1: 登录腾讯云镜像仓库
echo ========================================
echo 步骤 1: 登录腾讯云镜像仓库
echo ========================================
echo.
echo 请输入腾讯云容器镜像服务的用户名和密码
echo 提示: 在腾讯云控制台 - 容器镜像服务 - 访问凭证 中获取
echo.

docker login %REGISTRY_URL%
if errorlevel 1 (
    echo [错误] 登录失败，请检查凭证
    pause
    exit /b 1
)

echo [成功] 登录成功
echo.

REM 步骤2: 构建后端镜像
echo ========================================
echo 步骤 2: 构建后端镜像
echo ========================================
echo.

docker build ^
    --file server/Dockerfile ^
    --target production ^
    --tag %REGISTRY_URL%/%NAMESPACE%/qmzg-server:%VERSION% ^
    --tag %REGISTRY_URL%/%NAMESPACE%/qmzg-server:latest ^
    ./server

if errorlevel 1 (
    echo [错误] 后端镜像构建失败
    pause
    exit /b 1
)

echo [成功] 后端镜像构建完成
echo.

REM 步骤3: 构建前端镜像
echo ========================================
echo 步骤 3: 构建前端镜像
echo ========================================
echo.

docker build ^
    --file app/Dockerfile ^
    --target production ^
    --tag %REGISTRY_URL%/%NAMESPACE%/qmzg-app:%VERSION% ^
    --tag %REGISTRY_URL%/%NAMESPACE%/qmzg-app:latest ^
    ./app

if errorlevel 1 (
    echo [错误] 前端镜像构建失败
    pause
    exit /b 1
)

echo [成功] 前端镜像构建完成
echo.

REM 步骤4: 推送镜像到仓库
echo ========================================
echo 步骤 4: 推送镜像到仓库
echo ========================================
echo.

echo [信息] 推送后端镜像...
docker push %REGISTRY_URL%/%NAMESPACE%/qmzg-server:%VERSION%
docker push %REGISTRY_URL%/%NAMESPACE%/qmzg-server:latest

echo.
echo [信息] 推送前端镜像...
docker push %REGISTRY_URL%/%NAMESPACE%/qmzg-app:%VERSION%
docker push %REGISTRY_URL%/%NAMESPACE%/qmzg-app:latest

echo.
echo ========================================
echo   构建和推送完成！
echo ========================================
echo.
echo 镜像信息:
echo   后端: %REGISTRY_URL%/%NAMESPACE%/qmzg-server:%VERSION%
echo   前端: %REGISTRY_URL%/%NAMESPACE%/qmzg-app:%VERSION%
echo.
echo 下一步: 在服务器上执行部署命令
echo.

pause
