-- 更新收藏表结构以支持更灵活的收藏类型
-- 删除旧表并重新创建

DROP TABLE IF EXISTS favorites CASCADE;

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('story', 'poem', 'music', 'art', 'picture_book', 'work', 'book', 'other')),
  item_id VARCHAR(255) NOT NULL,
  item_title VARCHAR(500) NOT NULL,
  item_content TEXT,
  item_thumbnail VARCHAR(1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 确保同一用户不会重复收藏同一项目
  CONSTRAINT unique_user_item UNIQUE (user_id, item_type, item_id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_item_type ON favorites(item_type);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);
