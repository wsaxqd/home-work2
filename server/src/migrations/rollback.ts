import {
  getExecutedMigrations,
  rollbackMigration,
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
];

async function rollback() {
  console.log('🔄 Starting rollback...\n');

  try {
    const executed = await getExecutedMigrations();

    if (executed.length === 0) {
      console.log('✅ No migrations to rollback!\n');
      process.exit(0);
    }

    // 获取最后执行的迁移
    const lastExecuted = executed[executed.length - 1];
    const migration = migrations.find(m => m.name === lastExecuted);

    if (!migration) {
      console.error(`❌ Migration ${lastExecuted} not found!`);
      process.exit(1);
    }

    console.log(`⏳ Rolling back: ${migration.name}`);
    await rollbackMigration(migration);

    console.log('\n✅ Rollback completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    process.exit(1);
  }
}

rollback();
