-- ==========================================
-- 社区和互动表
-- ==========================================

-- 社区帖子表
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50), -- discussion, question, showcase, etc.

  -- 附件
  images TEXT[],
  work_id UUID REFERENCES works(id) ON DELETE SET NULL,

  -- 状态
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden', 'deleted')),
  is_pinned BOOLEAN DEFAULT false,

  -- 统计
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- 标签
  tags TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 社区评论表
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 社区点赞表
CREATE TABLE IF NOT EXISTS community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_post_or_comment CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  CONSTRAINT unique_post_like UNIQUE(post_id, user_id),
  CONSTRAINT unique_comment_like UNIQUE(comment_id, user_id)
);

-- 关注表
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CONSTRAINT check_not_self_follow CHECK (follower_id != following_id)
);

-- ==========================================
-- 成就和奖励表
-- ==========================================

-- 成就表
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL, -- 成就唯一标识
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- creation, gaming, learning, social, etc.
  icon_url TEXT,

  -- 解锁条件
  requirement_type VARCHAR(50), -- count, score, streak, etc.
  requirement_value INTEGER,

  -- 奖励
  points_reward INTEGER DEFAULT 0,
  badge_url TEXT,

  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户成就表
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,

  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, achievement_id)
);

-- 积分记录表
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  points_change INTEGER NOT NULL,
  reason VARCHAR(200) NOT NULL,
  reference_type VARCHAR(50), -- work, game, achievement, etc.
  reference_id UUID,

  balance_after INTEGER NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 使用统计表
-- ==========================================

-- 每日使用统计
CREATE TABLE IF NOT EXISTS daily_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- 时间统计(分钟)
  total_time INTEGER DEFAULT 0,
  creation_time INTEGER DEFAULT 0,
  gaming_time INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  ai_chat_time INTEGER DEFAULT 0,

  -- 活动统计
  works_created INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  stories_read INTEGER DEFAULT 0,
  ai_conversations INTEGER DEFAULT 0,

  -- 其他统计
  points_earned INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, date)
);

-- 屏幕时间记录
CREATE TABLE IF NOT EXISTS screen_time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- 秒

  activity_type VARCHAR(50), -- creation, gaming, reading, etc.
  page_path VARCHAR(200),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 内容审核表
-- ==========================================

-- 内容举报表
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content_type VARCHAR(50) NOT NULL, -- work, post, comment
  content_id UUID NOT NULL,

  reason VARCHAR(50) NOT NULL, -- inappropriate, spam, bullying, etc.
  description TEXT,

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  moderator_note TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 索引
-- ==========================================

-- community_posts表索引
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_status ON community_posts(status);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_like_count ON community_posts(like_count DESC);
CREATE INDEX idx_community_posts_tags ON community_posts USING GIN(tags);

-- community_comments表索引
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX idx_community_comments_parent_id ON community_comments(parent_comment_id);

-- community_likes表索引
CREATE INDEX idx_community_likes_post_id ON community_likes(post_id);
CREATE INDEX idx_community_likes_comment_id ON community_likes(comment_id);
CREATE INDEX idx_community_likes_user_id ON community_likes(user_id);

-- user_follows表索引
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);

-- achievements表索引
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_rarity ON achievements(rarity);
CREATE INDEX idx_achievements_code ON achievements(code);

-- user_achievements表索引
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_completed ON user_achievements(is_completed);

-- points_history表索引
CREATE INDEX idx_points_history_user_id ON points_history(user_id);
CREATE INDEX idx_points_history_created_at ON points_history(created_at DESC);

-- daily_usage_stats表索引
CREATE INDEX idx_daily_usage_stats_user_id ON daily_usage_stats(user_id);
CREATE INDEX idx_daily_usage_stats_date ON daily_usage_stats(date DESC);

-- screen_time_sessions表索引
CREATE INDEX idx_screen_time_user_id ON screen_time_sessions(user_id);
CREATE INDEX idx_screen_time_started_at ON screen_time_sessions(started_at DESC);
CREATE INDEX idx_screen_time_activity_type ON screen_time_sessions(activity_type);

-- content_reports表索引
CREATE INDEX idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX idx_content_reports_content_type ON content_reports(content_type);
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_created_at ON content_reports(created_at DESC);

-- ==========================================
-- 触发器
-- ==========================================

-- 社区帖子点赞数更新
CREATE OR REPLACE FUNCTION update_community_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_likes_post_count_trigger
AFTER INSERT OR DELETE ON community_likes
FOR EACH ROW
WHEN (NEW.post_id IS NOT NULL OR OLD.post_id IS NOT NULL)
EXECUTE FUNCTION update_community_post_like_count();

-- 社区评论点赞数更新
CREATE OR REPLACE FUNCTION update_community_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.comment_id IS NOT NULL THEN
    UPDATE community_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.comment_id IS NOT NULL THEN
    UPDATE community_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_likes_comment_count_trigger
AFTER INSERT OR DELETE ON community_likes
FOR EACH ROW
WHEN (NEW.comment_id IS NOT NULL OR OLD.comment_id IS NOT NULL)
EXECUTE FUNCTION update_community_comment_like_count();

-- 社区评论数更新
CREATE OR REPLACE FUNCTION update_community_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.post_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_comments_count_trigger
AFTER INSERT OR UPDATE ON community_comments
FOR EACH ROW
EXECUTE FUNCTION update_community_post_comment_count();

-- 积分变化更新用户总积分
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET points = NEW.balance_after WHERE id = NEW.user_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER points_history_update_user_trigger
AFTER INSERT ON points_history
FOR EACH ROW
EXECUTE FUNCTION update_user_points();

-- 更新daily_usage_stats的updated_at
CREATE OR REPLACE FUNCTION update_daily_usage_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_usage_stats_updated_at_trigger
BEFORE UPDATE ON daily_usage_stats
FOR EACH ROW
EXECUTE FUNCTION update_daily_usage_stats_updated_at();
