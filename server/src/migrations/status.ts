#!/usr/bin/env node

/**
 * 数据库迁移管理工具
 * 用于查看、执行和回滚数据库迁移
 */

import { createMigrationsTable, getExecutedMigrations } from './migrationRunner';
import { query } from '../config/database';

// 所有迁移文件列表（按顺序）
const ALL_MIGRATIONS = [
  '001_create_users',
  '002_create_works',
  '003_create_comments',
  '004_create_likes',
  '005_create_follows',
  '006_create_diaries',
  '007_create_games',
  '008_create_achievements',
  '009_create_wishes',
  '010_create_notifications',
  '011_create_assessments',
  '012_create_learning_progress',
  '013_create_ai_conversations',
  '014_create_ai_generations',
  '015_update_users_table',
  '016_create_game_questions',
  '017_create_advanced_features',
  '018_add_more_game_questions',
  '019_create_moderation_system',
  '020_add_last_login',
  '021_add_email_to_users',
  '022_create_encyclopedia',
  '023_create_parent_tables',
  '024_create_email_verify_codes',
  '025_create_reading_progress',
  '026_create_story_play_records',
  '027_create_conversation_history',
  '028_create_community_topics',
  '029_create_homework_helper',
  '030_create_pk_system',
  '031_create_adaptive_learning',
  '032_insert_knowledge_points',
  '033_create_questions_table',
  '034_insert_sample_questions',
  '035_create_points_system',
  '036_insert_points_data',
  '037_create_learning_analytics',
  '038_enhance_notification_system',
  '039_create_learning_plan',
  '040_create_skill_tree',
  '041_create_sms_verify_codes',
  '042_create_feedback',
  '043_create_shop_system',
  '044_create_bookmarks_notes',
  '045_enhance_achievements',
  '046_create_game_records',
];

async function showStatus() {
  console.log('📊 数据库迁移状态\n');
  console.log('='.repeat(80));

  try {
    await createMigrationsTable();
    const executed = await getExecutedMigrations();
    const executedSet = new Set(executed);

    console.log(`\n✅ 已执行: ${executed.length}/${ALL_MIGRATIONS.length} 个迁移\n`);

    // 显示所有迁移状态
    ALL_MIGRATIONS.forEach((migration, index) => {
      const status = executedSet.has(migration) ? '✅' : '⏳';
      const number = String(index + 1).padStart(3, '0');
      console.log(`${status} [${number}] ${migration}`);
    });

    // 显示待执行的迁移
    const pending = ALL_MIGRATIONS.filter(m => !executedSet.has(m));
    if (pending.length > 0) {
      console.log(`\n⏳ 待执行的迁移 (${pending.length}):`);
      pending.forEach(m => console.log(`   - ${m}`));
    } else {
      console.log('\n🎉 所有迁移已执行完毕！');
    }

    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('❌ 获取迁移状态失败:', error);
    process.exit(1);
  }
}

async function listTables() {
  console.log('📋 数据库表列表\n');
  console.log('='.repeat(80));

  try {
    const result = await query(`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log(`\n共 ${result.rows.length} 个表:\n`);
    result.rows.forEach((row: any) => {
      console.log(`  📄 ${row.tablename.padEnd(40)} ${row.size}`);
    });

    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('❌ 获取表列表失败:', error);
    process.exit(1);
  }
}

async function checkMigrationHistory() {
  console.log('📜 迁移执行历史\n');
  console.log('='.repeat(80));

  try {
    const result = await query(`
      SELECT
        id,
        name,
        executed_at
      FROM migrations
      ORDER BY id DESC
      LIMIT 20;
    `);

    if (result.rows.length === 0) {
      console.log('\n暂无迁移记录');
    } else {
      console.log(`\n最近 ${result.rows.length} 次迁移:\n`);
      result.rows.forEach((row: any) => {
        const date = new Date(row.executed_at).toLocaleString('zh-CN');
        console.log(`  [${String(row.id).padStart(3, '0')}] ${row.name.padEnd(40)} ${date}`);
      });
    }

    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('❌ 获取迁移历史失败:', error);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'status':
    case undefined:
      await showStatus();
      break;
    case 'tables':
      await listTables();
      break;
    case 'history':
      await checkMigrationHistory();
      break;
    case 'help':
      console.log(`
数据库迁移管理工具

用法:
  npm run migrate:status    查看迁移状态（默认）
  npm run migrate:tables    查看数据库表列表
  npm run migrate:history   查看迁移执行历史
  npm run migrate           执行待执行的迁移
  npm run migrate:rollback  回滚最后一次迁移

示例:
  npm run migrate:status
  npm run migrate
      `);
      break;
    default:
      console.error(`❌ 未知命令: ${command}`);
      console.log('运行 "npm run migrate:status help" 查看帮助');
      process.exit(1);
  }

  process.exit(0);
}

main();
