-- ============================================================
-- Migration: V003_20241206_create_plans_table
-- Description: Create plans table for subscription tiers
-- ============================================================
-- revision: V003
-- down_revision: V002
-- create_date: 2024-12-06
-- ============================================================

-- ==================== UPGRADE ====================
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_plans_price CHECK (price >= 0)
);

COMMENT ON TABLE plans IS '订阅套餐表';
COMMENT ON COLUMN plans.id IS '主键ID';
COMMENT ON COLUMN plans.name IS '套餐名称';
COMMENT ON COLUMN plans.price IS '价格（美元）';
COMMENT ON COLUMN plans.features IS '权益列表（JSON数组）';
COMMENT ON COLUMN plans.is_active IS '是否启用';
COMMENT ON COLUMN plans.sort_order IS '排序序号';

CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);

-- ==================== DOWNGRADE ====================
-- DROP TABLE IF EXISTS plans;

-- ==================== VERIFICATION ====================
SELECT 'plans table created' AS status WHERE EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'plans'
);
