import { Migration } from './migrationRunner';

export const migration_029_create_homework_helper: Migration = {
  name: '029_create_homework_helper',
  async up(client) {
    // 作业题目表
    await client.query(`
      CREATE TABLE IF NOT EXISTS homework_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- 图片信息
        image_url VARCHAR(500) NOT NULL,
        image_hash VARCHAR(64),

        -- OCR识别结果
        ocr_text TEXT,
        ocr_confidence DECIMAL(5,2),
        question_type VARCHAR(50),

        -- 题目内容
        subject VARCHAR(50),
        grade_level VARCHAR(20),
        difficulty VARCHAR(20),

        -- 状态
        status VARCHAR(20) DEFAULT 'pending',

        -- 时间戳
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- 索引
        INDEX idx_homework_user_id (user_id),
        INDEX idx_homework_created_at (created_at),
        INDEX idx_homework_status (status)
      );
    `);

    // 解答记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS homework_answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES homework_questions(id) ON DELETE CASCADE,

        -- 解答内容
        answer_text TEXT NOT NULL,
        explanation TEXT,
        steps JSONB,
        knowledge_points JSONB,

        -- AI信息
        ai_provider VARCHAR(50),
        ai_model VARCHAR(50),
        confidence_score DECIMAL(5,2),

        -- 用户反馈
        is_helpful BOOLEAN,
        user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
        user_feedback TEXT,

        -- 时间戳
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- 索引
        INDEX idx_answer_question_id (question_id),
        INDEX idx_answer_created_at (created_at)
      );
    `);

    // 收藏题目表
    await client.query(`
      CREATE TABLE IF NOT EXISTS homework_favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES homework_questions(id) ON DELETE CASCADE,

        -- 收藏信息
        tags JSONB,
        notes TEXT,

        -- 时间戳
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- 唯一约束
        UNIQUE(user_id, question_id),

        -- 索引
        INDEX idx_fav_user_id (user_id),
        INDEX idx_fav_created_at (created_at)
      );
    `);

    // 学习统计表
    await client.query(`
      CREATE TABLE IF NOT EXISTS homework_statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- 统计数据
        date DATE NOT NULL,
        total_questions INTEGER DEFAULT 0,
        solved_questions INTEGER DEFAULT 0,
        subjects JSONB,
        average_confidence DECIMAL(5,2),

        -- 时间戳
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- 唯一约束
        UNIQUE(user_id, date),

        -- 索引
        INDEX idx_stats_user_date (user_id, date)
      );
    `);

    console.log('✅ Created homework_questions table');
    console.log('✅ Created homework_answers table');
    console.log('✅ Created homework_favorites table');
    console.log('✅ Created homework_statistics table');
  },

  async down(client) {
    await client.query('DROP TABLE IF EXISTS homework_statistics CASCADE');
    await client.query('DROP TABLE IF EXISTS homework_favorites CASCADE');
    await client.query('DROP TABLE IF EXISTS homework_answers CASCADE');
    await client.query('DROP TABLE IF EXISTS homework_questions CASCADE');
    console.log('✅ Dropped homework helper tables');
  }
};
