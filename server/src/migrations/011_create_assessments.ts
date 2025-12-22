import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_011_create_assessments: Migration = {
  id: '011',
  name: '011_create_assessments',

  up: async () => {
    // 创建题目类型枚举
    await query(`
      DO $$ BEGIN
        CREATE TYPE question_type AS ENUM ('single', 'multiple', 'truefalse');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建题目分类枚举
    await query(`
      DO $$ BEGIN
        CREATE TYPE question_category AS ENUM ('ai_basics', 'ai_application', 'ai_ethics', 'ai_future');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 创建题目表
    await query(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category question_category NOT NULL,
        type question_type NOT NULL,
        content TEXT NOT NULL,
        options JSONB,
        correct_answer JSONB NOT NULL,
        explanation TEXT,
        difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
        points INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建评估记录表
    await query(`
      CREATE TABLE IF NOT EXISTS assessment_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_questions INTEGER NOT NULL,
        correct_count INTEGER NOT NULL,
        score INTEGER NOT NULL,
        duration INTEGER,
        answers JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_assessment_records_user_id ON assessment_records(user_id)`);

    // 插入示例题目
    await query(`
      INSERT INTO questions (category, type, content, options, correct_answer, explanation, difficulty, points) VALUES
      ('ai_basics', 'single', 'AI是什么的缩写？', '["人工智能", "自动界面", "高级接口", "模拟输入"]', '"人工智能"', 'AI是Artificial Intelligence的缩写，意思是人工智能。', 1, 10),
      ('ai_basics', 'single', '下列哪个是AI的应用？', '["语音助手", "普通计算器", "机械手表", "纸质书籍"]', '"语音助手"', '语音助手如Siri、小爱同学等都使用了AI技术来理解和回应用户的语音指令。', 1, 10),
      ('ai_basics', 'truefalse', 'AI可以像人类一样思考和感受情感。', '["对", "错"]', '"错"', '目前的AI还不能真正理解或感受情感，它只是模拟某些行为模式。', 2, 10),
      ('ai_application', 'multiple', '以下哪些是AI的实际应用场景？', '["人脸识别", "自动驾驶", "智能推荐", "手动计算"]', '["人脸识别", "自动驾驶", "智能推荐"]', '人脸识别、自动驾驶和智能推荐都广泛使用了AI技术。', 2, 15),
      ('ai_ethics', 'single', '使用AI时，我们应该注意什么？', '["保护隐私", "不用思考", "完全依赖", "忽视安全"]', '"保护隐私"', '在使用AI服务时，保护个人隐私是非常重要的。', 3, 15)
      ON CONFLICT DO NOTHING
    `);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS assessment_records CASCADE');
    await query('DROP TABLE IF EXISTS questions CASCADE');
    await query('DROP TYPE IF EXISTS question_category');
    await query('DROP TYPE IF EXISTS question_type');
  }
};
