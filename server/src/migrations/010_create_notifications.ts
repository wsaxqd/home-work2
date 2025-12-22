import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_010_create_notifications: Migration = {
  id: '010',
  name: '010_create_notifications',

  up: async () => {
    await query(`
      DO $$ BEGIN
        CREATE TYPE notification_type AS ENUM ('like', 'comment', 'follow', 'achievement', 'system');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type notification_type NOT NULL,
        title VARCHAR(100),
        content TEXT,
        related_id UUID,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS notifications CASCADE');
    await query('DROP TYPE IF EXISTS notification_type');
  }
};
