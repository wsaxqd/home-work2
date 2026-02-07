import express from 'express';
import * as rankingController from '../controllers/rankingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 所有排位路由都需要认证
router.use(authMiddleware);

// 获取用户段位信息
router.get('/rank/:gameType', rankingController.getUserRank);

// 获取排行榜
router.get('/leaderboard/:gameType', rankingController.getLeaderboard);

// 获取段位分布统计
router.get('/distribution/:gameType', rankingController.getRankDistribution);

// 快速匹配
router.post('/quick-match', rankingController.quickMatch);

// 获取段位配置
router.get('/tiers', rankingController.getRankTiers);

export default router;
