import { Router } from 'express';
import { gameService } from '../services/gameService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';

const router = Router();

// 保存游戏成绩
router.post('/score', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { gameType, score, level, accuracy, duration } = req.body;
  const result = await gameService.saveScore(userId, { gameType, score, level, accuracy, duration });
  sendSuccess(res, result, '成绩保存成功', 201);
}));

// 获取游戏进度
router.get('/progress', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const gameType = req.query.gameType as string;
  const progress = await gameService.getProgress(userId, gameType as any);
  sendSuccess(res, progress);
}));

// 获取排行榜
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const gameType = req.query.gameType as string;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!gameType) {
    return res.status(400).json({ success: false, message: '请指定游戏类型' });
  }

  const leaderboard = await gameService.getLeaderboard(gameType as any, limit);
  sendSuccess(res, leaderboard);
}));

// 获取用户排名
router.get('/rank', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const gameType = req.query.gameType as string;

  if (!gameType) {
    return res.status(400).json({ success: false, message: '请指定游戏类型' });
  }

  const rank = await gameService.getUserRank(userId, gameType as any);
  sendSuccess(res, { rank });
}));

// 获取游戏历史记录
router.get('/history', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const gameType = req.query.gameType as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const result = await gameService.getHistory(userId, gameType as any, page, pageSize);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

export default router;
