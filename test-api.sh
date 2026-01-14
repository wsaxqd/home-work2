#!/bin/bash

echo "================================"
echo "API功能测试脚本"
echo "================================"
echo ""

BASE_URL="http://localhost:3000"

# 1. 测试健康检查
echo "1. 测试健康检查..."
curl -s $BASE_URL/health
echo -e "\n"

# 2. 测试家长端注册
echo "2. 测试家长端注册..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/parent/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"13900139000","password":"test123456","name":"测试家长","email":"test@example.com"}')
echo $REGISTER_RESPONSE
echo -e "\n"

# 3. 测试家长端登录
echo "3. 测试家长端登录..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/parent/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13900139000","password":"test123456"}')
echo $LOGIN_RESPONSE
echo -e "\n"

echo "================================"
echo "测试完成"
echo "================================"
