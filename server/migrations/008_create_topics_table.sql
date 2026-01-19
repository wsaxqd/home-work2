-- ==========================================
-- 社区话题表
-- ==========================================

-- 话题表
CREATE TABLE IF NOT EXISTS community_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  description TEXT,
  category VARCHAR(50),

  -- 统计
  post_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,

  -- 状态
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- 排序权重
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 话题关联表（帖子-话题多对多关系）
CREATE TABLE IF NOT EXISTS post_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(post_id, topic_id)
);

-- 用户关注话题表
CREATE TABLE IF NOT EXISTS user_topic_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, topic_id)
);

-- ==========================================
-- 索引
-- ==========================================

CREATE INDEX idx_community_topics_category ON community_topics(category);
CREATE INDEX idx_community_topics_is_active ON community_topics(is_active);
CREATE INDEX idx_community_topics_is_featured ON community_topics(is_featured);
CREATE INDEX idx_community_topics_sort_order ON community_topics(sort_order);

CREATE INDEX idx_post_topics_post_id ON post_topics(post_id);
CREATE INDEX idx_post_topics_topic_id ON post_topics(topic_id);

CREATE INDEX idx_user_topic_follows_user_id ON user_topic_follows(user_id);
CREATE INDEX idx_user_topic_follows_topic_id ON user_topic_follows(topic_id);

-- ==========================================
-- 触发器
-- ==========================================

-- 话题帖子数更新
CREATE OR REPLACE FUNCTION update_topic_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_topics SET post_count = post_count + 1 WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_topics SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.topic_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_topics_count_trigger
AFTER INSERT OR DELETE ON post_topics
FOR EACH ROW
EXECUTE FUNCTION update_topic_post_count();

-- 话题关注数更新
CREATE OR REPLACE FUNCTION update_topic_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_topics SET follower_count = follower_count + 1 WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_topics SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.topic_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_topic_follows_count_trigger
AFTER INSERT OR DELETE ON user_topic_follows
FOR EACH ROW
EXECUTE FUNCTION update_topic_follower_count();

-- 更新话题的updated_at
CREATE OR REPLACE FUNCTION update_community_topics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_topics_updated_at_trigger
BEFORE UPDATE ON community_topics
FOR EACH ROW
EXECUTE FUNCTION update_community_topics_updated_at();

-- ==========================================
-- 初始数据
-- ==========================================

INSERT INTO community_topics (title, icon, description, category, is_featured, sort_order) VALUES
('创意分享', '🎨', '分享你的创意作品和灵感', 'creation', true, 1),
('学习交流', '📚', '一起学习，共同进步', 'learning', true, 2),
('游戏乐园', '🎮', '游戏心得和高分秘籍', 'gaming', true, 3),
('故事天地', '📖', '分享有趣的故事', 'story', true, 4),
('问答互助', '❓', '有问题就来这里问', 'question', true, 5),
('日常生活', '🌈', '分享生活中的点点滴滴', 'daily', false, 6);
