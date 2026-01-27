import { query } from '../config/database';

export const migration_039_create_learning_plan = {
  id: '039',
  name: '039_create_learning_plan',

  async up(): Promise<void> {
    // 1. 创建学习计划表
    await query(`
      CREATE TABLE IF NOT EXISTS learning_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- 计划基本信息
        title VARCHAR(200) NOT NULL,
        description TEXT,
        plan_type VARCHAR(50) DEFAULT 'auto', -- auto(AI生成) / manual(手动创建)

        -- 计划周期
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,

        -- 学习目标
        target_subjects JSONB DEFAULT '[]', -- ['数学', '语文', '英语']
        target_skills JSONB DEFAULT '[]', -- ['加减法', '拼音', '字母']
        daily_learning_time INTEGER DEFAULT 30, -- 每天学习分钟数

        -- AI推荐参数
        difficulty_level INTEGER DEFAULT 3, -- 1-5 难度等级
        learning_pace VARCHAR(20) DEFAULT 'normal', -- slow / normal / fast

        -- 计划状态
        status VARCHAR(20) DEFAULT 'active', -- active / completed / paused / expired
        completion_rate INTEGER DEFAULT 0, -- 完成百分比

        -- 时间戳
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,

        CONSTRAINT valid_difficulty CHECK (difficulty_level BETWEEN 1 AND 5),
        CONSTRAINT valid_completion_rate CHECK (completion_rate BETWEEN 0 AND 100)
      );

      CREATE INDEX IF NOT EXISTS idx_learning_plans_user ON learning_plans(user_id);
      CREATE INDEX IF NOT EXISTS idx_learning_plans_status ON learning_plans(status);
      CREATE INDEX IF NOT EXISTS idx_learning_plans_dates ON learning_plans(start_date, end_date);
    `);

    // 2. 创建学习计划任务表
    await query(`
      CREATE TABLE IF NOT EXISTS learning_plan_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- 任务基本信息
        title VARCHAR(200) NOT NULL,
        description TEXT,
        task_type VARCHAR(50) NOT NULL, -- reading / practice / game / video / assessment

        -- 关联内容
        content_id VARCHAR(100), -- 关联的内容ID(绘本ID、关卡ID等)
        content_type VARCHAR(50), -- picture_book / game_level / encyclopedia
        subject VARCHAR(50), -- 学科: 数学/语文/英语/科学等

        -- 任务调度
        scheduled_date DATE NOT NULL,
        scheduled_time TIME, -- 建议学习时间
        estimated_duration INTEGER, -- 预计完成时长(分钟)
        order_index INTEGER DEFAULT 0, -- 当天任务的顺序

        -- 任务状态
        status VARCHAR(20) DEFAULT 'pending', -- pending / in_progress / completed / skipped
        completed_at TIMESTAMP,
        actual_duration INTEGER, -- 实际完成时长

        -- 完成质量
        score INTEGER, -- 得分(0-100)
        accuracy DECIMAL(5,2), -- 正确率

        -- AI反馈
        ai_feedback TEXT, -- AI给出的反馈建议
        difficulty_adjustment INTEGER DEFAULT 0, -- 难度调整建议 (-2到+2)

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT valid_score CHECK (score IS NULL OR score BETWEEN 0 AND 100)
      );

      CREATE INDEX IF NOT EXISTS idx_plan_tasks_plan ON learning_plan_tasks(plan_id);
      CREATE INDEX IF NOT EXISTS idx_plan_tasks_user ON learning_plan_tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_plan_tasks_date ON learning_plan_tasks(scheduled_date);
      CREATE INDEX IF NOT EXISTS idx_plan_tasks_status ON learning_plan_tasks(status);
    `);

    // 3. 创建学习时段偏好表
    await query(`
      CREATE TABLE IF NOT EXISTS learning_time_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- 星期几 (0=周日, 1=周一, ..., 6=周六)
        day_of_week INTEGER NOT NULL,

        -- 时间段
        time_slot_start TIME NOT NULL,
        time_slot_end TIME NOT NULL,

        -- 偏好权重 (1-5)
        preference_level INTEGER DEFAULT 3,

        -- 是否启用
        is_enabled BOOLEAN DEFAULT TRUE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id, day_of_week, time_slot_start),
        CONSTRAINT valid_day CHECK (day_of_week BETWEEN 0 AND 6),
        CONSTRAINT valid_preference CHECK (preference_level BETWEEN 1 AND 5)
      );

      CREATE INDEX IF NOT EXISTS idx_time_preferences_user ON learning_time_preferences(user_id);
    `);

    // 4. 创建学习能力评估表
    await query(`
      CREATE TABLE IF NOT EXISTS learning_ability_assessment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- 学科能力
        subject VARCHAR(50) NOT NULL,
        skill_name VARCHAR(100) NOT NULL, -- 具体技能点

        -- 能力评分 (0-100)
        mastery_level INTEGER DEFAULT 0, -- 掌握度
        difficulty_comfort INTEGER DEFAULT 3, -- 舒适难度 (1-5)
        learning_speed DECIMAL(5,2) DEFAULT 1.0, -- 学习速度系数

        -- 统计数据
        practice_count INTEGER DEFAULT 0, -- 练习次数
        success_count INTEGER DEFAULT 0, -- 成功次数
        avg_accuracy DECIMAL(5,2) DEFAULT 0, -- 平均正确率

        -- 趋势分析
        recent_performance JSONB DEFAULT '[]', -- 最近10次表现
        improvement_rate DECIMAL(5,2) DEFAULT 0, -- 进步速率

        last_assessed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id, subject, skill_name),
        CONSTRAINT valid_mastery CHECK (mastery_level BETWEEN 0 AND 100),
        CONSTRAINT valid_comfort CHECK (difficulty_comfort BETWEEN 1 AND 5)
      );

      CREATE INDEX IF NOT EXISTS idx_ability_assessment_user ON learning_ability_assessment(user_id);
      CREATE INDEX IF NOT EXISTS idx_ability_assessment_subject ON learning_ability_assessment(subject);
    `);

    console.log('✅ 学习计划系统表创建完成');
  },

  async down(): Promise<void> {
    await query('DROP TABLE IF EXISTS learning_ability_assessment CASCADE');
    await query('DROP TABLE IF EXISTS learning_time_preferences CASCADE');
    await query('DROP TABLE IF EXISTS learning_plan_tasks CASCADE');
    await query('DROP TABLE IF EXISTS learning_plans CASCADE');

    console.log('✅ 学习计划系统表删除完成');
  }
};
