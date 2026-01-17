import { Router } from 'express';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { storiesService } from '../services/storiesService';

const router = Router();

// 模拟故事数据库（实际项目中应该从数据库读取）
// 这里我们直接引用前端的故事数据结构
interface Story {
  id: number;
  title: string;
  origin: '中国' | '外国';
  country?: string;
  category: string;
  ageGroup: string;
  summary: string;
  content: string;
  moral?: string;
  keywords: string[];
  length: 'short' | 'medium' | 'long';
  difficulty: 'easy' | 'medium' | 'hard';
}

// 获取所有故事列表
router.get('/', asyncHandler(async (req, res) => {
  const {
    origin,      // 来源：中国/外国
    category,    // 分类
    ageGroup,    // 年龄段
    length,      // 长度
    difficulty,  // 难度
    country,     // 国家
    keyword      // 关键词搜索
  } = req.query;

  // 这里返回筛选条件，前端使用本地数据过滤
  sendSuccess(res, {
    message: '请使用前端本地故事数据',
    filters: { origin, category, ageGroup, length, difficulty, country, keyword }
  });
}));

// 获取故事分类列表
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = [
    { value: '寓言故事', label: '寓言故事', icon: '📚' },
    { value: '神话传说', label: '神话传说', icon: '⚡' },
    { value: '童话故事', label: '童话故事', icon: '🧚' },
    { value: '历史故事', label: '历史故事', icon: '📜' },
    { value: '品德故事', label: '品德故事', icon: '❤️' },
    { value: '智慧故事', label: '智慧故事', icon: '💡' },
    { value: '励志故事', label: '励志故事', icon: '💪' },
  ];
  sendSuccess(res, categories);
}));

// 获取故事来源列表
router.get('/origins', asyncHandler(async (req, res) => {
  const origins = [
    { value: '中国', label: '中国故事', icon: '🇨🇳', count: 10 },
    { value: '外国', label: '外国故事', icon: '🌍', count: 5 },
  ];
  sendSuccess(res, origins);
}));

// 获取单个故事详情
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 前端应该使用本地数据
  sendSuccess(res, {
    message: '请使用前端本地故事数据',
    storyId: id
  });
}));

// 获取推荐故事
router.get('/recommend/list', asyncHandler(async (req, res) => {
  const { ageGroup, count = 5 } = req.query;

  sendSuccess(res, {
    message: '推荐基于年龄段的故事',
    ageGroup,
    count
  });
}));

// 获取热门故事
router.get('/hot/list', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const hotStories = await storiesService.getHotStories(parseInt(limit as string));
  sendSuccess(res, { items: hotStories, total: hotStories.length });
}));

// 搜索故事
router.get('/search/query', asyncHandler(async (req, res) => {
  const { q, origin, category } = req.query;

  sendSuccess(res, {
    message: '搜索故事',
    query: q,
    filters: { origin, category }
  });
}));

// 获取每日一句
router.get('/daily-quote', asyncHandler(async (req, res) => {
  // 这里应该从数据库或配置中获取
  const quotes = [
    { text: '你是独一无二的，世界因你而美好', author: '温暖电台' },
    { text: '每一天都是新的开始，加油！', author: '温暖电台' },
    { text: '相信自己，你比想象中更强大', author: '温暖电台' },
  ];
  const dailyQuote = quotes[new Date().getDate() % quotes.length];
  sendSuccess(res, { id: Date.now().toString(), ...dailyQuote, date: new Date().toISOString() });
}));

// 获取睡前故事
router.get('/bedtime', asyncHandler(async (req, res) => {
  // 这里应该从数据库获取
  sendSuccess(res, { items: [], total: 0, message: '请使用前端本地数据' });
}));

// 获取励志故事
router.get('/inspirational', asyncHandler(async (req, res) => {
  // 这里应该从数据库获取
  sendSuccess(res, { items: [], total: 0, message: '请使用前端本地数据' });
}));

// 记录播放
router.post('/play', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId;
  const { storyId, duration } = req.body;

  const record = await storiesService.recordPlay(userId, storyId, duration);
  sendSuccess(res, record, '播放记录已保存', 201);
}));

// 获取推荐故事
router.get('/recommended', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { limit = 10 } = req.query;

  const recommendedStories = await storiesService.getRecommendedStories(userId, parseInt(limit as string));
  sendSuccess(res, { items: recommendedStories, total: recommendedStories.length });
}));

// 获取播放历史
router.get('/history', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { limit = 50 } = req.query;

  const history = await storiesService.getPlayHistory(userId, parseInt(limit as string));
  sendSuccess(res, { items: history, total: history.length });
}));

export default router;
