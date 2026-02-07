#!/bin/bash

# ============================================
# 腾讯云容器镜像仓库推送脚本
# ============================================

set -e  # 遇到错误立即退出

echo "================================"
echo "腾讯云 CCR 镜像推送脚本"
echo "================================"
echo ""

# ============================================
# 配置信息（请根据实际情况修改）
# ============================================

# 腾讯云镜像仓库地址（个人版）
REGISTRY_URL="ccr.ccs.tencentyun.com"

# 命名空间（建议使用项目名）
NAMESPACE="qmzg"

# 镜像版本标签
VERSION="v1.0.0"

# 本地镜像名称
LOCAL_SERVER_IMAGE="qmzg-server:latest"
LOCAL_APP_IMAGE="qmzg-app:latest"

# 远程镜像完整路径
REMOTE_SERVER_IMAGE="${REGISTRY_URL}/${NAMESPACE}/qmzg-server:${VERSION}"
REMOTE_APP_IMAGE="${REGISTRY_URL}/${NAMESPACE}/qmzg-app:${VERSION}"

# ============================================
# 步骤1: 登录腾讯云镜像仓库
# ============================================

echo "步骤1: 登录腾讯云镜像仓库..."
echo ""
echo "请输入腾讯云账号信息："
echo "提示: 用户名是你的腾讯云账号ID(可在账号中心查看)"
echo "      密码是在容器镜像服务中创建的访问凭证密码"
echo ""

# 提示用户手动登录
echo "请在另一个终端窗口执行以下命令登录:"
echo ""
echo "  docker login ccr.ccs.tencentyun.com"
echo ""
read -p "登录完成后,按Enter继续..."

# ============================================
# 步骤2: 检查本地镜像
# ============================================

echo ""
echo "步骤2: 检查本地镜像..."
echo ""

if docker images | grep -q "qmzg-server.*latest"; then
    echo "✅ 找到本地镜像: ${LOCAL_SERVER_IMAGE}"
else
    echo "❌ 未找到镜像: ${LOCAL_SERVER_IMAGE}"
    echo "请先构建镜像: docker build -t qmzg-server:latest ./server"
    exit 1
fi

if docker images | grep -q "qmzg-app.*latest"; then
    echo "✅ 找到本地镜像: ${LOCAL_APP_IMAGE}"
else
    echo "❌ 未找到镜像: ${LOCAL_APP_IMAGE}"
    echo "请先构建镜像: docker build -t qmzg-app:latest ./app"
    exit 1
fi

# ============================================
# 步骤3: 打标签
# ============================================

echo ""
echo "步骤3: 为镜像打标签..."
echo ""

echo "正在为 qmzg-server 打标签..."
docker tag ${LOCAL_SERVER_IMAGE} ${REMOTE_SERVER_IMAGE}
echo "✅ ${REMOTE_SERVER_IMAGE}"

echo ""
echo "正在为 qmzg-app 打标签..."
docker tag ${LOCAL_APP_IMAGE} ${REMOTE_APP_IMAGE}
echo "✅ ${REMOTE_APP_IMAGE}"

# ============================================
# 步骤4: 推送镜像
# ============================================

echo ""
echo "步骤4: 推送镜像到腾讯云..."
echo ""

echo "正在推送 qmzg-server..."
docker push ${REMOTE_SERVER_IMAGE}
echo "✅ qmzg-server 推送成功!"

echo ""
echo "正在推送 qmzg-app..."
docker push ${REMOTE_APP_IMAGE}
echo "✅ qmzg-app 推送成功!"

# ============================================
# 步骤5: 验证推送结果
# ============================================

echo ""
echo "步骤5: 验证推送结果..."
echo ""

echo "推送完成! 镜像信息:"
echo ""
echo "后端镜像: ${REMOTE_SERVER_IMAGE}"
echo "前端镜像: ${REMOTE_APP_IMAGE}"
echo ""
echo "你可以使用以下命令拉取镜像:"
echo ""
echo "  docker pull ${REMOTE_SERVER_IMAGE}"
echo "  docker pull ${REMOTE_APP_IMAGE}"
echo ""

# ============================================
# 完成
# ============================================

echo "================================"
echo "✅ 所有镜像推送完成!"
echo "================================"
echo ""
echo "下一步操作:"
echo "1. 登录腾讯云控制台验证镜像"
echo "2. 在服务器上拉取镜像并部署"
echo ""
