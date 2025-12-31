import { Router } from 'express';
import { recommendationService } from '../services/recommendationService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';

const router = Router();

// 获取个性化推荐
router.get('/personalized', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const recommendations = await recommendationService.getPersonalizedRecommendations(userId);
  sendSuccess(res, recommendations);
}));

// 获取学习路径推荐
router.get('/learning-path', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const learningPath = await recommendationService.recommendLearningPath(userId);
  sendSuccess(res, learningPath);
}));

export default router;
