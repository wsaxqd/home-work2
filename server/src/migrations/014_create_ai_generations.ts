import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_014_create_ai_generations: Migration = {
  id: '014',
  name: '014_create_ai_generations',

  up: async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS ai_generations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        generation_type VARCHAR(50) NOT NULL,
        input_data JSONB NOT NULL DEFAULT '{}',
        output_data TEXT,
        likes INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_generations_generation_type ON ai_generations(generation_type)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at DESC)
    `);

    console.log('✓ ai_generations table created');
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS ai_generations CASCADE');
    console.log('✓ ai_generations table dropped');
  }
};
