-- 创建作业助手相关表
-- 012_create_homework_helper_tables.sql

-- 1. 作业题目表
CREATE TABLE IF NOT EXISTS homework_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  ocr_text TEXT,
  confidence DECIMAL(5,2),
  question_type VARCHAR(50),
  subject VARCHAR(50),
  grade_level VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_homework_questions_user_id ON homework_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_homework_questions_status ON homework_questions(status);
CREATE INDEX IF NOT EXISTS idx_homework_questions_subject ON homework_questions(subject);
CREATE INDEX IF NOT EXISTS idx_homework_questions_created_at ON homework_questions(created_at DESC);

-- 2. 作业解答表
CREATE TABLE IF NOT EXISTS homework_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES homework_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  steps JSONB,
  knowledge_points JSONB,
  explanation TEXT,
  confidence DECIMAL(5,2),
  ai_model VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_homework_answers_question_id ON homework_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_homework_answers_created_at ON homework_answers(created_at DESC);

-- 3. 作业收藏表
CREATE TABLE IF NOT EXISTS homework_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES homework_questions(id) ON DELETE CASCADE,
  notes TEXT,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_homework_favorites_user_id ON homework_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_homework_favorites_question_id ON homework_favorites(question_id);
CREATE INDEX IF NOT EXISTS idx_homework_favorites_created_at ON homework_favorites(created_at DESC);

-- 4. 作业统计表
CREATE TABLE IF NOT EXISTS homework_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(50),
  total_questions INTEGER DEFAULT 0,
  answered_questions INTEGER DEFAULT 0,
  favorite_questions INTEGER DEFAULT 0,
  last_practice_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, subject)
);

CREATE INDEX IF NOT EXISTS idx_homework_statistics_user_id ON homework_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_homework_statistics_subject ON homework_statistics(subject);

-- 添加触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_homework_questions_updated_at
  BEFORE UPDATE ON homework_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_answers_updated_at
  BEFORE UPDATE ON homework_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homework_statistics_updated_at
  BEFORE UPDATE ON homework_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
