import { Router } from 'express';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { encyclopediaService } from '../services/encyclopediaService';

const router = Router();

/**
 * 获取所有分类
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await encyclopediaService.getCategories();
  sendSuccess(res, categories);
}));

/**
 * 获取问题列表
 */
router.get('/questions', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId;
  const {
    category,
    difficulty,
    search,
    limit = '50',
    offset = '0'
  } = req.query;

  const result = await encyclopediaService.getQuestions(
    userId,
    category as string,
    difficulty as string,
    search as string,
    parseInt(limit as string),
    parseInt(offset as string)
  );

  sendSuccess(res, result);
}));

/**
 * 获取问题详情
 */
router.get('/questions/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId;
  const questionId = parseInt(req.params.id);

  const question = await encyclopediaService.getQuestionById(questionId, userId);
  sendSuccess(res, question);
}));

/**
 * 收藏/取消收藏问题
 */
router.post('/questions/:id/favorite', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const questionId = parseInt(req.params.id);

  const result = await encyclopediaService.toggleFavorite(userId, questionId);
  sendSuccess(res, result);
}));

/**
 * 获取用户收藏的问题
 */
router.get('/favorites', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const favorites = await encyclopediaService.getUserFavorites(userId);
  sendSuccess(res, favorites);
}));

/**
 * 智能搜索
 */
router.post('/search', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { question } = req.body;

  const result = await encyclopediaService.intelligentSearch(userId, question);
  sendSuccess(res, result);
}));

/**
 * 初始化数据（仅开发环境）
 */
router.post('/init', asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: '生产环境不允许初始化' });
  }

  const result = await encyclopediaService.initializeData();
  sendSuccess(res, result);
}));

export default router;
