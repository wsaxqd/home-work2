import express from 'express';
import * as achievementController from '../controllers/achievementController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 所有成就路由都需要认证
router.use(authMiddleware);

// 获取所有成就
router.get('/', achievementController.getAllAchievements);

// 获取用户成就
router.get('/user', achievementController.getUserAchievements);

// 获取成就统计
router.get('/stats', achievementController.getAchievementStats);

// 获取成就进度
router.get('/progress', achievementController.getAchievementProgress);

export default router;
