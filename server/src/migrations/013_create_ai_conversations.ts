import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_013_create_ai_conversations: Migration = {
  id: '013',
  name: '013_create_ai_conversations',

  up: async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_type VARCHAR(50) NOT NULL,
        messages JSONB NOT NULL DEFAULT '[]',
        conversation_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, task_type)
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_conversations_task_type ON ai_conversations(task_type)
    `);

    console.log('✓ ai_conversations table created');
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS ai_conversations CASCADE');
    console.log('✓ ai_conversations table dropped');
  }
};
