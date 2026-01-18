-- ==========================================
-- 创作和作品表
-- ==========================================

-- 作品表
CREATE TABLE IF NOT EXISTS works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('art', 'music', 'story', 'poem', 'other')),
  content TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  description TEXT,

  -- 作品状态
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'reviewing')),
  is_public BOOLEAN DEFAULT false,

  -- 统计数据
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- AI评分
  ai_score INTEGER,
  ai_feedback TEXT,
  ai_suggestions TEXT[],

  -- 元数据
  tags TEXT[],
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

-- 作品点赞表
CREATE TABLE IF NOT EXISTS work_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(work_id, user_id)
);

-- 作品评论表
CREATE TABLE IF NOT EXISTS work_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES work_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 作品收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  story_id VARCHAR(100), -- 外部故事ID
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('work', 'story', 'book', 'other')),
  item_data JSONB, -- 存储外部内容的完整信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_favorite_reference CHECK (
    (work_id IS NOT NULL) OR (story_id IS NOT NULL)
  )
);

-- 作品分享记录
CREATE TABLE IF NOT EXISTS work_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_platform VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创作草稿表
CREATE TABLE IF NOT EXISTS creation_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('art', 'music', 'story', 'poem')),
  title VARCHAR(200),
  content JSONB NOT NULL, -- 存储草稿的完整内容
  auto_saved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI生成历史表
CREATE TABLE IF NOT EXISTS ai_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL, -- story, image, music, etc.
  prompt TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  result_url TEXT,
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  tokens_used INTEGER,
  processing_time INTEGER, -- 毫秒
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 索引
-- ==========================================

-- works表索引
CREATE INDEX idx_works_user_id ON works(user_id);
CREATE INDEX idx_works_type ON works(type);
CREATE INDEX idx_works_status ON works(status);
CREATE INDEX idx_works_is_public ON works(is_public);
CREATE INDEX idx_works_created_at ON works(created_at DESC);
CREATE INDEX idx_works_like_count ON works(like_count DESC);
CREATE INDEX idx_works_view_count ON works(view_count DESC);
CREATE INDEX idx_works_tags ON works USING GIN(tags);

-- work_likes表索引
CREATE INDEX idx_work_likes_work_id ON work_likes(work_id);
CREATE INDEX idx_work_likes_user_id ON work_likes(user_id);

-- work_comments表索引
CREATE INDEX idx_work_comments_work_id ON work_comments(work_id);
CREATE INDEX idx_work_comments_user_id ON work_comments(user_id);
CREATE INDEX idx_work_comments_parent_id ON work_comments(parent_comment_id);
CREATE INDEX idx_work_comments_created_at ON work_comments(created_at DESC);

-- favorites表索引
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_work_id ON favorites(work_id);
CREATE INDEX idx_favorites_item_type ON favorites(item_type);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

-- creation_drafts表索引
CREATE INDEX idx_creation_drafts_user_id ON creation_drafts(user_id);
CREATE INDEX idx_creation_drafts_type ON creation_drafts(type);
CREATE INDEX idx_creation_drafts_updated_at ON creation_drafts(updated_at DESC);

-- ai_generation_history表索引
CREATE INDEX idx_ai_gen_user_id ON ai_generation_history(user_id);
CREATE INDEX idx_ai_gen_task_type ON ai_generation_history(task_type);
CREATE INDEX idx_ai_gen_status ON ai_generation_history(status);
CREATE INDEX idx_ai_gen_created_at ON ai_generation_history(created_at DESC);

-- ==========================================
-- 触发器
-- ==========================================

-- 更新works的updated_at和统计
CREATE OR REPLACE FUNCTION update_works_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER works_updated_at_trigger
BEFORE UPDATE ON works
FOR EACH ROW
EXECUTE FUNCTION update_works_updated_at();

-- 点赞时更新作品点赞数
CREATE OR REPLACE FUNCTION update_work_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE works SET like_count = like_count + 1 WHERE id = NEW.work_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE works SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.work_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_likes_count_trigger
AFTER INSERT OR DELETE ON work_likes
FOR EACH ROW
EXECUTE FUNCTION update_work_like_count();

-- 评论时更新作品评论数
CREATE OR REPLACE FUNCTION update_work_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    UPDATE works SET comment_count = comment_count + 1 WHERE id = NEW.work_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE works SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.work_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE works SET comment_count = comment_count + 1 WHERE id = NEW.work_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_comments_count_trigger
AFTER INSERT OR UPDATE ON work_comments
FOR EACH ROW
EXECUTE FUNCTION update_work_comment_count();

-- 更新creation_drafts的updated_at
CREATE OR REPLACE FUNCTION update_creation_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creation_drafts_updated_at_trigger
BEFORE UPDATE ON creation_drafts
FOR EACH ROW
EXECUTE FUNCTION update_creation_drafts_updated_at();
