-- 创建邮箱验证码表
CREATE TABLE IF NOT EXISTS email_verify_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引优化查询性能
  INDEX idx_email (email),
  INDEX idx_email_code (email, code),
  INDEX idx_expires_at (expires_at)
);

-- 添加注释
COMMENT ON TABLE email_verify_codes IS '邮箱验证码表';
COMMENT ON COLUMN email_verify_codes.email IS '邮箱地址';
COMMENT ON COLUMN email_verify_codes.code IS '6位验证码';
COMMENT ON COLUMN email_verify_codes.used IS '是否已使用';
COMMENT ON COLUMN email_verify_codes.expires_at IS '过期时间';
COMMENT ON COLUMN email_verify_codes.created_at IS '创建时间';
