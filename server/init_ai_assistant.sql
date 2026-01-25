-- AI学习助手系统 - 完整初始化脚本
-- 包含所有依赖表的创建

-- 1. 错题表 (AI诊断的基础数据源)
DROP TABLE IF EXISTS wrong_questions CASCADE;
CREATE TABLE wrong_questions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_image TEXT,
    correct_answer TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    knowledge_points JSONB DEFAULT '[]',
    error_type VARCHAR(50),
    difficulty_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wrong_questions_user_id ON wrong_questions(user_id);
CREATE INDEX idx_wrong_questions_subject ON wrong_questions(subject);
CREATE INDEX idx_wrong_questions_created_at ON wrong_questions(created_at);

-- 2. AI学习诊断表
CREATE TABLE IF NOT EXISTS ai_learning_diagnosis (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diagnosis_type VARCHAR(50) NOT NULL,
  subject VARCHAR(50),
  overall_score DECIMAL(5,2),
  strengths JSONB,
  weaknesses JSONB,
  improvement_suggestions JSONB,
  analyzed_questions_count INTEGER DEFAULT 0,
  analyzed_time_range JSONB,
  ai_summary TEXT,
  ai_recommendations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_learning_diagnosis_user_id ON ai_learning_diagnosis(user_id);

-- 3. AI题目讲解表
DROP TABLE IF EXISTS ai_question_explanations CASCADE;
CREATE TABLE ai_question_explanations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER,
  wrong_question_id INTEGER REFERENCES wrong_questions(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  question_image VARCHAR(500),
  correct_answer TEXT,
  user_answer TEXT,
  explanation_type VARCHAR(50) DEFAULT 'detailed',
  ai_explanation TEXT NOT NULL,
  knowledge_points JSONB,
  similar_questions JSONB,
  explanation_steps JSONB,
  is_helpful BOOLEAN,
  helpfulness_rating INTEGER,
  user_feedback TEXT,
  has_practiced BOOLEAN DEFAULT false,
  practice_result VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_question_explanations_user_id ON ai_question_explanations(user_id);
CREATE INDEX idx_ai_question_explanations_subject ON ai_question_explanations(subject);
CREATE INDEX idx_ai_question_explanations_wrong_question_id ON ai_question_explanations(wrong_question_id);

-- 4. 插入测试错题数据
INSERT INTO wrong_questions (user_id, question_text, question_image, correct_answer, user_answer, subject, knowledge_points, error_type, difficulty_level)
VALUES
('f83caf5c-fea3-4f73-b24f-b6552e26d148', '35 × 28 = ?', NULL, '980', '920', 'math', '["乘法运算", "两位数乘法"]', 'calculation_error', 'medium'),
('f83caf5c-fea3-4f73-b24f-b6552e26d148', '128 + 75 = ?', NULL, '203', '213', 'math', '["加法运算", "进位加法"]', 'calculation_error', 'easy'),
('f83caf5c-fea3-4f73-b24f-b6552e26d148', '240 ÷ 6 = ?', NULL, '40', '30', 'math', '["除法运算", "整除"]', 'concept_misunderstanding', 'easy'),
('f83caf5c-fea3-4f73-b24f-b6552e26d148', '长方形面积 = 6 × 4', NULL, '24', '20', 'math', '["几何", "面积计算"]', 'formula_forgotten', 'medium'),
('f83caf5c-fea3-4f73-b24f-b6552e26d148', '1/2 + 1/4 = ?', NULL, '3/4', '1/2', 'math', '["分数运算", "加法运算"]', 'concept_misunderstanding', 'hard'),
('f83caf5c-fea3-4f73-b24f-b6552e26d148', '15 × 12 = ?', NULL, '180', '150', 'math', '["乘法运算", "两位数乘法"]', 'calculation_error', 'medium'),
('f83caf5c-fea3-4f73-b24f-b6552e26d148', '256 - 89 = ?', NULL, '167', '177', 'math', '["减法运算", "退位减法"]', 'calculation_error', 'easy'),
('f83caf5c-fea3-4f73-b24f-b6552e26d148', '周长计算: 长5宽3', NULL, '16', '15', 'math', '["几何", "周长计算"]', 'formula_forgotten', 'medium'),
('f83caf5c-fea3-4f73-b24f-b6552e26d148', '9 × 9 = ?', NULL, '81', '72', 'math', '["乘法运算", "乘法口诀"]', 'memory_error', 'easy'),
('f83caf5c-fea3-4f73-b24f-b6552e26d148', '应用题: 买3本书每本12元', NULL, '36', '30', 'math', '["应用题", "乘法运算"]', 'comprehension_error', 'medium')
ON CONFLICT DO NOTHING;

-- 验证数据
SELECT
  'AI助手表创建完成' as status,
  (SELECT COUNT(*) FROM wrong_questions) as wrong_questions_count,
  (SELECT COUNT(*) FROM ai_learning_diagnosis) as diagnosis_count,
  (SELECT COUNT(*) FROM ai_question_explanations) as explanations_count;
