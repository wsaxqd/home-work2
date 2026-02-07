import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 创建游戏记录表
  await knex.schema.createTable('game_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('game_type', 50).notNullable(); // 'math' | 'idiom' | 'english' | 'science' | 'fruit' | 'tank' | etc.
    table.string('difficulty', 20).notNullable(); // 'easy' | 'medium' | 'hard'
    table.integer('score').notNullable().defaultTo(0);
    table.integer('time_spent').notNullable().defaultTo(0); // 游戏时长(秒)
    table.integer('best_streak').notNullable().defaultTo(0); // 最高连击
    table.decimal('accuracy', 5, 2).defaultTo(0); // 准确率(百分比)
    table.jsonb('metadata').defaultTo('{}'); // 额外数据(如答对题数、总题数等)
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // 索引
    table.index(['user_id', 'game_type']);
    table.index(['game_type', 'score']);
    table.index('created_at');
  });

  // 创建游戏统计表
  await knex.schema.createTable('game_statistics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('game_type', 50).notNullable();
    table.integer('total_plays').notNullable().defaultTo(0); // 总游戏次数
    table.bigInteger('total_score').notNullable().defaultTo(0); // 总得分
    table.integer('highest_score').notNullable().defaultTo(0); // 最高分
    table.decimal('average_score', 10, 2).defaultTo(0); // 平均分
    table.bigInteger('total_time').notNullable().defaultTo(0); // 总游戏时长(秒)
    table.integer('best_streak').notNullable().defaultTo(0); // 最高连击
    table.decimal('average_accuracy', 5, 2).defaultTo(0); // 平均准确率
    table.timestamp('last_played_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // 唯一约束
    table.unique(['user_id', 'game_type']);

    // 索引
    table.index(['game_type', 'highest_score']);
    table.index('last_played_at');
  });

  // 创建全局排行榜表
  await knex.schema.createTable('global_leaderboard', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('game_type', 50).notNullable();
    table.string('difficulty', 20).notNullable();
    table.integer('score').notNullable();
    table.integer('rank').notNullable(); // 排名
    table.timestamp('achieved_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // 唯一约束
    table.unique(['user_id', 'game_type', 'difficulty']);

    // 索引
    table.index(['game_type', 'difficulty', 'score']);
    table.index(['game_type', 'difficulty', 'rank']);
  });

  console.log('✅ 游戏记录相关表创建成功');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('global_leaderboard');
  await knex.schema.dropTableIfExists('game_statistics');
  await knex.schema.dropTableIfExists('game_records');

  console.log('✅ 游戏记录相关表删除成功');
}
