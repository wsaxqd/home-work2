import { Router } from 'express';
import * as recommendationController from '../controllers/recommendationController';
import { authenticateToken, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

// 获取个性化推荐(混合算法)
router.get('/personalized', authenticateToken, recommendationController.getPersonalizedRecommendations);

// 获取用户画像
router.get('/profile', authenticateToken, recommendationController.getUserProfile);

// 协同过滤推荐
router.get('/collaborative', authenticateToken, recommendationController.getCollaborativeRecommendations);

// 基于内容的推荐
router.get('/content-based', authenticateToken, recommendationController.getContentBasedRecommendations);

// 学习路径推荐
router.get('/learning-path', authenticateToken, recommendationController.getLearningPathRecommendations);

// 首页推荐
router.get('/home', recommendationController.getHomeRecommendations);

export default router;
