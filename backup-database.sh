#!/bin/bash

# ============================================================
# 启蒙之光 (QMZG) - 数据库备份脚本
# 基于邵博士 DevOps 最佳实践
# 功能：自动备份 PostgreSQL 数据库 + 清理旧备份
# ============================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# ============================================================
# 配置变量
# ============================================================

# 从 .env.production 读取配置
if [ -f ".env.production" ]; then
    source .env.production
fi

DB_CONTAINER=${DB_CONTAINER:-qmzg-postgres}
DB_NAME=${DB_NAME:-qmzg_prod}
DB_USER=${DB_USER:-qmzg_admin}
BACKUP_DIR=${BACKUP_DIR:-./backups}
KEEP_DAYS=${KEEP_DAYS:-7}  # 保留最近7天的备份

# 生成备份文件名（带时间戳）
BACKUP_FILE="${BACKUP_DIR}/qmzg_backup_$(date +%Y%m%d_%H%M%S).sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

# ============================================================
# 备份流程
# ============================================================

log_info "=========================================="
log_info "  数据库备份开始"
log_info "=========================================="
echo ""

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 检查数据库容器是否运行
if ! docker ps | grep -q ${DB_CONTAINER}; then
    echo "错误：数据库容器 ${DB_CONTAINER} 未运行！"
    exit 1
fi

log_info "备份数据库: ${DB_NAME}"
log_info "备份文件: ${BACKUP_FILE_GZ}"

# 执行备份
docker exec ${DB_CONTAINER} pg_dump -U ${DB_USER} ${DB_NAME} | gzip > ${BACKUP_FILE_GZ}

# 检查备份文件大小
BACKUP_SIZE=$(du -h ${BACKUP_FILE_GZ} | cut -f1)
log_success "备份完成！文件大小: ${BACKUP_SIZE}"

# ============================================================
# 清理旧备份
# ============================================================

log_info "清理 ${KEEP_DAYS} 天前的备份文件..."

find ${BACKUP_DIR} -name "qmzg_backup_*.sql.gz" -type f -mtime +${KEEP_DAYS} -delete

CURRENT_BACKUPS=$(ls -1 ${BACKUP_DIR}/qmzg_backup_*.sql.gz 2>/dev/null | wc -l)
log_info "当前备份文件数量: ${CURRENT_BACKUPS}"

echo ""
log_success "=========================================="
log_success "  备份完成！"
log_success "=========================================="
echo ""
log_info "恢复命令:"
log_info "  gunzip < ${BACKUP_FILE_GZ} | docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} ${DB_NAME}"
echo ""

# ============================================================
# 备份列表
# ============================================================

log_info "最近的备份文件:"
ls -lh ${BACKUP_DIR}/qmzg_backup_*.sql.gz 2>/dev/null | tail -5 || echo "  无备份文件"
echo ""
