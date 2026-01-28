import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_036_insert_points_data: Migration = {
  id: '036',
  name: '036_insert_points_data',

  up: async () => {
    // 1. 插入等级配置
    await query(`
      INSERT INTO level_configs (level, name, min_points, max_points, icon, color, privileges) VALUES
      (1, '启蒙新星', 0, 99, '⭐', '#95de64', '{"daily_tasks_limit": 5, "shop_discount": 0}'),
      (2, '好学少年', 100, 299, '🌟', '#69c0ff', '{"daily_tasks_limit": 6, "shop_discount": 0.05}'),
      (3, '智慧达人', 300, 599, '✨', '#85a5ff', '{"daily_tasks_limit": 7, "shop_discount": 0.1}'),
      (4, '学霸精英', 600, 999, '💎', '#b37feb', '{"daily_tasks_limit": 8, "shop_discount": 0.15}'),
      (5, '知识大师', 1000, 1999, '👑', '#ff85c0', '{"daily_tasks_limit": 10, "shop_discount": 0.2}'),
      (6, '学习之神', 2000, NULL, '🏆', '#ffd666', '{"daily_tasks_limit": 12, "shop_discount": 0.25}')
      ON CONFLICT (level) DO NOTHING
    `);

    // 2. 插入商城商品
    await query(`
      INSERT INTO shop_items (name, description, icon, category, price, original_price, type, effect, sort_order, is_hot, is_new) VALUES
      -- 虚拟道具
      ('学习加速卡', '使用后24小时内学习积分翻倍', '⚡', '道具', 50, 80, 'virtual', '{"type": "boost", "duration": 86400, "multiplier": 2}', 1, true, true),
      ('经验翻倍卡', '使用后获得的经验值翻倍，持续12小时', '📈', '道具', 80, 100, 'virtual', '{"type": "exp_boost", "duration": 43200, "multiplier": 2}', 2, true, false),
      ('幸运星', '使用后抽奖必中奖，仅限一次', '🌠', '道具', 100, NULL, 'virtual', '{"type": "lucky", "times": 1}', 3, false, false),
      ('复活卡', '游戏或PK失败时可原地复活', '💖', '道具', 30, NULL, 'virtual', '{"type": "revive", "times": 1}', 4, false, false),
      ('时间胶囊', '可以保存一次学习进度，随时恢复', '⏰', '道具', 60, NULL, 'virtual', '{"type": "save_point", "times": 1}', 5, false, true),

      -- 奖励类
      ('随机绘本一本', '随机获得一本精美绘本', '📚', '奖励', 150, NULL, 'reward', '{"type": "random_book", "category": "picture"}', 10, true, false),
      ('神秘礼包', '内含随机道具和积分', '🎁', '奖励', 200, 250, 'reward', '{"type": "mystery_box", "items": ["random"]}', 11, true, true),
      ('成就礼包', '解锁5个隐藏成就', '🏅', '奖励', 300, NULL, 'reward', '{"type": "achievement_pack", "count": 5}', 12, false, false),
      ('超级大礼包', '内含大量积分和稀有道具', '💝', '奖励', 500, 800, 'reward', '{"type": "super_pack"}', 13, true, true),

      -- 特权类
      ('VIP体验卡(7天)', '享受VIP专属特权，持续7天', '👑', '特权', 200, 300, 'privilege', '{"type": "vip", "duration": 604800}', 20, true, false),
      ('去广告特权(30天)', '30天内无任何广告打扰', '🚫', '特权', 150, NULL, 'privilege', '{"type": "no_ads", "duration": 2592000}', 21, false, false),
      ('专属头像框', '获得独特的个人头像装饰框', '🖼️', '特权', 100, NULL, 'privilege', '{"type": "avatar_frame", "id": "exclusive"}', 22, false, true),
      ('昵称颜色', '设置彩色昵称', '🌈', '特权', 80, NULL, 'privilege', '{"type": "name_color", "color": "rainbow"}', 23, false, false),

      -- 装饰类
      ('可爱头像', '更换专属可爱头像', '🐰', '装饰', 50, NULL, 'decoration', '{"type": "avatar", "id": "cute"}', 30, false, false),
      ('炫酷头像', '更换专属炫酷头像', '😎', '装饰', 50, NULL, 'decoration', '{"type": "avatar", "id": "cool"}', 31, false, false),
      ('个人主页背景', '定制个人主页背景图', '🎨', '装饰', 120, NULL, 'decoration', '{"type": "profile_bg"}', 32, false, true),
      ('特效徽章', '显示在头像旁的炫酷徽章', '✨', '装饰', 100, NULL, 'decoration', '{"type": "badge", "id": "sparkle"}', 33, false, false)
      ON CONFLICT DO NOTHING
    `);

    // 3. 插入成就
    await query(`
      INSERT INTO achievements_new (name, description, icon, category, type, condition, reward_points, rarity, sort_order) VALUES
      -- 学习成就
      ('学习新手', '完成第一次学习任务', '📖', '学习', 'learning', '{"type": "learning_count", "target": 1}', 10, 'common', 1),
      ('好学少年', '累计学习10次', '📚', '学习', 'learning', '{"type": "learning_count", "target": 10}', 50, 'common', 2),
      ('学习达人', '累计学习50次', '🎓', '学习', 'learning', '{"type": "learning_count", "target": 50}', 100, 'rare', 3),
      ('学霸之路', '累计学习100次', '👨‍🎓', '学习', 'learning', '{"type": "learning_count", "target": 100}', 200, 'epic', 4),
      ('知识大师', '累计学习365次', '🏆', '学习', 'learning', '{"type": "learning_count", "target": 365}', 500, 'legendary', 5),

      -- 签到成就
      ('签到新人', '完成第一次签到', '✅', '签到', 'checkin', '{"type": "checkin_count", "target": 1}', 5, 'common', 10),
      ('坚持打卡', '连续签到7天', '📅', '签到', 'checkin', '{"type": "checkin_streak", "target": 7}', 50, 'rare', 11),
      ('月度勤勉', '连续签到30天', '🗓️', '签到', 'checkin', '{"type": "checkin_streak", "target": 30}', 150, 'epic', 12),
      ('全勤王者', '连续签到100天', '👑', '签到', 'checkin', '{"type": "checkin_streak", "target": 100}', 500, 'legendary', 13),

      -- 游戏成就
      ('游戏萌新', '完成第一个游戏', '🎮', '游戏', 'game', '{"type": "game_count", "target": 1}', 10, 'common', 20),
      ('游戏高手', '累计完成50个游戏', '🕹️', '游戏', 'game', '{"type": "game_count", "target": 50}', 100, 'rare', 21),
      ('PK王者', 'PK对战获胜10次', '⚔️', '游戏', 'pk', '{"type": "pk_win", "target": 10}', 150, 'epic', 22),

      -- 创作成就
      ('小小作家', '创作第一个故事', '✍️', '创作', 'create', '{"type": "story_count", "target": 1}', 20, 'common', 30),
      ('创作达人', '累计创作10个作品', '🎨', '创作', 'create', '{"type": "work_count", "target": 10}', 100, 'rare', 31),
      ('艺术大师', '累计创作50个作品', '🖌️', '创作', 'create', '{"type": "work_count", "target": 50}', 300, 'epic', 32),

      -- 阅读成就
      ('阅读启蒙', '阅读第一本绘本', '📕', '阅读', 'reading', '{"type": "book_count", "target": 1}', 10, 'common', 40),
      ('书香少年', '累计阅读20本绘本', '📚', '阅读', 'reading', '{"type": "book_count", "target": 20}', 100, 'rare', 41),
      ('阅读之星', '累计阅读50本绘本', '⭐', '阅读', 'reading', '{"type": "book_count", "target": 50}', 200, 'epic', 42),

      -- 社交成就
      ('社交新星', '发布第一条动态', '💬', '社交', 'social', '{"type": "post_count", "target": 1}', 10, 'common', 50),
      ('人气王', '获得100个点赞', '👍', '社交', 'social', '{"type": "like_count", "target": 100}', 150, 'rare', 51),
      ('评论达人', '发表50条评论', '💭', '社交', 'social', '{"type": "comment_count", "target": 50}', 100, 'rare', 52),

      -- 积分成就
      ('小富翁', '累计获得1000积分', '💰', '积分', 'points', '{"type": "total_points", "target": 1000}', 100, 'rare', 60),
      ('大富翁', '累计获得5000积分', '💎', '积分', 'points', '{"type": "total_points", "target": 5000}', 300, 'epic', 61),
      ('财富传奇', '累计获得10000积分', '👑', '积分', 'points', '{"type": "total_points", "target": 10000}', 500, 'legendary', 62)
      ON CONFLICT DO NOTHING
    `);

    // 4. 插入每日任务
    await query(`
      INSERT INTO daily_tasks (name, description, icon, category, type, condition, reward_points, sort_order) VALUES
      -- 学习类任务
      ('每日签到', '完成每日签到', '✅', '基础', 'checkin', '{"type": "checkin", "target": 1}', 10, 1),
      ('完成一次学习', '在学习地图完成一个关卡', '📚', '学习', 'learning', '{"type": "learning", "target": 1}', 20, 2),
      ('完成三次学习', '在学习地图完成三个关卡', '📖', '学习', 'learning', '{"type": "learning", "target": 3}', 50, 3),
      ('学习30分钟', '累计学习时长达到30分钟', '⏰', '学习', 'study_time', '{"type": "study_time", "target": 1800}', 30, 4),

      -- AI互动类
      ('AI对话', '与AI助手对话5次', '🤖', 'AI', 'ai_chat', '{"type": "ai_chat", "target": 5}', 15, 10),
      ('作业辅导', '使用作业助手功能1次', '📝', 'AI', 'homework', '{"type": "homework", "target": 1}', 20, 11),
      ('AI百科', '在AI百科学习3个问题', '💡', 'AI', 'encyclopedia', '{"type": "encyclopedia", "target": 3}', 15, 12),

      -- 阅读类
      ('阅读绘本', '阅读一本绘本', '📕', '阅读', 'reading', '{"type": "reading", "target": 1}', 15, 20),
      ('阅读30分钟', '累计阅读时长达到30分钟', '📚', '阅读', 'reading_time', '{"type": "reading_time", "target": 1800}', 25, 21),

      -- 游戏类
      ('完成一个游戏', '完成任意一个益智游戏', '🎮', '游戏', 'game', '{"type": "game", "target": 1}', 15, 30),
      ('PK对战', '参与一次PK对战', '⚔️', '游戏', 'pk', '{"type": "pk", "target": 1}', 20, 31),

      -- 创作类
      ('创作作品', '创作一个故事、诗歌或绘画', '🎨', '创作', 'create', '{"type": "create", "target": 1}', 25, 40),

      -- 社交类
      ('发布动态', '发布一条动态或分享作品', '💬', '社交', 'post', '{"type": "post", "target": 1}', 15, 50),
      ('互动交流', '评论或点赞他人作品5次', '👍', '社交', 'interact', '{"type": "interact", "target": 5}', 20, 51)
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ 积分系统初始数据插入成功');
  },

  down: async () => {
    await query('DELETE FROM daily_tasks');
    await query('DELETE FROM achievements_new');
    await query('DELETE FROM shop_items');
    await query('DELETE FROM level_configs');
    console.log('❌ 积分系统初始数据已删除');
  }
};
