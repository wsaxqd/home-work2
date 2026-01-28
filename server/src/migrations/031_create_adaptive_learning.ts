import { Migration } from './migrationRunner';
import { query } from '../config/database';

/**
 * 个性化学习引擎 - 数据库迁移
 * 包含6张核心表:
 * 1. knowledge_graph - 知识图谱
 * 2. learning_behavior_analysis - 学习行为分析
 * 3. adaptive_recommendations - 自适应推荐
 * 4. learning_paths - 学习路径
 * 5. user_learning_profiles - 用户学习画像
 * 6. question_attempts扩展 - 答题记录增强
 */

export const migration_031_create_adaptive_learning: Migration = {
  id: '031',
  name: '031_create_adaptive_learning',

  up: async () => {
    console.log('Creating adaptive learning system tables...');

    // ==================== 1. 知识图谱表 ====================
    await query(`
      CREATE TABLE IF NOT EXISTS knowledge_graph (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(50) NOT NULL,                    -- 学科: math, chinese, english
        grade VARCHAR(20) NOT NULL,                      -- 年级: grade_1 ~ grade_6
        knowledge_point_id VARCHAR(100) UNIQUE NOT NULL, -- 知识点ID: math_g3_multiplication
        knowledge_point_name VARCHAR(200) NOT NULL,      -- 知识点名称: 乘法口诀
        description TEXT,                                -- 描述
        difficulty_level INT DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
        parent_knowledge_point_id VARCHAR(100),          -- 父知识点ID (前置依赖)
        related_knowledge_points JSONB,                  -- 相关知识点数组
        question_count INT DEFAULT 0,                    -- 关联题目数量
        resources JSONB,                                 -- 学习资源: {videos: [], articles: []}
        tags JSONB,                                      -- 标签: ["基础", "重点", "难点"]
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 索引
    await query(`
      CREATE INDEX IF NOT EXISTS idx_kg_subject_grade
      ON knowledge_graph(subject, grade)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_kg_parent
      ON knowledge_graph(parent_knowledge_point_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_kg_knowledge_point_id
      ON knowledge_graph(knowledge_point_id)
    `);

    console.log('✅ Created knowledge_graph table');

    // ==================== 2. 学习行为分析表 ====================
    await query(`
      CREATE TABLE IF NOT EXISTS learning_behavior_analysis (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,                           -- 用户ID
        knowledge_point_id VARCHAR(100) NOT NULL,        -- 知识点ID
        total_questions INT DEFAULT 0,                   -- 总做题数
        correct_count INT DEFAULT 0,                     -- 正确数
        wrong_count INT DEFAULT 0,                       -- 错误数
        accuracy_rate DECIMAL(5,2),                      -- 正确率: 0.00-100.00
        avg_answer_time INT,                             -- 平均答题时间(秒)
        fastest_answer_time INT,                         -- 最快答题时间(秒)
        slowest_answer_time INT,                         -- 最慢答题时间(秒)
        repeated_errors INT DEFAULT 0,                   -- 重复错误次数
        mastery_level INT DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
        last_practice_at TIMESTAMP,                      -- 最后练习时间
        first_practice_at TIMESTAMP,                     -- 首次练习时间
        practice_days INT DEFAULT 0,                     -- 练习天数
        consecutive_correct INT DEFAULT 0,               -- 连续答对次数
        consecutive_wrong INT DEFAULT 0,                 -- 连续答错次数
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, knowledge_point_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 索引
    await query(`
      CREATE INDEX IF NOT EXISTS idx_lba_user
      ON learning_behavior_analysis(user_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_lba_knowledge
      ON learning_behavior_analysis(knowledge_point_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_lba_mastery
      ON learning_behavior_analysis(user_id, mastery_level)
    `);

    // 触发器: 自动计算正确率
    await query(`
      CREATE OR REPLACE FUNCTION update_accuracy_rate()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.total_questions > 0 THEN
          NEW.accuracy_rate := (NEW.correct_count::DECIMAL / NEW.total_questions) * 100;
        ELSE
          NEW.accuracy_rate := 0;
        END IF;
        NEW.updated_at := CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await query(`
      DROP TRIGGER IF EXISTS trigger_update_accuracy_rate ON learning_behavior_analysis;
      CREATE TRIGGER trigger_update_accuracy_rate
      BEFORE INSERT OR UPDATE ON learning_behavior_analysis
      FOR EACH ROW
      EXECUTE FUNCTION update_accuracy_rate();
    `);

    console.log('✅ Created learning_behavior_analysis table');

    // ==================== 3. 自适应推荐表 ====================
    await query(`
      CREATE TABLE IF NOT EXISTS adaptive_recommendations (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,                           -- 用户ID
        recommendation_type VARCHAR(50) NOT NULL,        -- 推荐类型: weak_point, review, advance
        knowledge_point_id VARCHAR(100) NOT NULL,        -- 知识点ID
        reason TEXT,                                     -- 推荐原因
        priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
        recommended_resources JSONB,                     -- 推荐资源
        status VARCHAR(20) DEFAULT 'pending',            -- 状态: pending, in_progress, completed, skipped
        progress INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
        effectiveness_score DECIMAL(3,2),                -- 有效性评分: 0-1
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,                            -- 开始时间
        completed_at TIMESTAMP,                          -- 完成时间
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 索引
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ar_user_status
      ON adaptive_recommendations(user_id, status)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ar_priority
      ON adaptive_recommendations(user_id, priority DESC)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ar_type
      ON adaptive_recommendations(recommendation_type)
    `);

    console.log('✅ Created adaptive_recommendations table');

    // ==================== 4. 学习路径表 ====================
    await query(`
      CREATE TABLE IF NOT EXISTS learning_paths (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,                           -- 用户ID
        path_name VARCHAR(200),                          -- 路径名称
        subject VARCHAR(50) NOT NULL,                    -- 学科
        grade VARCHAR(20) NOT NULL,                      -- 年级
        knowledge_points JSONB NOT NULL,                 -- 知识点序列
        current_step INT DEFAULT 0,                      -- 当前步骤
        total_steps INT NOT NULL,                        -- 总步骤数
        progress INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
        status VARCHAR(20) DEFAULT 'active',             -- 状态: active, paused, completed
        estimated_days INT,                              -- 预计完成天数
        actual_days INT,                                 -- 实际完成天数
        effectiveness_score DECIMAL(3,2),                -- 路径有效性: 0-1
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 索引
    await query(`
      CREATE INDEX IF NOT EXISTS idx_lp_user_status
      ON learning_paths(user_id, status)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_lp_subject
      ON learning_paths(subject, grade)
    `);

    console.log('✅ Created learning_paths table');

    // ==================== 5. 用户学习画像表 ====================
    await query(`
      CREATE TABLE IF NOT EXISTS user_learning_profiles (
        id SERIAL PRIMARY KEY,
        user_id UUID UNIQUE NOT NULL,                    -- 用户ID
        learning_style VARCHAR(50),                      -- 学习风格: visual, auditory, kinesthetic
        learning_pace VARCHAR(50),                       -- 学习节奏: slow, medium, fast
        preferred_difficulty VARCHAR(50),                -- 偏好难度: easy, medium, hard
        weak_subjects JSONB,                             -- 薄弱学科
        strong_subjects JSONB,                           -- 擅长学科
        avg_study_time_per_day INT,                      -- 日均学习时长(分钟)
        most_active_time VARCHAR(50),                    -- 最活跃时段
        attention_span INT,                              -- 专注时长(分钟)
        motivation_level INT DEFAULT 5 CHECK (motivation_level BETWEEN 1 AND 10),
        challenge_preference INT DEFAULT 5 CHECK (challenge_preference BETWEEN 1 AND 10),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 索引
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ulp_user
      ON user_learning_profiles(user_id)
    `);

    console.log('✅ Created user_learning_profiles table');

    // ==================== 6. 扩展question_attempts表 ====================
    // 检查question_attempts表是否存在
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'question_attempts'
      );
    `);

    if (tableExists.rows[0].exists) {
      // 添加新字段
      await query(`
        ALTER TABLE question_attempts
        ADD COLUMN IF NOT EXISTS knowledge_point_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS difficulty_level INT,
        ADD COLUMN IF NOT EXISTS answer_time INT,
        ADD COLUMN IF NOT EXISTS hint_used BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1
      `);

      // 添加索引
      await query(`
        CREATE INDEX IF NOT EXISTS idx_qa_knowledge
        ON question_attempts(knowledge_point_id)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_qa_user_knowledge
        ON question_attempts(user_id, knowledge_point_id, created_at)
      `);

      console.log('✅ Extended question_attempts table');
    } else {
      // 如果表不存在,创建完整的表
      await query(`
        CREATE TABLE IF NOT EXISTS question_attempts (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          question_id INT NOT NULL,
          knowledge_point_id VARCHAR(100),
          difficulty_level INT,
          answer TEXT,
          is_correct BOOLEAN NOT NULL,
          answer_time INT,
          hint_used BOOLEAN DEFAULT FALSE,
          attempt_number INT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_qa_user ON question_attempts(user_id)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_qa_knowledge
        ON question_attempts(knowledge_point_id)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_qa_user_knowledge
        ON question_attempts(user_id, knowledge_point_id, created_at)
      `);

      console.log('✅ Created question_attempts table');
    }

    console.log('🎉 All adaptive learning tables created successfully!');
  },

  down: async () => {
    console.log('Rolling back adaptive learning system tables...');

    // 按依赖关系反向删除
    await query('DROP TABLE IF EXISTS adaptive_recommendations CASCADE');
    await query('DROP TABLE IF EXISTS learning_paths CASCADE');
    await query('DROP TABLE IF EXISTS user_learning_profiles CASCADE');
    await query('DROP TABLE IF EXISTS learning_behavior_analysis CASCADE');
    await query('DROP TABLE IF EXISTS knowledge_graph CASCADE');

    // 删除触发器和函数
    await query('DROP TRIGGER IF EXISTS trigger_update_accuracy_rate ON learning_behavior_analysis');
    await query('DROP FUNCTION IF EXISTS update_accuracy_rate()');

    // 移除question_attempts扩展字段
    await query(`
      ALTER TABLE question_attempts
      DROP COLUMN IF EXISTS knowledge_point_id,
      DROP COLUMN IF EXISTS difficulty_level,
      DROP COLUMN IF EXISTS answer_time,
      DROP COLUMN IF EXISTS hint_used,
      DROP COLUMN IF EXISTS attempt_number
    `);

    console.log('✅ Rolled back all adaptive learning tables');
  }
};
