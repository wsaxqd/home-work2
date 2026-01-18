-- ==========================================
-- 日记和情感相关表
-- ==========================================

-- 日记表
CREATE TABLE IF NOT EXISTS diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  content TEXT NOT NULL,
  mood VARCHAR(50) CHECK (mood IN ('happy', 'sad', 'angry', 'worried', 'excited', 'calm', 'neutral')),
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),

  -- 多媒体附件
  voice_note_url TEXT,
  drawing_url TEXT,
  photos TEXT[], -- 照片URL数组

  -- AI分析结果
  ai_emotion_analysis JSONB,
  ai_response TEXT,
  ai_suggestions TEXT[],

  -- 隐私设置
  is_private BOOLEAN DEFAULT true,

  weather VARCHAR(50),
  location VARCHAR(100),
  tags TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 情绪追踪记录
CREATE TABLE IF NOT EXISTS mood_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diary_id UUID REFERENCES diaries(id) ON DELETE SET NULL,
  mood VARCHAR(50) NOT NULL,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  note TEXT,
  triggers TEXT[], -- 情绪触发因素
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 游戏相关表
-- ==========================================

-- 游戏记录表
CREATE TABLE IF NOT EXISTS game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL, -- fruit-match, tank-battle, chess, etc.
  game_mode VARCHAR(50),

  -- 游戏结果
  score INTEGER DEFAULT 0,
  level_reached INTEGER DEFAULT 1,
  time_spent INTEGER, -- 秒
  is_completed BOOLEAN DEFAULT false,
  is_won BOOLEAN DEFAULT false,

  -- 游戏数据
  game_data JSONB, -- 存储游戏的详细数据

  -- 奖励
  points_earned INTEGER DEFAULT 0,
  achievements TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- 游戏排行榜
CREATE TABLE IF NOT EXISTS game_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL,
  best_score INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  highest_level INTEGER DEFAULT 1,
  total_time_spent INTEGER DEFAULT 0, -- 秒
  last_played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_type)
);

-- ==========================================
-- 学习和测评表
-- ==========================================

-- 测评记录表
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_type VARCHAR(50) NOT NULL, -- cognitive, emotional, creative, etc.
  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- 测评结果
  total_score INTEGER,
  max_score INTEGER,
  percentage DECIMAL(5,2),
  level_achieved VARCHAR(50),

  -- 详细结果
  dimension_scores JSONB, -- 各维度得分
  strengths TEXT[],
  weaknesses TEXT[],
  recommendations TEXT[],

  -- AI分析
  ai_analysis TEXT,
  ai_report_url TEXT,

  -- 时间
  time_spent INTEGER, -- 秒
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 学习进度表
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(200) NOT NULL,

  -- 进度
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  completed_lessons INTEGER DEFAULT 0,
  total_lessons INTEGER,

  -- 掌握程度
  mastery_level VARCHAR(50) DEFAULT 'beginner' CHECK (mastery_level IN ('beginner', 'intermediate', 'advanced', 'expert')),

  -- 时间统计
  time_spent INTEGER DEFAULT 0, -- 分钟
  last_practiced_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, subject, topic)
);

-- ==========================================
-- 通知和消息表
-- ==========================================

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL, -- system, achievement, reminder, parent_message, etc.
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,

  -- 链接和操作
  action_url TEXT,
  action_type VARCHAR(50),

  -- 状态
  is_read BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,

  -- 元数据
  metadata JSONB,

  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT check_user_or_parent_notification CHECK (
    (user_id IS NOT NULL AND parent_id IS NULL) OR
    (user_id IS NULL AND parent_id IS NOT NULL)
  )
);

-- 家长-孩子消息表
CREATE TABLE IF NOT EXISTS family_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('parent', 'child')),

  message_type VARCHAR(50) DEFAULT 'text', -- text, voice, image
  content TEXT NOT NULL,
  file_url TEXT,

  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 索引
-- ==========================================

-- diaries表索引
CREATE INDEX idx_diaries_user_id ON diaries(user_id);
CREATE INDEX idx_diaries_mood ON diaries(mood);
CREATE INDEX idx_diaries_created_at ON diaries(created_at DESC);
CREATE INDEX idx_diaries_is_private ON diaries(is_private);
CREATE INDEX idx_diaries_tags ON diaries USING GIN(tags);

