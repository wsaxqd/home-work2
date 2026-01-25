#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTc4MzNjMi03YTQxLTQwZTAtYWQ1OS1lYjU1OTc4N2M4YjYiLCJpYXQiOjE3Njg5OTI0NjQsImV4cCI6MTc2OTU5NzI2NH0.t--OVd_ydyaneHr2rLEGsE-KwTN9DNUV0ZeA6bTSkNc"

echo "=== AI助手功能完整测试 ==="
echo

echo "[1/6] 获取错题列表..."
RESULT1=$(curl -s -X GET "http://localhost:3000/api/wrong-questions?subject=math&limit=5" \
  -H "Authorization: Bearer $TOKEN")
if echo "$RESULT1" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT1"; fi
echo

echo "[2/6] 学习诊断..."
RESULT2=$(curl -s -X POST http://localhost:3000/api/ai-assistant/diagnosis \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"math","diagnosisType":"on_demand"}')
if echo "$RESULT2" | grep -q '"success":true'; then
  echo "✅ 成功!";
  DIAGNOSIS_ID=$(echo "$RESULT2" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
  echo "诊断ID: $DIAGNOSIS_ID"
else
  echo "❌ 失败: $RESULT2";
fi
echo

sleep 1

echo "[3/6] AI题目讲解..."
RESULT3=$(curl -s -X POST http://localhost:3000/api/ai-assistant/explain-question \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questionText":"35 × 28 = ?","correctAnswer":"980","userAnswer":"920","subject":"math"}')
if echo "$RESULT3" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT3"; fi
echo

echo "[4/6] 创建学习计划..."
RESULT4=$(curl -s -X POST http://localhost:3000/api/ai-assistant/learning-plan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"diagnosisId\":$DIAGNOSIS_ID,\"planDuration\":7,\"dailyStudyMinutes\":30}")
if echo "$RESULT4" | grep -q '"success":true'; then
  echo "✅ 成功!";
  PLAN_ID=$(echo "$RESULT4" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
  echo "计划ID: $PLAN_ID"
else
  echo "❌ 失败: $RESULT4";
fi
echo

echo "[5/6] 获取学习计划详情..."
RESULT5=$(curl -s -X GET "http://localhost:3000/api/ai-assistant/learning-plans/$PLAN_ID" \
  -H "Authorization: Bearer $TOKEN")
if echo "$RESULT5" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT5"; fi
echo

echo "[6/6] AI伙伴聊天..."
RESULT6=$(curl -s -X POST http://localhost:3000/api/ai-assistant/companion/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"你好，我今天数学作业有点难"}')
if echo "$RESULT6" | grep -q '"success":true'; then echo "✅ 成功!"; else echo "❌ 失败: $RESULT6"; fi

echo
echo "=== 测试完成 ==="
