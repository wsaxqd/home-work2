@echo off
chcp 65001 >nul
REM ============================================
REM 腾讯云容器镜像仓库推送脚本 (Windows版)
REM ============================================

echo ================================
echo 腾讯云 CCR 镜像推送脚本
echo ================================
echo.

REM ============================================
REM 配置信息
REM ============================================

set REGISTRY_URL=ccr.ccs.tencentyun.com
set NAMESPACE=qmzg
set VERSION=latest

set LOCAL_SERVER_IMAGE=qmzg-server:latest
set LOCAL_APP_IMAGE=qmzg-app:latest

set REMOTE_SERVER_IMAGE=%REGISTRY_URL%/%NAMESPACE%/qmzg-server:%VERSION%
set REMOTE_APP_IMAGE=%REGISTRY_URL%/%NAMESPACE%/qmzg-app:%VERSION%

REM ============================================
REM 步骤1: 提示登录
REM ============================================

echo 步骤1: 登录腾讯云镜像仓库...
echo.
echo 请先在腾讯云控制台获取登录凭证:
echo 1. 访问: https://console.cloud.tencent.com/tke2/registry
echo 2. 点击"访问凭证" - "生成临时登录指令"
echo 3. 复制并执行登录命令
echo.
echo 登录命令示例:
echo docker login --username=你的用户名 ccr.ccs.tencentyun.com
echo.
pause

REM ============================================
REM 步骤2: 检查本地镜像
REM ============================================

echo.
echo 步骤2: 检查本地镜像...
echo.

docker images | findstr "qmzg-server.*latest" >nul
if errorlevel 1 (
    echo ❌ 未找到镜像: %LOCAL_SERVER_IMAGE%
    echo 请先构建镜像
    exit /b 1
) else (
    echo ✅ 找到本地镜像: %LOCAL_SERVER_IMAGE%
)

docker images | findstr "qmzg-app.*latest" >nul
if errorlevel 1 (
    echo ❌ 未找到镜像: %LOCAL_APP_IMAGE%
    echo 请先构建镜像
    exit /b 1
) else (
    echo ✅ 找到本地镜像: %LOCAL_APP_IMAGE%
)

REM ============================================
REM 步骤3: 打标签
REM ============================================

echo.
echo 步骤3: 为镜像打标签...
echo.

echo 正在为 qmzg-server 打标签...
docker tag %LOCAL_SERVER_IMAGE% %REMOTE_SERVER_IMAGE%
if errorlevel 1 (
    echo ❌ 打标签失败
    exit /b 1
)
echo ✅ %REMOTE_SERVER_IMAGE%

echo.
echo 正在为 qmzg-app 打标签...
docker tag %LOCAL_APP_IMAGE% %REMOTE_APP_IMAGE%
if errorlevel 1 (
    echo ❌ 打标签失败
    exit /b 1
)
echo ✅ %REMOTE_APP_IMAGE%

REM ============================================
REM 步骤4: 推送镜像
REM ============================================

echo.
echo 步骤4: 推送镜像到腾讯云...
echo.

echo 正在推送 qmzg-server 镜像...
echo 镜像大小约 196MB，可能需要几分钟...
docker push %REMOTE_SERVER_IMAGE%
if errorlevel 1 (
    echo ❌ qmzg-server 推送失败
    echo 可能原因:
    echo 1. 未登录或登录已过期
    echo 2. 命名空间不存在
    echo 3. 网络问题
    exit /b 1
)
echo ✅ qmzg-server 推送成功!

echo.
echo 正在推送 qmzg-app 镜像...
echo 镜像大小约 82MB，可能需要几分钟...
docker push %REMOTE_APP_IMAGE%
if errorlevel 1 (
    echo ❌ qmzg-app 推送失败
    exit /b 1
)
echo ✅ qmzg-app 推送成功!

REM ============================================
REM 步骤5: 显示结果
REM ============================================

echo.
echo ================================
echo ✅ 所有镜像推送完成!
echo ================================
echo.
echo 推送的镜像:
echo.
echo 后端镜像: %REMOTE_SERVER_IMAGE%
echo 前端镜像: %REMOTE_APP_IMAGE%
echo.
echo 你可以使用以下命令拉取镜像:
echo.
echo   docker pull %REMOTE_SERVER_IMAGE%
echo   docker pull %REMOTE_APP_IMAGE%
echo.
echo 下一步操作:
echo 1. 访问腾讯云控制台验证镜像已上传
echo    https://console.cloud.tencent.com/tke2/registry/user/space
echo.
echo 2. 在服务器上使用这些镜像进行部署
echo.
pause