-- mood_tracking表索引
CREATE INDEX idx_mood_tracking_user_id ON mood_tracking(user_id);
CREATE INDEX idx_mood_tracking_created_at ON mood_tracking(created_at DESC);
CREATE INDEX idx_mood_tracking_mood ON mood_tracking(mood);

-- game_records表索引
CREATE INDEX idx_game_records_user_id ON game_records(user_id);
CREATE INDEX idx_game_records_game_type ON game_records(game_type);
CREATE INDEX idx_game_records_created_at ON game_records(created_at DESC);
CREATE INDEX idx_game_records_score ON game_records(score DESC);

-- game_leaderboard表索引
CREATE INDEX idx_game_leaderboard_game_type ON game_leaderboard(game_type);
CREATE INDEX idx_game_leaderboard_best_score ON game_leaderboard(best_score DESC);
CREATE INDEX idx_game_leaderboard_win_rate ON game_leaderboard(win_rate DESC);

-- assessments表索引
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX idx_assessments_total_score ON assessments(total_score DESC);

-- learning_progress表索引
CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_subject ON learning_progress(subject);
CREATE INDEX idx_learning_progress_updated_at ON learning_progress(updated_at DESC);

-- notifications表索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_parent_id ON notifications(parent_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- family_messages表索引
CREATE INDEX idx_family_messages_parent_id ON family_messages(parent_id);
CREATE INDEX idx_family_messages_child_id ON family_messages(child_id);
CREATE INDEX idx_family_messages_created_at ON family_messages(created_at DESC);
CREATE INDEX idx_family_messages_is_read ON family_messages(is_read);

-- ==========================================
-- 触发器
-- ==========================================

-- 更新diaries的updated_at
CREATE OR REPLACE FUNCTION update_diaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER diaries_updated_at_trigger
BEFORE UPDATE ON diaries
FOR EACH ROW
EXECUTE FUNCTION update_diaries_updated_at();

-- 游戏排行榜自动更新
CREATE OR REPLACE FUNCTION update_game_leaderboard()
RETURNS TRIGGER AS $$
DECLARE
  current_stats RECORD;
BEGIN
  -- 获取当前统计
  SELECT * INTO current_stats
  FROM game_leaderboard
  WHERE user_id = NEW.user_id AND game_type = NEW.game_type;

  IF current_stats IS NULL THEN
    -- 插入新记录
    INSERT INTO game_leaderboard (user_id, game_type, best_score, total_games, total_wins, win_rate, highest_level, total_time_spent, last_played_at)
    VALUES (
      NEW.user_id,
      NEW.game_type,
      NEW.score,
      1,
      CASE WHEN NEW.is_won THEN 1 ELSE 0 END,
      CASE WHEN NEW.is_won THEN 100.00 ELSE 0.00 END,
      COALESCE(NEW.level_reached, 1),
      COALESCE(NEW.time_spent, 0),
      NEW.created_at
    );
  ELSE
    -- 更新现有记录
    UPDATE game_leaderboard SET
      best_score = GREATEST(current_stats.best_score, NEW.score),
      total_games = current_stats.total_games + 1,
      total_wins = current_stats.total_wins + CASE WHEN NEW.is_won THEN 1 ELSE 0 END,
      win_rate = ((current_stats.total_wins + CASE WHEN NEW.is_won THEN 1 ELSE 0 END)::DECIMAL / (current_stats.total_games + 1)) * 100,
      highest_level = GREATEST(current_stats.highest_level, COALESCE(NEW.level_reached, 1)),
      total_time_spent = current_stats.total_time_spent + COALESCE(NEW.time_spent, 0),
      last_played_at = NEW.created_at,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id AND game_type = NEW.game_type;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_records_leaderboard_trigger
AFTER INSERT ON game_records
FOR EACH ROW
EXECUTE FUNCTION update_game_leaderboard();

-- 更新learning_progress的updated_at
CREATE OR REPLACE FUNCTION update_learning_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER learning_progress_updated_at_trigger
BEFORE UPDATE ON learning_progress
FOR EACH ROW
EXECUTE FUNCTION update_learning_progress_updated_at();
