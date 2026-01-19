-- 修复 users 表结构
-- 添加缺失的列

-- 添加 phone 列
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;

-- 添加 email 列
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE;

-- 添加 username 列
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- 添加 password_hash 列 (如果只有password列)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 添加 avatar 列 (emoji)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(10);

-- 添加 age 列
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;

-- 添加 level 列
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 添加 points 列
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 显示表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
