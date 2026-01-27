import { query } from '../config/database';

export const migration_040_create_skill_tree = {
  id: '040',
  name: '040_create_skill_tree',

  async up(): Promise<void> {
    // 1. 创建技能树节点表
    await query(`
      CREATE TABLE IF NOT EXISTS skill_tree_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- 节点基本信息
        node_key VARCHAR(100) NOT NULL UNIQUE, -- 唯一标识: math_addition_basic
        node_name VARCHAR(100) NOT NULL, -- 显示名称: 基础加法
        description TEXT,

        -- 分类
        subject VARCHAR(50) NOT NULL, -- 学科: 数学/语文/英语
        category VARCHAR(50), -- 分类: 运算/阅读/听力
        grade_level INTEGER, -- 适合年级: 1-6

        -- 节点类型
        node_type VARCHAR(30) DEFAULT 'skill', -- skill / milestone / achievement

        -- 层级关系
        parent_nodes JSONB DEFAULT '[]', -- 前置节点ID数组
        child_nodes JSONB DEFAULT '[]', -- 后续节点ID数组
        depth_level INTEGER DEFAULT 0, -- 深度层级

        -- 学习要求
        min_practice_count INTEGER DEFAULT 5, -- 最少练习次数
        min_accuracy DECIMAL(5,2) DEFAULT 80.0, -- 最低正确率要求
        min_time_spent INTEGER DEFAULT 0, -- 最少学习时长(分钟)

        -- 奖励
        unlock_points INTEGER DEFAULT 10, -- 解锁获得积分
        unlock_badge VARCHAR(50), -- 解锁徽章

        -- 可视化
        icon VARCHAR(50) DEFAULT '⭐',
        color VARCHAR(20) DEFAULT '#3498db',
        position_x INTEGER, -- X坐标(用于可视化布局)
        position_y INTEGER, -- Y坐标

        -- 状态
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_skill_nodes_subject ON skill_tree_nodes(subject);
      CREATE INDEX IF NOT EXISTS idx_skill_nodes_type ON skill_tree_nodes(node_type);
      CREATE INDEX IF NOT EXISTS idx_skill_nodes_grade ON skill_tree_nodes(grade_level);
    `);

    // 2. 创建用户技能树进度表
    await query(`
      CREATE TABLE IF NOT EXISTS user_skill_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        node_id UUID NOT NULL REFERENCES skill_tree_nodes(id) ON DELETE CASCADE,

        -- 解锁状态
        is_unlocked BOOLEAN DEFAULT FALSE, -- 是否已解锁
        is_completed BOOLEAN DEFAULT FALSE, -- 是否已完成
        unlocked_at TIMESTAMP, -- 解锁时间
        completed_at TIMESTAMP, -- 完成时间

        -- 学习进度
        practice_count INTEGER DEFAULT 0, -- 已练习次数
        success_count INTEGER DEFAULT 0, -- 成功次数
        current_accuracy DECIMAL(5,2) DEFAULT 0, -- 当前正确率
        total_time_spent INTEGER DEFAULT 0, -- 总学习时长(分钟)

        -- 完成度 (0-100)
        completion_percentage INTEGER DEFAULT 0,

        -- 学习记录
        last_practiced_at TIMESTAMP,
        practice_history JSONB DEFAULT '[]', -- 最近练习记录

        -- 星级评价 (1-5星)
        star_rating INTEGER,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id, node_id),
        CONSTRAINT valid_completion CHECK (completion_percentage BETWEEN 0 AND 100),
        CONSTRAINT valid_stars CHECK (star_rating IS NULL OR star_rating BETWEEN 1 AND 5)
      );

      CREATE INDEX IF NOT EXISTS idx_user_skill_progress_user ON user_skill_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_skill_progress_node ON user_skill_progress(node_id);
      CREATE INDEX IF NOT EXISTS idx_user_skill_progress_unlocked ON user_skill_progress(is_unlocked);
    `);

    // 3. 创建学习路径表(推荐学习顺序)
    await query(`
      CREATE TABLE IF NOT EXISTS learning_paths (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- 路径基本信息
        path_name VARCHAR(100) NOT NULL,
        description TEXT,
        subject VARCHAR(50) NOT NULL,

        -- 适用范围
        target_grade_min INTEGER DEFAULT 1,
        target_grade_max INTEGER DEFAULT 6,
        difficulty_level INTEGER DEFAULT 3, -- 1-5

        -- 路径节点
        node_sequence JSONB NOT NULL, -- 节点顺序数组 [{node_id, order, optional}]

        -- 预计完成
        estimated_days INTEGER,
        estimated_hours INTEGER,

        -- 标签
        tags JSONB DEFAULT '[]', -- ['入门', '强化', '进阶']

        -- 状态
        is_recommended BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT valid_difficulty CHECK (difficulty_level BETWEEN 1 AND 5),
        CONSTRAINT valid_grade_range CHECK (target_grade_min <= target_grade_max)
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_learning_paths_subject ON learning_paths(subject);
    `);

    // 只在表有这些列时创建索引
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'learning_paths'
          AND column_name = 'target_grade_min'
        ) THEN
          CREATE INDEX IF NOT EXISTS idx_learning_paths_grade ON learning_paths(target_grade_min, target_grade_max);
        END IF;
      END $$;
    `);

    // 4. 创建用户学习路径进度表
    await query(`
      CREATE TABLE IF NOT EXISTS user_path_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,

        -- 进度状态
        status VARCHAR(20) DEFAULT 'not_started', -- not_started / in_progress / completed / paused
        current_node_index INTEGER DEFAULT 0, -- 当前进行到第几个节点
        completion_percentage INTEGER DEFAULT 0,

        -- 时间记录
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        last_studied_at TIMESTAMP,

        -- 学习统计
        total_time_spent INTEGER DEFAULT 0, -- 总学习时长(分钟)
        nodes_completed INTEGER DEFAULT 0, -- 已完成节点数

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id, path_id),
        CONSTRAINT valid_percentage CHECK (completion_percentage BETWEEN 0 AND 100)
      );

      CREATE INDEX IF NOT EXISTS idx_user_path_progress_user ON user_path_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_path_progress_path ON user_path_progress(path_id);
      CREATE INDEX IF NOT EXISTS idx_user_path_progress_status ON user_path_progress(status);
    `);

    console.log('✅ 技能树系统表创建完成');
  },

  async down(): Promise<void> {
    await query('DROP TABLE IF EXISTS user_path_progress CASCADE');
    await query('DROP TABLE IF EXISTS learning_paths CASCADE');
    await query('DROP TABLE IF EXISTS user_skill_progress CASCADE');
    await query('DROP TABLE IF EXISTS skill_tree_nodes CASCADE');

    console.log('✅ 技能树系统表删除完成');
  }
};
