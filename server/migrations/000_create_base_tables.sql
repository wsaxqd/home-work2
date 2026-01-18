-- ==========================================
-- 基础表创建 - 用户、家长、认证
-- ==========================================

-- 用户表（儿童端）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  avatar_url TEXT,
  age INTEGER,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  grade VARCHAR(20),
  parent_id UUID,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- 家长表
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(100) UNIQUE,
  real_name VARCHAR(50),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- 添加外键关联
ALTER TABLE users ADD CONSTRAINT fk_users_parent
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL;

-- 刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_user_or_parent CHECK (
    (user_id IS NOT NULL AND parent_id IS NULL) OR
    (user_id IS NULL AND parent_id IS NOT NULL)
  )
);

-- 用户偏好设置
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'zh-CN',
  notification_enabled BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  auto_save_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 家长控制设置
CREATE TABLE IF NOT EXISTS parental_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 时间控制
  daily_time_limit INTEGER DEFAULT 120, -- 分钟
  time_range_start TIME,
  time_range_end TIME,
  weekday_limit INTEGER DEFAULT 60,
  weekend_limit INTEGER DEFAULT 120,

  -- 内容控制
  content_filter_level VARCHAR(20) DEFAULT 'medium' CHECK (content_filter_level IN ('low', 'medium', 'high')),
  allowed_categories TEXT[], -- 允许的内容类别
  blocked_categories TEXT[], -- 禁止的内容类别
  games_allowed BOOLEAN DEFAULT true,
  ai_chat_allowed BOOLEAN DEFAULT true,
  creation_allowed BOOLEAN DEFAULT true,

  -- 其他设置
  require_approval_for_works BOOLEAN DEFAULT false,
  screen_time_alerts BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parent_id, child_id)
);

-- 用户活动日志
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  activity_detail JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 索引创建
-- ==========================================

-- users表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_parent_id ON users(parent_id);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_points ON users(points DESC);

-- parents表索引
CREATE INDEX idx_parents_username ON parents(username);
CREATE INDEX idx_parents_phone ON parents(phone);
CREATE INDEX idx_parents_email ON parents(email);

-- refresh_tokens表索引
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_parent_id ON refresh_tokens(parent_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- parental_controls表索引
CREATE INDEX idx_parental_controls_parent_id ON parental_controls(parent_id);
CREATE INDEX idx_parental_controls_child_id ON parental_controls(child_id);

-- user_activity_logs表索引
CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON user_activity_logs(created_at DESC);

-- ==========================================
-- 触发器
-- ==========================================

-- 更新users表的updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- 更新parents表的updated_at
CREATE OR REPLACE FUNCTION update_parents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parents_updated_at_trigger
BEFORE UPDATE ON parents
FOR EACH ROW
EXECUTE FUNCTION update_parents_updated_at();

-- 更新user_preferences表的updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at_trigger
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_updated_at();

-- 更新parental_controls表的updated_at
CREATE OR REPLACE FUNCTION update_parental_controls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parental_controls_updated_at_trigger
BEFORE UPDATE ON parental_controls
FOR EACH ROW
EXECUTE FUNCTION update_parental_controls_updated_at();
