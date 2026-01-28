import { query } from '../config/database';

async function cleanup() {
  try {
    console.log('清理部分创建的表...');

    await query('DROP TABLE IF EXISTS user_path_progress CASCADE');
    console.log('✅ 删除 user_path_progress');

    await query('DROP TABLE IF EXISTS learning_paths CASCADE');
    console.log('✅ 删除 learning_paths');

    await query('DROP TABLE IF EXISTS user_skill_progress CASCADE');
    console.log('✅ 删除 user_skill_progress');

    await query('DROP TABLE IF EXISTS skill_tree_nodes CASCADE');
    console.log('✅ 删除 skill_tree_nodes');

    // 删除迁移记录
    await query(`DELETE FROM migrations WHERE name = '040_create_skill_tree'`);
    console.log('✅ 删除迁移记录');

    console.log('\n清理完成!现在可以重新运行迁移');
    process.exit(0);
  } catch (error) {
    console.error('清理失败:', error);
    process.exit(1);
  }
}

cleanup();
