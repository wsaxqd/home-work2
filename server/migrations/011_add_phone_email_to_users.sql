-- ==========================================
-- 添加 phone 和 email 字段到 users 表
-- ==========================================

-- 添加 phone 列 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE;
    CREATE INDEX idx_users_phone ON users(phone);
  END IF;
END $$;

-- 添加 email 列 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE;
    CREATE INDEX idx_users_email ON users(email);
  END IF;
END $$;

-- 添加 avatar 列 (如果不存在,用于存储emoji头像)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar VARCHAR(10);
  END IF;
END $$;

-- 添加注释
COMMENT ON COLUMN users.phone IS '用户手机号，用于登录';
COMMENT ON COLUMN users.email IS '用户邮箱，用于登录';
COMMENT ON COLUMN users.avatar IS '用户头像(emoji)';
