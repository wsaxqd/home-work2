@echo off
chcp 65001 >nul
REM ============================================
REM 腾讯云镜像推送脚本 - 为 qmzg-ai-edu
REM ============================================

echo ================================
echo 启蒙之光 - 腾讯云镜像推送
echo ================================
echo.

REM 配置
set REGISTRY=ccr.ccs.tencentyun.com
set NAMESPACE=qmzg-ai-edu
set REPO=qmzg-edu

set SERVER_IMAGE=%REGISTRY%/%NAMESPACE%/%REPO%:server-latest
set APP_IMAGE=%REGISTRY%/%NAMESPACE%/%REPO%:app-latest

echo 目标仓库: %REGISTRY%/%NAMESPACE%/%REPO%
echo.
echo 将推送以下镜像:
echo   后端: %SERVER_IMAGE%
echo   前端: %APP_IMAGE%
echo.
echo ================================
echo 步骤1: 请先登录腾讯云
echo ================================
echo.
echo 请访问: https://console.cloud.tencent.com/tke2/registry
echo 点击 "访问凭证" - "生成临时登录指令"
echo.
echo 然后在新的命令行窗口执行登录命令:
echo   docker login --username=你的用户名 ccr.ccs.tencentyun.com
echo.
pause

echo.
echo ================================
echo 步骤2: 推送后端镜像
echo ================================
echo.
echo 正在推送 qmzg-server (约196MB)...
docker push %SERVER_IMAGE%
if errorlevel 1 (
    echo.
    echo ❌ 后端镜像推送失败!
    echo.
    echo 可能原因:
    echo   1. 未登录或登录已过期
    echo   2. 网络问题
    echo   3. 仓库权限问题
    echo.
    echo 解决方案:
    echo   1. 重新执行登录命令
    echo   2. 检查网络连接
    echo   3. 确认仓库 qmzg-ai-edu/qmzg-edu 存在
    echo.
    pause
    exit /b 1
)
echo ✅ 后端镜像推送成功!

echo.
echo ================================
echo 步骤3: 推送前端镜像
echo ================================
echo.
echo 正在推送 qmzg-app (约82MB)...
docker push %APP_IMAGE%
if errorlevel 1 (
    echo.
    echo ❌ 前端镜像推送失败!
    pause
    exit /b 1
)
echo ✅ 前端镜像推送成功!

echo.
echo ================================
echo ✅ 推送完成!
echo ================================
echo.
echo 推送的镜像:
echo   后端: %SERVER_IMAGE%
echo   前端: %APP_IMAGE%
echo.
echo 镜像大小:
echo   后端: 196MB
echo   前端: 82MB
echo.
echo 下一步:
echo   1. 访问控制台验证: https://console.cloud.tencent.com/tke2/registry/user/space
echo   2. 在服务器上拉取镜像进行部署
echo.
echo 拉取命令:
echo   docker pull %SERVER_IMAGE%
echo   docker pull %APP_IMAGE%
echo.
pause
