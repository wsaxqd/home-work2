import { query } from '../config/database';

export const migration_038_enhance_notification_system = {
  id: '038',
  name: '038_enhance_notification_system',

  async up(): Promise<void> {
    // 1. 创建通知设置表
    await query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- 通知类型开关
        enable_like BOOLEAN DEFAULT TRUE,
        enable_comment BOOLEAN DEFAULT TRUE,
        enable_follow BOOLEAN DEFAULT TRUE,
        enable_achievement BOOLEAN DEFAULT TRUE,
        enable_system BOOLEAN DEFAULT TRUE,
        enable_task BOOLEAN DEFAULT TRUE,
        enable_learning BOOLEAN DEFAULT TRUE,

        -- 推送设置
        enable_push BOOLEAN DEFAULT TRUE,
        enable_email BOOLEAN DEFAULT FALSE,
        enable_sound BOOLEAN DEFAULT TRUE,

        -- 免打扰时间
        quiet_start_time TIME,
        quiet_end_time TIME,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);
    `);

    // 2. 扩展通知类型
    await query(`
      DO $$ BEGIN
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'learning';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'reminder';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'points';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. 为notifications表添加额外字段
    await query(`
      ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
      ADD COLUMN IF NOT EXISTS link VARCHAR(255),
      ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
    `);

    console.log('✅ 通知系统增强完成');
  },

  async down(): Promise<void> {
    await query('DROP TABLE IF EXISTS notification_settings CASCADE');

    await query(`
      ALTER TABLE notifications
      DROP COLUMN IF EXISTS icon,
      DROP COLUMN IF EXISTS link,
      DROP COLUMN IF EXISTS priority,
      DROP COLUMN IF EXISTS read_at;
    `);

    console.log('✅ 通知系统增强回滚完成');
  }
};
