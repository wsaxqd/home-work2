import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 添加成就进度追踪表
    await client.query(`
      CREATE TABLE IF NOT EXISTS achievement_progress (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_code VARCHAR(50) NOT NULL,
        current_value INTEGER DEFAULT 0,
        target_value INTEGER NOT NULL,
        metadata JSONB,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_code)
      );
    `);

    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_id
      ON achievement_progress(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_achievement_progress_code
      ON achievement_progress(achievement_code);
    `);

    // 插入更多成就数据
    await client.query(`
      INSERT INTO achievements (code, name, description, category, icon, points, requirement) VALUES
      -- 学习类成就
      ('study_beginner', '学习新手', '完成第一次学习', 'learning', '📚', 10, '{"type": "study_count", "value": 1}'),
      ('study_enthusiast', '学习达人', '累计学习10次', 'learning', '📖', 50, '{"type": "study_count", "value": 10}'),
      ('study_master', '学习大师', '累计学习100次', 'learning', '🎓', 200, '{"type": "study_count", "value": 100}'),
      ('study_streak_7', '坚持学习7天', '连续学习7天', 'learning', '🔥', 100, '{"type": "study_streak", "value": 7}'),
      ('study_streak_30', '坚持学习30天', '连续学习30天', 'learning', '⭐', 500, '{"type": "study_streak", "value": 30}'),

      -- 创作类成就
      ('create_first', '初次创作', '完成第一个作品', 'creation', '🎨', 20, '{"type": "work_count", "value": 1}'),
      ('create_10', '创作小能手', '创作10个作品', 'creation', '✨', 100, '{"type": "work_count", "value": 10}'),
      ('create_50', '创作大师', '创作50个作品', 'creation', '🌟', 500, '{"type": "work_count", "value": 50}'),
      ('like_received_100', '人气作品', '作品获得100个赞', 'creation', '❤️', 200, '{"type": "total_likes", "value": 100}'),

      -- 游戏类成就
      ('game_first_win', '首次胜利', '赢得第一场游戏', 'game', '🎮', 10, '{"type": "game_win", "value": 1}'),
      ('game_win_10', '游戏高手', '赢得10场游戏', 'game', '🏆', 50, '{"type": "game_win", "value": 10}'),
      ('game_win_50', '游戏大师', '赢得50场游戏', 'game', '👑', 300, '{"type": "game_win", "value": 50}'),
      ('game_perfect', '完美表现', '在一场游戏中获得满分', 'game', '💯', 100, '{"type": "perfect_score", "value": 1}'),

      -- 社交类成就
      ('social_first_friend', '第一个朋友', '关注第一个用户', 'social', '👥', 10, '{"type": "follow_count", "value": 1}'),
      ('social_popular', '社交达人', '获得10个粉丝', 'social', '🌈', 100, '{"type": "follower_count", "value": 10}'),
      ('social_influencer', '社交明星', '获得100个粉丝', 'social', '⭐', 500, '{"type": "follower_count", "value": 100}'),
      ('social_comment_10', '热心评论', '发表10条评论', 'social', '💬', 50, '{"type": "comment_count", "value": 10}'),

      -- 积分类成就
      ('coins_1000', '积分新手', '累计获得1000积分', 'points', '💰', 50, '{"type": "total_coins", "value": 1000}'),
      ('coins_10000', '积分富翁', '累计获得10000积分', 'points', '💎', 200, '{"type": "total_coins", "value": 10000}'),
      ('coins_100000', '积分大亨', '累计获得100000积分', 'points', '👑', 1000, '{"type": "total_coins", "value": 100000}'),

      -- 特殊成就
      ('early_bird', '早起的鸟儿', '在早上6点前登录', 'special', '🌅', 30, '{"type": "early_login", "value": 1}'),
      ('night_owl', '夜猫子', '在晚上11点后登录', 'special', '🌙', 30, '{"type": "late_login", "value": 1}'),
      ('birthday_login', '生日快乐', '在生日当天登录', 'special', '🎂', 100, '{"type": "birthday_login", "value": 1}'),
      ('perfect_week', '完美一周', '一周内每天都登录', 'special', '📅', 150, '{"type": "login_streak", "value": 7}')
      ON CONFLICT (code) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ 成就系统增强成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 成就系统增强失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function down(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS achievement_progress CASCADE;');
    await client.query(`
      DELETE FROM achievements WHERE code IN (
        'study_beginner', 'study_enthusiast', 'study_master', 'study_streak_7', 'study_streak_30',
        'create_first', 'create_10', 'create_50', 'like_received_100',
        'game_first_win', 'game_win_10', 'game_win_50', 'game_perfect',
        'social_first_friend', 'social_popular', 'social_influencer', 'social_comment_10',
        'coins_1000', 'coins_10000', 'coins_100000',
        'early_bird', 'night_owl', 'birthday_login', 'perfect_week'
      );
    `);

    await client.query('COMMIT');
    console.log('✅ 成就系统增强回滚成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 成就系统增强回滚失败:', error);
    throw error;
  } finally {
    client.release();
  }
}
