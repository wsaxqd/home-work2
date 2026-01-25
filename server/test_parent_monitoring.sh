#!/bin/bash

echo "=== 家长监控系统完整测试 ==="
echo

# 测试1: 发送验证码
echo "[1/18] 发送邮箱验证码..."
RESULT1=$(curl -s -X POST http://localhost:3000/api/parent/send-verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"parent_test@example.com"}')
if echo "$RESULT1" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT1"; fi
echo

sleep 2

# 测试2: 家长注册
echo "[2/18] 家长注册..."
RESULT2=$(curl -s -X POST http://localhost:3000/api/parent/register \
  -H "Content-Type: application/json" \
  -d '{"email":"parent_test@example.com","password":"Parent@123","name":"测试家长","phone":"13900001111","verifyCode":"123456"}')
if echo "$RESULT2" | grep -q '"success":true'; then
  echo "✅ 成功!";
  PARENT_TOKEN=$(echo "$RESULT2" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "家长Token: ${PARENT_TOKEN:0:50}..."
else
  echo "❌ 失败: $RESULT2";
  # 尝试登录获取token
  echo "尝试登录..."
  LOGIN_RESULT=$(curl -s -X POST http://localhost:3000/api/parent/login \
    -H "Content-Type: application/json" \
    -d '{"email":"parent_test@example.com","password":"Parent@123"}')
  if echo "$LOGIN_RESULT" | grep -q '"success":true'; then
    echo "✅ 登录成功!";
    PARENT_TOKEN=$(echo "$LOGIN_RESULT" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  fi
fi
echo

# 测试3: 家长登录
echo "[3/18] 家长登录..."
RESULT3=$(curl -s -X POST http://localhost:3000/api/parent/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent_test@example.com","password":"Parent@123"}')
if echo "$RESULT3" | grep -q '"success":true'; then
  echo "✅ 成功!";
  PARENT_TOKEN=$(echo "$RESULT3" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
  echo "❌ 失败: $RESULT3";
fi
echo

# 如果没有token,无法继续测试
if [ -z "$PARENT_TOKEN" ]; then
  echo "❌ 无法获取家长Token,终止测试"
  exit 1
fi

# 测试4: 获取家长资料
echo "[4/18] 获取家长资料..."
RESULT4=$(curl -s -X GET http://localhost:3000/api/parent/profile \
  -H "Authorization: Bearer $PARENT_TOKEN")
if echo "$RESULT4" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT4"; fi
echo

# 测试5: 更新家长资料
echo "[5/18] 更新家长资料..."
RESULT5=$(curl -s -X PUT http://localhost:3000/api/parent/profile \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试家长更新","phone":"13900001112"}')
if echo "$RESULT5" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT5"; fi
echo

# 需要一个学生账号来测试关联
# 使用之前创建的test_ai_user账号
STUDENT_USER_ID="997833c2-7a41-40e0-ad59-eb559787c8b6"

# 测试6: 关联孩子账号
echo "[6/18] 关联孩子账号..."
RESULT6=$(curl -s -X POST http://localhost:3000/api/parent/children/link \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"childUserId\":\"$STUDENT_USER_ID\",\"relationship\":\"father\",\"canViewData\":true,\"canSetLimits\":true,\"canReceiveNotifications\":true}")
if echo "$RESULT6" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT6"; fi
echo

# 测试7: 获取孩子列表
echo "[7/18] 获取孩子列表..."
RESULT7=$(curl -s -X GET http://localhost:3000/api/parent/children \
  -H "Authorization: Bearer $PARENT_TOKEN")
if echo "$RESULT7" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT7"; fi
echo

# 测试8: 获取孩子资料
echo "[8/18] 获取孩子资料..."
RESULT8=$(curl -s -X GET "http://localhost:3000/api/parent/children/$STUDENT_USER_ID/profile" \
  -H "Authorization: Bearer $PARENT_TOKEN")
if echo "$RESULT8" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT8"; fi
echo

# 测试9: 获取孩子学习数据
echo "[9/18] 获取孩子学习数据..."
RESULT9=$(curl -s -X GET "http://localhost:3000/api/parent/children/$STUDENT_USER_ID/study-data" \
  -H "Authorization: Bearer $PARENT_TOKEN")
if echo "$RESULT9" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT9"; fi
echo

# 测试10: 获取使用历史
echo "[10/18] 获取使用历史..."
RESULT10=$(curl -s -X GET "http://localhost:3000/api/parent/children/$STUDENT_USER_ID/usage-history" \
  -H "Authorization: Bearer $PARENT_TOKEN")
if echo "$RESULT10" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT10"; fi
echo

# 测试11: 获取学习进度
echo "[11/18] 获取学习进度..."
RESULT11=$(curl -s -X GET "http://localhost:3000/api/parent/children/$STUDENT_USER_ID/learning-progress" \
  -H "Authorization: Bearer $PARENT_TOKEN")
if echo "$RESULT11" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT11"; fi
echo

# 使用学生token测试家长控制设置(需要学生身份)
STUDENT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTc4MzNjMi03YTQxLTQwZTAtYWQ1OS1lYjU1OTc4N2M4YjYiLCJpYXQiOjE3Njg5OTI0NjQsImV4cCI6MTc2OTU5NzI2NH0.t--OVd_ydyaneHr2rLEGsE-KwTN9DNUV0ZeA6bTSkNc"

# 测试12: 获取家长控制设置
echo "[12/18] 获取家长控制设置(学生视角)..."
RESULT12=$(curl -s -X GET http://localhost:3000/api/parental/settings \
  -H "Authorization: Bearer $STUDENT_TOKEN")
if echo "$RESULT12" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT12"; fi
echo

# 测试13: 更新家长控制设置
echo "[13/18] 更新家长控制设置(学生视角)..."
RESULT13=$(curl -s -X PUT http://localhost:3000/api/parental/settings \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dailyTimeLimit":120,"enableContentFilter":true,"enableLocationTracking":false}')
if echo "$RESULT13" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT13"; fi
echo

# 测试14: 记录使用时长
echo "[14/18] 记录使用时长(学生视角)..."
RESULT14=$(curl -s -X POST http://localhost:3000/api/parental/log-usage \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"featureType":"learning","duration":30,"activityData":{"action":"study"}}')
if echo "$RESULT14" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT14"; fi
echo

# 测试15: 获取今日使用时长
echo "[15/18] 获取今日使用时长(学生视角)..."
RESULT15=$(curl -s -X GET http://localhost:3000/api/parental/today-usage \
  -H "Authorization: Bearer $STUDENT_TOKEN")
if echo "$RESULT15" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT15"; fi
echo

# 测试16: 获取使用统计
echo "[16/18] 获取使用统计(学生视角)..."
RESULT16=$(curl -s -X GET "http://localhost:3000/api/parental/usage-stats?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer $STUDENT_TOKEN")
if echo "$RESULT16" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT16"; fi
echo

# 测试17: 检查时长限制
echo "[17/18] 检查时长限制(学生视角)..."
RESULT17=$(curl -s -X GET http://localhost:3000/api/parental/check-limit \
  -H "Authorization: Bearer $STUDENT_TOKEN")
if echo "$RESULT17" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT17"; fi
echo

# 测试18: 解除关联(放到最后,避免影响其他测试)
echo "[18/18] 解除孩子关联..."
RESULT18=$(curl -s -X DELETE "http://localhost:3000/api/parent/children/$STUDENT_USER_ID" \
  -H "Authorization: Bearer $PARENT_TOKEN")
if echo "$RESULT18" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT18"; fi
echo

echo "=== 测试完成 ==="
