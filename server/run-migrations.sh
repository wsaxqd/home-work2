#!/bin/bash

# 数据库连接信息
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-qmzg}"
DB_USER="${DB_USER:-admin}"
DB_PASSWORD="${DB_PASSWORD:-dev_password_123}"

export PGPASSWORD="$DB_PASSWORD"

echo "🚀 开始运行数据库迁移..."
echo "数据库: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# 检查PostgreSQL是否可用
echo "📡 检查数据库连接..."
until psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "⏳ 等待数据库启动..."
  sleep 2
done
echo "✅ 数据库连接成功！"
echo ""

# 按顺序执行迁移文件
MIGRATION_DIR="./migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
  echo "❌ 迁移目录不存在: $MIGRATION_DIR"
  exit 1
fi

# 获取所有 .sql 文件并排序
MIGRATION_FILES=$(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort)

if [ -z "$MIGRATION_FILES" ]; then
  echo "⚠️  没有找到迁移文件"
  exit 0
fi

echo "📦 找到以下迁移文件:"
for file in $MIGRATION_FILES; do
  echo "   - $(basename "$file")"
done
echo ""

# 执行每个迁移文件
SUCCESS_COUNT=0
FAIL_COUNT=0

for file in $MIGRATION_FILES; do
  filename=$(basename "$file")
  echo "⏳ 执行: $filename"
  
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" > /dev/null 2>&1; then
    echo "✅ 成功: $filename"
    ((SUCCESS_COUNT++))
  else
    echo "❌ 失败: $filename"
    echo "   查看详细错误:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
    ((FAIL_COUNT++))
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 迁移结果统计:"
echo "   成功: $SUCCESS_COUNT"
echo "   失败: $FAIL_COUNT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAIL_COUNT -gt 0 ]; then
  echo "❌ 部分迁移失败，请检查错误信息"
  exit 1
else
  echo "✅ 所有迁移执行成功！"
  exit 0
fi
