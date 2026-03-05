import { Router } from 'express';
import { authenticateToken, optionalAuth, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { query } from '../config/database';
import { workService } from '../services/workService';
import { aiService } from '../services/aiService';

const router = Router();

/**
 * 首页推荐内容
 * 包括：推荐作品、学习进度、AI助手问候等
 */
router.get('/home', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;

  // 1. 获取用户基本信息
  const userResult = await query(
    'SELECT id, nickname, avatar, age FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];

  // 2. 获取推荐作品（热门作品）
  const recommendedWorks = await workService.getTrending(6);

  // 3. 获取用户最近创作（继续上次）
  const recentWorksResult = await query(
    `SELECT id, type, title, cover_image, created_at, status
     FROM works
     WHERE user_id = $1 AND status = 'draft'
     ORDER BY updated_at DESC
     LIMIT 3`,
    [userId]
  );

  // 4. 获取学习进度
  const progressResult = await query(
    `SELECT
      (SELECT COUNT(*) FROM works WHERE user_id = $1) as total_works,
      (SELECT COUNT(*) FROM user_achievements WHERE user_id = $1) as achievements,
      (SELECT COALESCE(MAX(level_reached), 1) FROM game_progress WHERE user_id = $1) as game_level`,
    [userId]
  );
  const progress = progressResult.rows[0];

  // 5. AI助手问候语（可以根据时间和用户数据动态生成）
  const hour = new Date().getHours();
  let greeting = '早上好';
  if (hour >= 12 && hour < 18) greeting = '下午好';
  else if (hour >= 18) greeting = '晚上好';

  const aiGreeting = {
    message: `${greeting}，${user.nickname || '小朋友'}！今天想探索什么呢？`,
    suggestions: [
      '听个有趣的故事',
      '玩个识别游戏',
      '创作一幅画',
      '写写心情日记'
    ]
  };

  // 6. 今日任务/成就提示
  const tasksResult = await query(
    `SELECT
      CASE
        WHEN (SELECT COUNT(*) FROM works WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE) = 0
        THEN '今天还没有创作哦，来试试吧！'
        WHEN (SELECT COUNT(*) FROM diaries WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE) = 0
        THEN '记得写今天的心情日记~'
        ELSE '今天表现很棒！继续加油！'
      END as daily_tip`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        age: user.age
      },
      aiGreeting,
      recommendedWorks,
      recentWorks: recentWorksResult.rows,
      progress: {
        totalWorks: parseInt(progress.total_works),
        achievements: parseInt(progress.achievements),
        gameLevel: parseInt(progress.game_level)
      },
      dailyTip: tasksResult.rows[0].daily_tip,
      quickActions: [
        { icon: '🔍', label: 'AI探索岛', path: '/explore' },
        { icon: '🎨', label: '创造湾', path: '/create' },
        { icon: '💝', label: '心灵花园', path: '/mind-garden' },
        { icon: '🤝', label: '光明城', path: '/community' }
      ]
    }
  });
}));

/**
 * 获取探索页内容
 */
router.get('/explore', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId;

  // AI知识模块
  const knowledgeModules = [
    { id: 'ai-intro', title: 'AI是什么？', icon: '🤖', difficulty: 'easy', completed: false },
    { id: 'machine-learning', title: '机器学习入门', icon: '🧠', difficulty: 'medium', completed: false },
    { id: 'image-recognition', title: '图像识别原理', icon: '👁️', difficulty: 'medium', completed: false },
    { id: 'nlp', title: '语言理解', icon: '💬', difficulty: 'hard', completed: false }
  ];

  // 互动实验
  const experiments = [
    { id: 'image-game', title: 'AI图像识别游戏', icon: '🎮', type: 'game' },
    { id: 'emotion-game', title: '情绪识别挑战', icon: '😊', type: 'game' },
    { id: 'chat-ai', title: '和启启聊天', icon: '💬', type: 'chat' }
  ];

  // 如果用户已登录，获取学习进度
  if (userId) {
    const progressResult = await query(
      `SELECT module_id, progress, completed
       FROM learning_progress
       WHERE user_id = $1`,
      [userId]
    );

    const progressMap = new Map(
      progressResult.rows.map(row => [row.module_id, { progress: row.progress, completed: row.completed }])
    );

    knowledgeModules.forEach(module => {
      const progress = progressMap.get(module.id);
      if (progress) {
        module.completed = progress.completed;
      }
    });
  }

  res.json({
    success: true,
    data: {
      knowledgeModules,
      experiments,
      featuredContent: {
        title: '本周推荐：AI如何识别图片？',
        description: '通过有趣的小游戏，了解AI是如何"看懂"图片的！',
        thumbnail: '/images/featured/image-recognition.png',
        link: '/explore/image-recognition'
      }
    }
  });
}));

export default router;
