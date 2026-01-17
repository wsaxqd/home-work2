import { query } from '../config/database';
import { Migration } from './migrationRunner';

export const migration_026_create_story_play_records: Migration = {
  id: '026',
  name: '026_create_story_play_records',

  up: async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS story_play_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        story_id VARCHAR(100) NOT NULL,
        duration INTEGER DEFAULT 0,
        played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX idx_story_play_records_user_id ON story_play_records(user_id);
    `);

    await query(`
      CREATE INDEX idx_story_play_records_story_id ON story_play_records(story_id);
    `);

    await query(`
      CREATE INDEX idx_story_play_records_played_at ON story_play_records(played_at DESC);
    `);
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS story_play_records CASCADE');
  }
};
