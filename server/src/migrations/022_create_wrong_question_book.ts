import { Pool } from 'pg'

/**
 * 迁移：创建错题本系统表
 *
 * 功能说明：
 * - 自动记录做错的题目
 * - 智能分析错误类型和薄弱知识点
 * - 生成相似题目进行强化训练
 * - 提供错题复习计划
 */

export async function up(pool: Pool): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. 错题记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS wrong_questions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id VARCHAR(255),             -- 题目ID（如果是OCR识别的可能没有）
        subject VARCHAR(50) NOT NULL,          -- 科目
        grade_level VARCHAR(50),               -- 年级
        question_text TEXT NOT NULL,           -- 题目内容（OCR识别）
        question_image TEXT,                   -- 题目图片URL
        correct_answer TEXT,                   -- 正确答案
        user_answer TEXT,                      -- 用户答案
        error_type VARCHAR(100),               -- 错误类型：计算错误、概念理解、审题不清等
        knowledge_points JSONB,                -- 涉及的知识点数组
        difficulty_level VARCHAR(20),          -- 难度：easy, medium, hard
        mistake_count INTEGER DEFAULT 1,       -- 错误次数
        is_mastered BOOLEAN DEFAULT false,     -- 是否已掌握
        first_wrong_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 首次做错时间
        last_wrong_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 最近错误时间
        next_review_at TIMESTAMP,              -- 下次复习时间
        review_count INTEGER DEFAULT 0,        -- 复习次数
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 2. 错题复习记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS wrong_question_reviews (
        id SERIAL PRIMARY KEY,
        wrong_question_id INTEGER NOT NULL REFERENCES wrong_questions(id) ON DELETE CASCADE,
        review_result VARCHAR(20) NOT NULL,    -- 复习结果：correct, wrong, skipped
        time_spent INTEGER,                     -- 用时（秒）
        confidence_level INTEGER,               -- 信心指数 1-5
        notes TEXT,                            -- 复习笔记
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 3. 知识点薄弱分析表
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_weakness (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(50) NOT NULL,
        knowledge_point VARCHAR(200) NOT NULL, -- 知识点名称
        wrong_count INTEGER DEFAULT 0,          -- 错误次数
        total_count INTEGER DEFAULT 0,          -- 总做题次数
        weakness_level VARCHAR(20),             -- 薄弱程度：high, medium, low
        last_practice_at TIMESTAMP,             -- 最近练习时间
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_knowledge UNIQUE (user_id, subject, knowledge_point)
      )
    `)

    // 4. AI讲解记录表（苏格拉底式对话）
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_explanations (
        id SERIAL PRIMARY KEY,
        question_id VARCHAR(255),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        explanation_type VARCHAR(50) NOT NULL,  -- 讲解类型：direct, socratic, step_by_step
        conversation JSONB,                     -- 对话记录数组
        knowledge_points_covered JSONB,         -- 涉及的知识点
        effectiveness_rating INTEGER,           -- 效果评分 1-5
        completion_status VARCHAR(20),          -- 完成状态：completed, abandoned, in_progress
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 5. OCR识别记录表（增强版）
    await client.query(`
      CREATE TABLE IF NOT EXISTS ocr_recognitions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        image_path TEXT NOT NULL,
        recognized_text TEXT,
        confidence DECIMAL(5,2),                -- 识别置信度 0-100
        subject VARCHAR(50),
        grade_level VARCHAR(50),
        question_type VARCHAR(100),             -- 题型：选择、填空、解答等
        processing_time INTEGER,                -- 处理时间（毫秒）
        status VARCHAR(20) DEFAULT 'pending',   -- 状态：pending, success, failed
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject ON wrong_questions(subject)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_wrong_questions_mastered ON wrong_questions(is_mastered)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_wrong_questions_next_review ON wrong_questions(next_review_at)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_knowledge_weakness_user_subject ON knowledge_weakness(user_id, subject)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_ai_explanations_user_id ON ai_explanations(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_ocr_recognitions_user_id ON ocr_recognitions(user_id)')

    await client.query('COMMIT')
    console.log('✅ 迁移 022: 错题本系统表创建成功')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 迁移 022 失败:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function down(pool: Pool): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query('DROP TABLE IF EXISTS ocr_recognitions CASCADE')
    await client.query('DROP TABLE IF EXISTS ai_explanations CASCADE')
    await client.query('DROP TABLE IF EXISTS knowledge_weakness CASCADE')
    await client.query('DROP TABLE IF EXISTS wrong_question_reviews CASCADE')
    await client.query('DROP TABLE IF EXISTS wrong_questions CASCADE')

    await client.query('COMMIT')
    console.log('✅ 迁移 022 回滚成功')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 迁移 022 回滚失败:', error)
    throw error
  } finally {
    client.release()
  }
}
