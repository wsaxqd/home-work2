-- 每日签到+习惯养成系统 数据库表

-- 1. 每日签到记录表
CREATE TABLE IF NOT EXISTS daily_checkins (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_补签 BOOLEAN DEFAULT false,
  consecutive_days INTEGER DEFAULT 1,
  total_checkins INTEGER DEFAULT 1,
  reward_points INTEGER DEFAULT 0,
  mood VARCHAR(20), -- happy, normal, sad
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_date UNIQUE (user_id, checkin_date)
);

-- 2. 习惯定义表
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_name VARCHAR(100) NOT NULL,
  habit_type VARCHAR(50) NOT NULL, -- study, exercise, reading, custom
  description TEXT,
  icon VARCHAR(20),
  color VARCHAR(20),
  target_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, custom
  target_count INTEGER DEFAULT 1,
  reminder_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 习惯打卡记录表
CREATE TABLE IF NOT EXISTS habit_checkins (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completion_value INTEGER DEFAULT 1, -- 完成次数或数量
  notes TEXT,
  mood VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_habit_date UNIQUE (habit_id, checkin_date)
);

-- 4. 习惯统计表
CREATE TABLE IF NOT EXISTS habit_stats (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_checkins INTEGER DEFAULT 0,
  consecutive_days INTEGER DEFAULT 0,
  max_consecutive_days INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  total_days_tracked INTEGER DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_habit_stats UNIQUE (habit_id)
);

-- 5. 签到奖励配置表
CREATE TABLE IF NOT EXISTS checkin_rewards (
  id SERIAL PRIMARY KEY,
  consecutive_days INTEGER NOT NULL UNIQUE,
  reward_type VARCHAR(50) NOT NULL, -- points, badge, item
  reward_value INTEGER,
  reward_name VARCHAR(100),
  reward_description TEXT,
  icon VARCHAR(20),
  is_active BOOLEAN DEFAULT true
);

-- 6. 用户签到统计表
CREATE TABLE IF NOT EXISTS user_checkin_stats (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_checkins INTEGER DEFAULT 0,
  consecutive_days INTEGER DEFAULT 0,
  max_consecutive_days INTEGER DEFAULT 0,
  current_month_checkins INTEGER DEFAULT 0,
  last_checkin_date DATE,
  补签_cards INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_checkin_stats UNIQUE (user_id)
);

-- 7. 成就徽章表（扩展原有badges表）
CREATE TABLE IF NOT EXISTS checkin_achievements (
  id SERIAL PRIMARY KEY,
  achievement_code VARCHAR(50) UNIQUE NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  achievement_type VARCHAR(50) NOT NULL, -- checkin, habit, special
  description TEXT,
  icon VARCHAR(20),
  condition_type VARCHAR(50), -- consecutive_days, total_days, habit_days
  condition_value INTEGER,
  reward_points INTEGER DEFAULT 0,
  rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
  is_active BOOLEAN DEFAULT true
);

-- 8. 用户成就记录表
CREATE TABLE IF NOT EXISTS user_checkin_achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES checkin_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INTEGER DEFAULT 0,
  is_claimed BOOLEAN DEFAULT false,
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_checkins_habit ON habit_checkins(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_checkins_date ON habit_checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_user_checkin_achievements_user ON user_checkin_achievements(user_id);

-- 插入默认签到奖励配置
INSERT INTO checkin_rewards (consecutive_days, reward_type, reward_value, reward_name, reward_description, icon) VALUES
(1, 'points', 10, '新手签到', '首次签到奖励', '🎁'),
(3, 'points', 30, '三日坚持', '连续签到3天奖励', '⭐'),
(7, 'points', 100, '一周达成', '连续签到7天奖励', '🏆'),
(14, 'points', 200, '两周坚持', '连续签到14天奖励', '💎'),
(30, 'points', 500, '月度全勤', '连续签到30天奖励', '👑'),
(60, 'points', 1000, '双月坚持', '连续签到60天奖励', '🌟'),
(100, 'points', 2000, '百日筑基', '连续签到100天奖励', '🔥'),
(365, 'points', 10000, '年度全勤王', '连续签到365天奖励', '🎖️')
ON CONFLICT (consecutive_days) DO NOTHING;

-- 插入默认成就
INSERT INTO checkin_achievements (achievement_code, achievement_name, achievement_type, description, icon, condition_type, condition_value, reward_points, rarity) VALUES
('CHECKIN_BEGINNER', '签到新手', 'checkin', '累计签到7天', '🌱', 'total_days', 7, 50, 'common'),
('CHECKIN_EXPERT', '签到达人', 'checkin', '累计签到30天', '🌿', 'total_days', 30, 200, 'rare'),
('CHECKIN_MASTER', '签到大师', 'checkin', '累计签到100天', '🌳', 'total_days', 100, 500, 'epic'),
('CONSECUTIVE_7', '七日坚持', 'checkin', '连续签到7天', '⭐', 'consecutive_days', 7, 100, 'rare'),
('CONSECUTIVE_30', '月度全勤', 'checkin', '连续签到30天', '💎', 'consecutive_days', 30, 300, 'epic'),
('CONSECUTIVE_100', '百日不断', 'checkin', '连续签到100天', '🔥', 'consecutive_days', 100, 1000, 'legendary'),
('HABIT_MASTER', '习惯大师', 'habit', '保持3个习惯超过30天', '👑', 'habit_days', 30, 500, 'epic'),
('PERFECT_MONTH', '完美主义', 'special', '当月全勤签到', '✨', 'consecutive_days', 30, 300, 'epic')
ON CONFLICT (achievement_code) DO NOTHING;

-- 插入默认习惯模板
-- 注意：这个表需要在用户创建习惯时才填充数据，这里只是示例
