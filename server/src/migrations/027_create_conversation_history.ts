import { query } from '../config/database';
import { Migration } from './migrationRunner';

export const migration_027_create_conversation_history: Migration = {
  id: '027',
  name: '027_create_conversation_history',

  up: async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS conversation_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        companion_id VARCHAR(50),
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX idx_conversation_user_id ON conversation_history(user_id);
    `);

    await query(`
      CREATE INDEX idx_conversation_companion_id ON conversation_history(companion_id);
    `);

    await query(`
      CREATE INDEX idx_conversation_created_at ON conversation_history(created_at DESC);
    `);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS conversation_history CASCADE');
  }
};
