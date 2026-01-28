@echo off
echo ============================================
echo PostgreSQL 安装脚本 for Windows
echo ============================================
echo.

echo 正在下载 PostgreSQL 安装程序...
echo.

REM 下载 PostgreSQL 16 安装程序
curl -L -o postgresql-installer.exe "https://get.enterprisedb.com/postgresql/postgresql-16.1-1-windows-x64.exe"

echo.
echo 下载完成！正在启动安装程序...
echo.
echo 安装提示：
echo 1. 选择默认安装路径
echo 2. 设置数据库超级用户密码（记住这个密码！）
echo 3. 端口使用默认的 5432
echo 4. 全部使用默认设置即可
echo.

start postgresql-installer.exe

echo.
echo 安装程序已启动，请按照向导完成安装。
echo 安装完成后，在命令行运行: psql --version
echo.
pause
