#!/bin/bash
#
# 启蒙之光 V1.0 - Git 历史清理脚本 (Linux/Mac)
#
# 功能：移除所有 .env 配置文件和敏感信息
# 用途：清理不小心提交到 Git 的密钥和密码
#
# 注意：此脚本会重写 Git 历史，执行后需要强制推送
#

set -e

echo "=========================================="
echo "  启蒙之光 V1.0 - Git 历史清理"
echo "=========================================="
echo ""

# 检查是否在 Git 仓库中
if [ ! -d .git ]; then
    echo "❌ 错误：当前目录不是 Git 仓库"
    exit 1
fi

# 显示当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 当前分支：$CURRENT_BRANCH"

# 备份提交数
TOTAL_COMMITS=$(git rev-list --all --count)
echo "📊 总提交数：$TOTAL_COMMITS"
echo ""

# 确认操作
echo "⚠️  警告：此操作将重写 Git 历史！"
echo "⚠️  请确保："
echo "   1. 所有本地更改已提交"
echo "   2. 所有团队成员已备份本地仓库"
echo "   3. 你已获得仓库管理员权限"
echo ""
read -p "继续清理？(输入 'yes' 确认): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ 已取消"
    exit 0
fi

echo ""
echo "正在清理 .env 文件..."

# 设置环境变量以避免警告
export FILTER_BRANCH_SQUELCH_WARNING=1

# 清理所有 .env 文件
git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch \
    .env \
    .env.* \
    !.env.example' \
  --prune-empty --tag-name-filter cat -- --all

echo "✅ .env 文件已删除"
echo ""

# 清理引用日志
echo "正在清理引用日志..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo "✅ 引用日志已清理"
echo ""

# 验证清理结果
echo "正在验证清理结果..."
if git log --all --full-history -- ".env" | grep -q ""; then
    echo "⚠️  警告：仍然存在对 .env 文件的引用"
    echo "此可能不影响安全性，但建议进一步检查"
else
    echo "✅ 验证成功：.env 文件已完全移除"
fi

echo ""
echo "=========================================="
echo "  清理完成！"
echo "=========================================="
echo ""
echo "📌 后续步骤："
echo "1. 验证本地文件完整性"
echo "2. 强制推送到远程："
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo "3. 通知所有团队成员重新克隆仓库"
echo "4. 删除本地 .env 备份（确保不包含敏感信息）"
echo ""
echo "✅ 脚本执行完成"
