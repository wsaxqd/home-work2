-- ==========================================
-- 修复 users 表的字段问题
-- ==========================================

-- 1. 添加 bio 字段 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
    COMMENT ON COLUMN users.bio IS '用户个人简介';
  END IF;
END $$;

-- 2. 修改 username 字段为可空 (允许邮箱登录时username为空)
DO $$
BEGIN
  -- 先移除唯一约束(如果存在)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_username_key' AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_username_key;
  END IF;

  -- 修改字段为可空
  ALTER TABLE users ALTER COLUMN username DROP NOT NULL;

  -- 添加条件唯一约束(username不为空时才要求唯一)
  CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx
    ON users (username) WHERE username IS NOT NULL;
END $$;

-- 3. 修改 password_hash 字段为可空 (允许第三方登录或邮箱验证码登录)
DO $$
BEGIN
  ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
END $$;

-- 4. 确保 email_verify_codes 表存在
CREATE TABLE IF NOT EXISTS email_verify_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引(如果不存在)
CREATE INDEX IF NOT EXISTS idx_email_verify_codes_email ON email_verify_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verify_codes_email_code ON email_verify_codes(email, code);
CREATE INDEX IF NOT EXISTS idx_email_verify_codes_expires_at ON email_verify_codes(expires_at);

-- 添加注释
COMMENT ON TABLE email_verify_codes IS '邮箱验证码表';
COMMENT ON COLUMN email_verify_codes.email IS '邮箱地址';
COMMENT ON COLUMN email_verify_codes.code IS '6位验证码';
COMMENT ON COLUMN email_verify_codes.used IS '是否已使用';
COMMENT ON COLUMN email_verify_codes.expires_at IS '过期时间';
COMMENT ON COLUMN email_verify_codes.created_at IS '创建时间';

-- 5. 清理过期验证码的存储过程(可选,方便定期清理)
CREATE OR REPLACE FUNCTION cleanup_expired_verify_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verify_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_verify_codes IS '清理过期的邮箱验证码';
