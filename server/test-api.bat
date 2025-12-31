@echo off
REM 启蒙之光 - API测试脚本 (Windows版本)
REM 用于快速测试后端API功能

echo 🌟 启蒙之光 - API测试脚本
echo ================================
echo.

set API_URL=http://localhost:3000

echo 1️⃣ 系统健康检查
echo 测试: 系统健康检查
curl -s %API_URL%/health
echo.
echo 测试: AI服务健康检查
curl -s %API_URL%/api/ai/health
echo.
echo.

echo 2️⃣ 用户注册
curl -s -X POST %API_URL%/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"13900139000\",\"password\":\"Test1234\",\"nickname\":\"测试小朋友\",\"age\":10}"
echo.
echo.

echo 3️⃣ 用户登录
curl -s -X POST %API_URL%/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"13900139000\",\"password\":\"Test1234\"}" > temp_login.json
echo 登录响应已保存到 temp_login.json
echo 请从文件中复制token，然后手动测试其他API
echo.
echo.

echo 4️⃣ 测试其他API需要使用token
echo 示例:
echo curl -H "Authorization: Bearer YOUR_TOKEN" %API_URL%/api/users/profile
echo.

echo 5️⃣ 获取作品画廊（无需token）
curl -s %API_URL%/api/works/gallery?page=1^&pageSize=5
echo.
echo.

echo 6️⃣ 获取探索页内容（无需token）
curl -s %API_URL%/api/explore
echo.
echo.

echo ================================
echo ✅ 基础测试完成！
echo.
echo 📝 注意事项：
echo 1. 完整测试需要从temp_login.json中获取token
echo 2. 如果AI相关测试失败，请检查Dify配置
echo 3. 数据库需要先运行迁移：npm run migrate
echo.
echo 🔗 更多信息请查看：
echo - server\MVP_COMPLETE_SUMMARY.md
echo - server\AI_QUICK_START.md
echo.

if exist temp_login.json (
    echo Token文件位置: temp_login.json
    type temp_login.json
)

pause
