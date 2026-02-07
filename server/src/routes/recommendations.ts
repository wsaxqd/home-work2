import { Router } from 'express';
import * as recommendationController from '../controllers/recommendationController';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

// 获取个性化推荐(混合算法)
router.get('/personalized', authMiddleware, recommendationController.getPersonalizedRecommendations);

// 获取用户画像
router.get('/profile', authMiddleware, recommendationController.getUserProfile);

// 协同过滤推荐
router.get('/collaborative', authMiddleware, recommendationController.getCollaborativeRecommendations);

// 基于内容的推荐
router.get('/content-based', authMiddleware, recommendationController.getContentBasedRecommendations);

// 学习路径推荐
router.get('/learning-path', authMiddleware, recommendationController.getLearningPathRecommendations);

// 首页推荐
router.get('/home', recommendationController.getHomeRecommendations);

export default router;
