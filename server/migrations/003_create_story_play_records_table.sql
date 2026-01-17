-- 创建故事播放记录表
CREATE TABLE IF NOT EXISTS story_play_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id VARCHAR(100) NOT NULL,
  duration INTEGER DEFAULT 0,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_story_play_records_user_id ON story_play_records(user_id);
CREATE INDEX idx_story_play_records_story_id ON story_play_records(story_id);
CREATE INDEX idx_story_play_records_played_at ON story_play_records(played_at DESC);
