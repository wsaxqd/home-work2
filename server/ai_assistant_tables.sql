-- AI学习助手系统 数据库表

-- 1. AI学习诊断记录表
CREATE TABLE IF NOT EXISTS ai_learning_diagnosis (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diagnosis_type VARCHAR(50) NOT NULL, -- weekly, monthly, on_demand
  subject VARCHAR(50),

  -- 诊断结果
  overall_score DECIMAL(5,2), -- 综合评分 0-100
  strengths JSONB, -- 优势领域 [{area: '加法运算', score: 95}]
  weaknesses JSONB, -- 薄弱领域 [{area: '除法应用', score: 45, priority: 'high'}]
  improvement_suggestions JSONB, -- 改进建议

  -- 数据来源统计
  analyzed_questions_count INTEGER DEFAULT 0, -- 分析的题目数
  analyzed_time_range JSONB, -- 分析的时间范围 {start_date, end_date}

  -- AI生成内容
  ai_summary TEXT, -- AI生成的总结
  ai_recommendations TEXT, -- AI推荐的学习内容

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. AI个性化学习计划表
CREATE TABLE IF NOT EXISTS ai_learning_plans (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diagnosis_id INTEGER REFERENCES ai_learning_diagnosis(id),

  plan_name VARCHAR(200) NOT NULL,
  plan_type VARCHAR(50) DEFAULT 'auto', -- auto, manual, hybrid
  subject VARCHAR(50) NOT NULL,
  difficulty_level VARCHAR(20), -- easy, medium, hard

  -- 计划周期
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER, -- 计划天数

  -- 学习目标
  goals JSONB NOT NULL, -- [{goal: '掌握乘法表', target_score: 90, knowledge_points: [...]}]
  daily_target_minutes INTEGER DEFAULT 30, -- 每日学习目标（分钟）
  weekly_target_topics INTEGER DEFAULT 5, -- 每周学习主题数

  -- 计划内容
  topics JSONB NOT NULL, -- [{day: 1, topic: '两位数乘法', exercises: [...], estimated_time: 30}]
  milestones JSONB, -- 里程碑 [{day: 7, milestone: '完成基础练习', reward: {...}}]

  -- 进度跟踪
  current_day INTEGER DEFAULT 1,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. AI学习计划执行记录表
CREATE TABLE IF NOT EXISTS ai_plan_progress (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES ai_learning_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  day_number INTEGER NOT NULL, -- 第几天
  topic_name VARCHAR(200), -- 当天主题

  -- 完成情况
  is_completed BOOLEAN DEFAULT false,
  actual_time_spent INTEGER, -- 实际用时（分钟）
  completed_exercises_count INTEGER DEFAULT 0,
  correct_rate DECIMAL(5,2), -- 正确率

  -- 反馈
  difficulty_rating INTEGER, -- 难度评分 1-5
  user_notes TEXT,
  ai_feedback TEXT, -- AI生成的反馈

  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. AI题目讲解记录表
CREATE TABLE IF NOT EXISTS ai_question_explanations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER, -- 关联题目ID（可选）
  wrong_question_id INTEGER REFERENCES wrong_questions(id), -- 关联错题ID（可选）

  -- 题目信息
  subject VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  question_image VARCHAR(500),
  correct_answer TEXT,
  user_answer TEXT,

  -- AI讲解内容
  explanation_type VARCHAR(50) DEFAULT 'detailed', -- quick, detailed, step_by_step
  ai_explanation TEXT NOT NULL, -- AI生成的详细讲解
  knowledge_points JSONB, -- 涉及的知识点
  similar_questions JSONB, -- 相似题目推荐

  -- 讲解步骤（分步讲解）
  explanation_steps JSONB, -- [{step: 1, title: '理解题意', content: '...', images: [...]}]

  -- 用户反馈
  is_helpful BOOLEAN,
  helpfulness_rating INTEGER, -- 帮助程度 1-5
  user_feedback TEXT,

  -- 后续练习
  has_practiced BOOLEAN DEFAULT false,
  practice_result VARCHAR(20), -- correct, wrong, skipped

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. AI学习伙伴对话表
CREATE TABLE IF NOT EXISTS ai_companion_chats (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL, -- 对话会话ID

  -- 对话信息
  role VARCHAR(20) NOT NULL, -- user, assistant
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, voice, encouragement, question

  -- 上下文
  context_data JSONB, -- 上下文信息（如当前学习的题目、进度等）
  emotion_detected VARCHAR(50), -- 检测到的情绪（如frustrated, happy, confused）

  -- AI回复元数据
  ai_intent VARCHAR(100), -- AI意图（如explain, encourage, guide, quiz）
  confidence_score DECIMAL(5,2), -- AI置信度

  -- 互动统计
  user_rating INTEGER, -- 用户对此回复的评分 1-5
  is_bookmarked BOOLEAN DEFAULT false, -- 是否收藏

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI学习报告表
CREATE TABLE IF NOT EXISTS ai_learning_reports (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  report_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  subject VARCHAR(50), -- null表示全科目

  -- 统计数据
  stats JSONB NOT NULL, -- 详细统计 {total_time, questions_solved, accuracy_rate, ...}

  -- AI分析内容
  ai_summary TEXT NOT NULL, -- AI生成的学习总结
  highlights JSONB, -- 亮点 [{type: 'achievement', content: '...', emoji: '🏆'}]
  areas_to_improve JSONB, -- 需改进领域
  next_week_suggestions TEXT, -- 下周建议

  -- 可视化数据
  charts_data JSONB, -- 图表数据 {time_distribution: [...], accuracy_trend: [...]}

  -- 成就徽章
  badges_earned JSONB, -- 本期获得的徽章

  -- 分享
  is_shared BOOLEAN DEFAULT false,
  share_token VARCHAR(100),

  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. AI智能推荐表
CREATE TABLE IF NOT EXISTS ai_smart_recommendations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  recommendation_type VARCHAR(50) NOT NULL, -- question, topic, resource, friend, challenge
  priority INTEGER DEFAULT 5, -- 优先级 1-10

  -- 推荐内容
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content_data JSONB NOT NULL, -- 推荐的具体内容

  -- 推荐原因
  reason TEXT, -- AI生成的推荐理由
  based_on JSONB, -- 推荐依据 {weak_points: [...], learning_history: [...]}

  -- 用户反馈
  is_viewed BOOLEAN DEFAULT false,
  is_accepted BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  feedback_rating INTEGER, -- 推荐质量评分 1-5

  -- 有效期
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. AI对话上下文缓存表（优化性能）
CREATE TABLE IF NOT EXISTS ai_context_cache (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,

  -- 缓存数据
  context_type VARCHAR(50) NOT NULL, -- learning, companion, tutor
  context_data JSONB NOT NULL, -- 完整上下文数据

  -- 缓存管理
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- 过期时间

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (user_id, session_id, context_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_diagnosis_user ON ai_learning_diagnosis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_diagnosis_date ON ai_learning_diagnosis(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_plans_user ON ai_learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_plans_active ON ai_learning_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_progress_plan ON ai_plan_progress(plan_id);
CREATE INDEX IF NOT EXISTS idx_ai_explanations_user ON ai_question_explanations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_session ON ai_companion_chats(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user ON ai_companion_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_user ON ai_learning_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_period ON ai_learning_reports(report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_smart_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_user ON ai_context_cache(user_id, session_id);

-- 插入示例数据（用于测试）
-- AI推荐示例
INSERT INTO ai_smart_recommendations (user_id, recommendation_type, priority, title, description, content_data, reason) VALUES
(
  (SELECT id FROM users LIMIT 1),
  'topic',
  8,
  '建议加强练习：两位数乘法',
  '根据你最近的错题分析，两位数乘法是你的薄弱环节',
  '{"subject": "math", "topic": "two_digit_multiplication", "difficulty": "medium", "estimated_time": 30}',
  '你在最近10道两位数乘法题中错了6道，正确率只有40%。建议通过专项练习巩固这个知识点。'
)
ON CONFLICT DO NOTHING;
