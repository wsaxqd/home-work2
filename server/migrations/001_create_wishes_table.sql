-- 创建心愿表
CREATE TABLE IF NOT EXISTS wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('study', 'toy', 'family', 'friend', 'other')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX idx_wishes_user_id ON wishes(user_id);
CREATE INDEX idx_wishes_status ON wishes(status);
CREATE INDEX idx_wishes_category ON wishes(category);
CREATE INDEX idx_wishes_created_at ON wishes(created_at DESC);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_wishes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  IF NEW.status = 'fulfilled' AND OLD.status != 'fulfilled' THEN
    NEW.fulfilled_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wishes_updated_at_trigger
BEFORE UPDATE ON wishes
FOR EACH ROW
EXECUTE FUNCTION update_wishes_updated_at();
