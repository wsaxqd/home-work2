-- 家长监控面板增强系统 数据库表

-- 1. 家长用户表（扩展）
CREATE TABLE IF NOT EXISTS parents (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  avatar VARCHAR(500),

  -- 账号状态
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- 家长信息
  relationship VARCHAR(50), -- father, mother, guardian
  wechat VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 家长-孩子关联表
CREATE TABLE IF NOT EXISTS parent_children (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 关联关系
  relationship VARCHAR(50) NOT NULL, -- father, mother, guardian
  nickname VARCHAR(100), -- 家长给孩子起的备注名

  -- 权限设置
  can_view_study_data BOOLEAN DEFAULT true,
  can_set_time_limit BOOLEAN DEFAULT true,
  can_view_social_content BOOLEAN DEFAULT true,
  can_receive_notifications BOOLEAN DEFAULT true,

  -- 关联状态
  is_primary BOOLEAN DEFAULT false, -- 是否为主要监护人
  is_active BOOLEAN DEFAULT true,
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (parent_id, child_id)
);

-- 3. 学习数据快照表（供家长查看）
CREATE TABLE IF NOT EXISTS child_learning_snapshots (
  id SERIAL PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_type VARCHAR(50) DEFAULT 'daily', -- daily, weekly, monthly

  -- 学习时长统计
  total_study_minutes INTEGER DEFAULT 0,
  active_days_count INTEGER DEFAULT 0,

  -- 学习内容统计
  completed_exercises_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0.00,

  -- 分科目统计
  subject_stats JSONB, -- {math: {time: 30, accuracy: 85}, chinese: {...}}

  -- 使用功能统计
  feature_usage JSONB, -- {games: 20, reading: 15, ai_chat: 10, ...}

  -- 成就统计
  badges_earned_count INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,

  -- 签到数据
  checkin_count INTEGER DEFAULT 0,
  consecutive_days INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (child_id, snapshot_date, snapshot_type)
);

-- 4. 家长通知表
CREATE TABLE IF NOT EXISTS parent_notifications (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 通知信息
  notification_type VARCHAR(50) NOT NULL, -- daily_report, weekly_report, achievement, warning, reminder
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  summary VARCHAR(500), -- 简短摘要

  -- 通知数据
  data JSONB, -- 详细数据
  priority INTEGER DEFAULT 5, -- 优先级 1-10

  -- 通知渠道
  channels JSONB, -- [app, email, sms, wechat]

  -- 通知状态
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,

  -- 过期时间
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 家长查看记录表
CREATE TABLE IF NOT EXISTS parent_view_logs (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 查看内容
  view_type VARCHAR(50) NOT NULL, -- study_data, report, wrong_questions, chat_history, location
  view_module VARCHAR(100), -- 具体模块

  -- 查看详情
  view_data JSONB, -- 查看的详细数据
  duration_seconds INTEGER, -- 查看时长

  -- IP和设备
  ip_address VARCHAR(50),
  user_agent TEXT,
  device_type VARCHAR(50), -- mobile, tablet, desktop

  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 时间限制规则表（增强版）
CREATE TABLE IF NOT EXISTS time_limit_rules (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 规则名称
  rule_name VARCHAR(100),
  rule_type VARCHAR(50) NOT NULL, -- daily, weekly, by_time_range

  -- 时间限制
  daily_limit_minutes INTEGER, -- 每日限制（分钟）
  weekly_limit_minutes INTEGER, -- 每周限制（分钟）

  -- 时间段限制
  allowed_time_ranges JSONB, -- [{start: '08:00', end: '20:00', days: [1,2,3,4,5]}]

  -- 功能限制
  restricted_features JSONB, -- [games, pk, community]
  allowed_features JSONB, -- [study, reading]

  -- 奖励机制
  reward_extra_minutes INTEGER DEFAULT 0, -- 完成任务奖励的额外时间
  reward_conditions JSONB, -- 奖励条件

  -- 规则状态
  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_to DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 家长设置表（增强版）
CREATE TABLE IF NOT EXISTS parent_settings (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 通知设置
  enable_daily_report BOOLEAN DEFAULT true,
  enable_weekly_report BOOLEAN DEFAULT true,
  enable_achievement_notification BOOLEAN DEFAULT true,
  enable_warning_notification BOOLEAN DEFAULT true,

  -- 报告发送时间
  daily_report_time TIME DEFAULT '20:00:00',
  weekly_report_day INTEGER DEFAULT 7, -- 周日

  -- 内容过滤
  enable_content_filter BOOLEAN DEFAULT true,
  filter_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  blocked_keywords JSONB, -- 屏蔽关键词

  -- 社交限制
  enable_friend_requests BOOLEAN DEFAULT true,
  enable_private_messages BOOLEAN DEFAULT false,
  enable_community_posts BOOLEAN DEFAULT true,

  -- 数据隐私
  allow_location_tracking BOOLEAN DEFAULT false,
  allow_data_analysis BOOLEAN DEFAULT true,

  -- 紧急联系
  emergency_contacts JSONB, -- [{name, phone, relationship}]

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (parent_id, child_id)
);

-- 8. 家长反馈表
CREATE TABLE IF NOT EXISTS parent_feedback (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 反馈类型
  feedback_type VARCHAR(50) NOT NULL, -- suggestion, complaint, praise, bug_report
  category VARCHAR(50), -- function, content, experience

  -- 反馈内容
  title VARCHAR(200),
  content TEXT NOT NULL,
  attachments JSONB, -- 附件（截图等）

  -- 反馈评分
  rating INTEGER, -- 1-5星

  -- 处理状态
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, resolved, closed
  admin_reply TEXT,
  replied_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_parents_phone ON parents(phone);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);
CREATE INDEX IF NOT EXISTS idx_parent_children_parent ON parent_children(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_child ON parent_children(child_id);
CREATE INDEX IF NOT EXISTS idx_learning_snapshots_child ON child_learning_snapshots(child_id);
CREATE INDEX IF NOT EXISTS idx_learning_snapshots_date ON child_learning_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent ON parent_notifications(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_child ON parent_notifications(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_read ON parent_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_parent_view_logs_parent ON parent_view_logs(parent_id);
CREATE INDEX IF NOT EXISTS idx_time_limit_rules_child ON time_limit_rules(child_id);
CREATE INDEX IF NOT EXISTS idx_time_limit_rules_active ON time_limit_rules(is_active);

-- 插入测试数据（可选）
-- 注意：这里仅作示例，实际使用时parent_id和child_id需要真实存在
