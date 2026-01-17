import {
  createMigrationsTable,
  getExecutedMigrations,
  runMigration,
  Migration
} from './migrationRunner';

import { migration_001_create_users } from './001_create_users';
import { migration_002_create_works } from './002_create_works';
import { migration_003_create_comments } from './003_create_comments';
import { migration_004_create_likes } from './004_create_likes';
import { migration_005_create_follows } from './005_create_follows';
import { migration_006_create_diaries } from './006_create_diaries';
import { migration_007_create_games } from './007_create_games';
import { migration_008_create_achievements } from './008_create_achievements';
import { migration_009_create_wishes } from './009_create_wishes';
import { migration_010_create_notifications } from './010_create_notifications';
import { migration_011_create_assessments } from './011_create_assessments';
import { migration_012_create_learning_progress } from './012_create_learning_progress';
import { migration_013_create_ai_conversations } from './013_create_ai_conversations';
import { migration_014_create_ai_generations } from './014_create_ai_generations';
import { migration_015_update_users_table } from './015_update_users_table';
import { migration_016_create_game_questions } from './016_create_game_questions';
import { migration_017_create_advanced_features } from './017_create_advanced_features';
import { migration_018_add_more_game_questions } from './018_add_more_game_questions';
import { migration_019_create_moderation_system } from './019_create_moderation_system';
import { migration_020_add_last_login } from './020_add_last_login';
import { migration_021_add_email_to_users } from './021_add_email_to_users';
import { migration_022_create_encyclopedia } from './022_create_encyclopedia';
import { migration_023_create_parent_tables } from './023_create_parent_tables_export';
import { migration_024_create_email_verify_codes } from './024_create_email_verify_codes_export';
import { migration_025_create_reading_progress } from './025_create_reading_progress';
import { migration_026_create_story_play_records } from './026_create_story_play_records';
import { migration_027_create_conversation_history } from './027_create_conversation_history';

const migrations: Migration[] = [
  migration_001_create_users,
  migration_002_create_works,
  migration_003_create_comments,
  migration_004_create_likes,
  migration_005_create_follows,
  migration_006_create_diaries,
  migration_007_create_games,
  migration_008_create_achievements,
  migration_009_create_wishes,
  migration_010_create_notifications,
  migration_011_create_assessments,
  migration_012_create_learning_progress,
  migration_013_create_ai_conversations,
  migration_014_create_ai_generations,
  migration_015_update_users_table,
  migration_016_create_game_questions,
  migration_017_create_advanced_features,
  migration_018_add_more_game_questions,
  migration_019_create_moderation_system,
  migration_020_add_last_login,
  migration_021_add_email_to_users,
  migration_022_create_encyclopedia,
  migration_023_create_parent_tables,
  migration_024_create_email_verify_codes,
  migration_025_create_reading_progress,
  migration_026_create_story_play_records,
  migration_027_create_conversation_history,
];

async function run() {
  console.log('🚀 Starting migrations...\n');

  try {
    await createMigrationsTable();
    const executed = await getExecutedMigrations();

    console.log(`📋 Already executed: ${executed.length} migrations\n`);

    const pending = migrations.filter(m => !executed.includes(m.name));

    if (pending.length === 0) {
      console.log('✅ All migrations are up to date!\n');
      process.exit(0);
    }

    console.log(`📦 Pending migrations: ${pending.length}\n`);

    for (const migration of pending) {
      console.log(`⏳ Running: ${migration.name}`);
      await runMigration(migration);
    }

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

run();
