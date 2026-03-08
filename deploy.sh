#!/bin/bash

# 启蒙之光 - 部署脚本
# 使用方法: bash deploy.sh

set -e

echo "🚀 开始部署启蒙之光..."

# 1. 构建前端
echo "📦 构建前端..."
cd app
npm install
npm run build
cd ..

# 2. 构建后端
echo "📦 构建后端..."
cd server
npm install
npm run build
cd ..

# 3. 数据库迁移
echo "🗄️ 运行数据库迁移..."
cd server
npm run migrate
cd ..

echo "✅ 构建完成！"
echo ""
echo "📋 下一步操作："
echo "1. 配置 server/.env.production"
echo "2. 启动服务: pm2 start ecosystem.config.js"
echo "3. 配置 Nginx 反向代理"
