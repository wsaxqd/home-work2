@echo off
REM
REM 启蒙之光 V1.0 - Git 历史清理脚本 (Windows)
REM
REM 功能：移除所有 .env 配置文件和敏感信息
REM 用途：清理不小心提交到 Git 的密钥和密码
REM
REM 注意：此脚本会重写 Git 历史，执行后需要强制推送
REM

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo   启蒙之光 V1.0 - Git 历史清理
echo ==========================================
echo.

REM 检查是否在 Git 仓库中
if not exist .git (
    echo ❌ 错误：当前目录不是 Git 仓库
    exit /b 1
)

REM 获取当前分支
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i
echo 📍 当前分支：%BRANCH%

REM 获取提交数
for /f "tokens=*" %%i in ('git rev-list --all --count') do set COMMITS=%%i
echo 📊 总提交数：%COMMITS%
echo.

REM 确认操作
echo ⚠️  警告：此操作将重写 Git 历史！
echo ⚠️  请确保：
echo    1. 所有本地更改已提交
echo    2. 所有团队成员已备份本地仓库
echo    3. 你已获得仓库管理员权限
echo.
set /p CONFIRM="继续清理？(输入 yes 确认): "

if /i not "%CONFIRM%"=="yes" (
    echo ❌ 已取消
    exit /b 0
)

echo.
echo 正在清理 .env 文件...

REM 设置环境变量以避免警告
set FILTER_BRANCH_SQUELCH_WARNING=1

REM 清理所有 .env 文件
git filter-branch --force --index-filter ^
  "git rm -r --cached --ignore-unmatch .env .env.*" ^
  --prune-empty --tag-name-filter cat -- --all

if %ERRORLEVEL% neq 0 (
    echo ❌ .env 文件清理失败
    exit /b 1
)

echo ✅ .env 文件已删除
echo.

REM 清理引用日志
echo 正在清理引用日志...
if exist .git\refs\original (
    rmdir /s /q .git\refs\original
)
git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo ✅ 引用日志已清理
echo.

REM 验证清理结果
echo 正在验证清理结果...
git log --all --full-history -- ".env" > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ⚠️  警告：仍然存在对 .env 文件的引用
) else (
    echo ✅ 验证成功：.env 文件已完全移除
)

echo.
echo ==========================================
echo   清理完成！
echo ==========================================
echo.
echo 📌 后续步骤：
echo 1. 验证本地文件完整性
echo 2. 强制推送到远程：
echo    git push origin --force --all
echo    git push origin --force --tags
echo 3. 通知所有团队成员重新克隆仓库
echo 4. 删除本地 .env 备份（确保不包含敏感信息）
echo.
echo ✅ 脚本执行完成
echo.

pause
