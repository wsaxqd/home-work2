import { QueryResult } from 'pg';
import { query } from '../config/database';

export const migration_037_create_learning_analytics = {
  id: '037',
  name: '037_create_learning_analytics',

  async up(): Promise<void> {
    // 1. 学习统计表 - 每日学习数据汇总
    await query(`
      CREATE TABLE IF NOT EXISTS learning_statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stat_date DATE NOT NULL,

        -- 学习时长(分钟)
        total_learning_time INTEGER DEFAULT 0,
        reading_time INTEGER DEFAULT 0,
        game_time INTEGER DEFAULT 0,
        ai_chat_time INTEGER DEFAULT 0,
        creation_time INTEGER DEFAULT 0,

        -- 学习次数
        learning_sessions INTEGER DEFAULT 0,
        questions_answered INTEGER DEFAULT 0,
        questions_correct INTEGER DEFAULT 0,

        -- 内容统计
        books_read INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        works_created INTEGER DEFAULT 0,
        ai_conversations INTEGER DEFAULT 0,

        -- 积分和成就
        points_earned INTEGER DEFAULT 0,
        achievements_unlocked INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,

        -- 学习效果
        accuracy_rate DECIMAL(5,2),
        completion_rate DECIMAL(5,2),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id, stat_date)
      );

      CREATE INDEX IF NOT EXISTS idx_learning_statistics_user_date ON learning_statistics(user_id, stat_date DESC);
    `);

    // 2. 学习行为记录表 - 详细的学习行为日志
    await query(`
      CREATE TABLE IF NOT EXISTS learning_behavior_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- 行为类型
        behavior_type VARCHAR(50) NOT NULL,  -- reading, game, ai_chat, creation, learning_path, etc.
        action VARCHAR(50) NOT NULL,         -- start, complete, pause, resume

        -- 行为关联
        content_id VARCHAR(100),
        content_type VARCHAR(50),
        content_title VARCHAR(200),

        -- 时长和进度
        duration INTEGER,  -- 秒
        progress INTEGER,  -- 百分比

        -- 结果数据
        result JSONB,  -- 存储具体结果数据,如答题正确率、创作作品详情等

        -- 环境信息
        device_type VARCHAR(50),
        session_id VARCHAR(100),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_behavior_logs_user_time ON learning_behavior_logs(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_behavior_logs_type ON learning_behavior_logs(behavior_type);
    `);

    // 3. 学习目标表
    await query(`
      CREATE TABLE IF NOT EXISTS learning_goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        goal_type VARCHAR(50) NOT NULL,  -- daily, weekly, monthly

        -- 目标内容
        target_metric VARCHAR(50) NOT NULL,  -- learning_time, books_read, tasks_completed, etc.
        target_value INTEGER NOT NULL,
        current_value INTEGER DEFAULT 0,

        -- 时间范围
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,

        -- 状态
        status VARCHAR(20) DEFAULT 'active',  -- active, completed, failed, expired
        completed_at TIMESTAMP,

        -- 奖励
        reward_points INTEGER DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_learning_goals_user_status ON learning_goals(user_id, status, end_date DESC);
    `);

    // 4. 学习里程碑表
    await query(`
      CREATE TABLE IF NOT EXISTS learning_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        milestone_type VARCHAR(50) NOT NULL,
        milestone_name VARCHAR(100) NOT NULL,
        description TEXT,

        -- 里程碑数据
        metric_name VARCHAR(50),
        metric_value INTEGER,

        achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- 奖励
        reward_points INTEGER DEFAULT 0,
        badge_icon VARCHAR(50)
      );

      CREATE INDEX IF NOT EXISTS idx_milestones_user_time ON learning_milestones(user_id, achieved_at DESC);
    `);

    // 5. 知识点掌握度表
    await query(`
      CREATE TABLE IF NOT EXISTS knowledge_mastery (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        knowledge_point_id VARCHAR(100),  -- 改为VARCHAR,不使用外键

        -- 掌握度指标
        mastery_level INTEGER DEFAULT 0,  -- 0-100
        practice_count INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        wrong_count INTEGER DEFAULT 0,

        -- 最近练习
        last_practiced_at TIMESTAMP,
        last_result VARCHAR(20),  -- correct, wrong, partial

        -- 复习计划
        next_review_at TIMESTAMP,
        review_interval INTEGER DEFAULT 1,  -- 天数

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id, knowledge_point_id)
      );

      CREATE INDEX IF NOT EXISTS idx_knowledge_mastery_user ON knowledge_mastery(user_id, mastery_level DESC);
      CREATE INDEX IF NOT EXISTS idx_knowledge_mastery_review ON knowledge_mastery(user_id, next_review_at);
    `);

    console.log('✅ 学习数据统计表创建成功');
  },

  async down(): Promise<void> {
    await query('DROP TABLE IF EXISTS knowledge_mastery CASCADE');
    await query('DROP TABLE IF EXISTS learning_milestones CASCADE');
    await query('DROP TABLE IF EXISTS learning_goals CASCADE');
    await query('DROP TABLE IF EXISTS learning_behavior_logs CASCADE');
    await query('DROP TABLE IF EXISTS learning_statistics CASCADE');

    console.log('✅ 学习数据统计表删除成功');
  }
};
