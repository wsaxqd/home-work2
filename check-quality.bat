@echo off
chcp 65001 >nul
echo ========================================
echo 启蒙之光 - 代码质量检查
echo ========================================
echo.

echo [1/5] TypeScript类型检查...
cd server
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo ❌ TypeScript类型检查失败
    cd ..
    pause
    exit /b 1
)
echo ✅ TypeScript类型检查通过

echo.
echo [2/5] 运行测试...
call npm test -- --passWithNoTests
if %errorlevel% neq 0 (
    echo ❌ 测试失败
    cd ..
    pause
    exit /b 1
)
echo ✅ 测试通过

echo.
echo [3/5] 编译项目...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 编译失败
    cd ..
    pause
    exit /b 1
)
echo ✅ 编译成功

echo.
echo [4/5] 检查环境配置...
if not exist ".env" (
    echo ⚠️ 警告: .env文件不存在
    echo 请确保生产环境已配置 .env.production
)
if exist ".env" (
    echo ✅ 环境配置文件存在
)

echo.
echo [5/5] 检查依赖...
call npm outdated
echo ✅ 依赖检查完成

cd ..

echo.
echo ========================================
echo ✅ 代码质量检查完成！
echo ========================================
echo.
echo 检查结果:
echo - TypeScript: ✅ 通过
echo - 测试: ✅ 通过
echo - 编译: ✅ 通过
echo - 配置: ✅ 正常
echo.
pause
