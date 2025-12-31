#!/bin/bash

# 启蒙之光 - API测试脚本
# 用于快速测试后端API功能

echo "🌟 启蒙之光 - API测试脚本"
echo "================================"
echo ""

# 服务器地址
API_URL="http://localhost:3000"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4
    local token=$5

    echo -e "${BLUE}测试: ${name}${NC}"

    if [ -n "$data" ] && [ -n "$token" ]; then
        response=$(curl -s -X $method "$API_URL$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data")
    elif [ -n "$data" ]; then
        response=$(curl -s -X $method "$API_URL$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ -n "$token" ]; then
        response=$(curl -s -X $method "$API_URL$url" \
            -H "Authorization: Bearer $token")
    else
        response=$(curl -s -X $method "$API_URL$url")
    fi

    if echo "$response" | grep -q "\"success\":true"; then
        echo -e "${GREEN}✓ 成功${NC}"
    else
        echo -e "${RED}✗ 失败${NC}"
        echo "响应: $response"
    fi
    echo ""
}

# 1. 系统健康检查
echo "1️⃣ 系统健康检查"
test_api "系统健康检查" "/health"
test_api "AI服务健康检查" "/api/ai/health"

# 2. 用户注册
echo "2️⃣ 用户注册"
REGISTER_DATA='{
  "phone": "13900139000",
  "password": "Test1234",
  "nickname": "测试小朋友",
  "age": 10
}'
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA")

if echo "$REGISTER_RESPONSE" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✓ 注册成功${NC}"
else
    echo -e "${BLUE}ℹ 用户可能已存在，尝试登录...${NC}"
fi
echo ""

# 3. 用户登录
echo "3️⃣ 用户登录"
LOGIN_DATA='{
  "phone": "13900139000",
  "password": "Test1234"
}'
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

if echo "$LOGIN_RESPONSE" | grep -q "\"success\":true"; then
    echo -e "${GREEN}✓ 登录成功${NC}"
    # 提取token
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ 登录失败${NC}"
    echo "响应: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 4. 获取用户信息
echo "4️⃣ 获取用户信息"
test_api "获取个人资料" "/api/users/profile" "GET" "" "$TOKEN"

# 5. 首页API
echo "5️⃣ 首页内容"
test_api "获取首页推荐" "/api/home" "GET" "" "$TOKEN"

# 6. AI对话测试
echo "6️⃣ AI对话测试"
CHAT_DATA='{
  "messages": [
    {
      "role": "user",
      "content": "你好，小光！"
    }
  ]
}'
test_api "AI对话" "/api/ai/chat" "POST" "$CHAT_DATA" "$TOKEN"

# 7. 故事生成测试
echo "7️⃣ 故事生成测试"
STORY_DATA='{
  "prompt": "一只勇敢的小兔子",
  "theme": "童话",
  "length": "short"
}'
test_api "AI生成故事" "/api/ai/story" "POST" "$STORY_DATA" "$TOKEN"

# 8. 获取作品画廊
echo "8️⃣ 作品画廊"
test_api "获取公开作品" "/api/works/gallery?page=1&pageSize=5"
test_api "获取热门作品" "/api/works/trending?limit=5"

# 9. 游戏题目测试
echo "9️⃣ 游戏系统测试"
test_api "获取图像识别题目" "/api/games/questions?gameType=image_recognition&limit=3" "GET" "" "$TOKEN"

# 10. 探索页内容
echo "🔟 探索页内容"
test_api "获取探索页" "/api/explore"

echo "================================"
echo -e "${GREEN}✅ 测试完成！${NC}"
echo ""
echo "📝 注意事项："
echo "1. 如果AI相关测试失败，请检查Dify配置"
echo "2. Token有效期为7天"
echo "3. 数据库需要先运行迁移：npm run migrate"
echo ""
echo "🔗 更多信息请查看："
echo "- server/MVP_COMPLETE_SUMMARY.md"
echo "- server/AI_QUICK_START.md"
