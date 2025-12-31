import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_019_create_moderation_system: Migration = {
  id: '019',
  name: '019_create_moderation_system',

  up: async () => {
    // 创建审核日志表
    await query(`
      CREATE TABLE IF NOT EXISTS moderation_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        moderation_result JSONB NOT NULL,
        action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'flagged', 'blocked')),
        reviewed BOOLEAN DEFAULT false,
        reviewer_id UUID REFERENCES users(id),
        review_decision VARCHAR(20),
        review_note TEXT,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await query(`
      CREATE INDEX idx_moderation_logs_user ON moderation_logs(user_id);
      CREATE INDEX idx_moderation_logs_created ON moderation_logs(created_at DESC);
      CREATE INDEX idx_moderation_logs_action ON moderation_logs(action);
      CREATE INDEX idx_moderation_logs_reviewed ON moderation_logs(reviewed) WHERE reviewed = false;
    `);

    // 创建内容举报表
    await query(`
      CREATE TABLE IF NOT EXISTS content_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_type VARCHAR(50) NOT NULL,
        content_id UUID NOT NULL,
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
        handled_by UUID REFERENCES users(id),
        handled_at TIMESTAMP,
        resolution TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await query(`
      CREATE INDEX idx_content_reports_status ON content_reports(status);
      CREATE INDEX idx_content_reports_created ON content_reports(created_at DESC);
    `);

    console.log('✓ Created moderation system tables');
  },

  down: async () => {
    await query(`DROP TABLE IF EXISTS content_reports CASCADE`);
    await query(`DROP TABLE IF EXISTS moderation_logs CASCADE`);
    console.log('✓ Dropped moderation system tables');
  }
};
