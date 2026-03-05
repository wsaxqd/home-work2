import { Router } from 'express';
import { parentalControlService } from '../services/parentalControlService';
import { authenticateToken, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';

const router = Router();

// 获取家长控制设置
router.get('/settings', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const settings = await parentalControlService.getSettings(userId);
  sendSuccess(res, settings);
}));

// 更新家长控制设置
router.put('/settings', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const settings = req.body;
  const updated = await parentalControlService.updateSettings(userId, settings);
  sendSuccess(res, updated, '设置更新成功');
}));

// 记录使用时长
router.post('/log-usage', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { featureType, duration, activityData } = req.body;

  if (!featureType || !duration) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  await parentalControlService.logUsage(userId, featureType, duration, activityData);
  sendSuccess(res, null, '使用记录已保存');
}));

// 获取今日使用时长
router.get('/today-usage', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const totalDuration = await parentalControlService.getTodayUsage(userId);
  sendSuccess(res, { totalDuration });
}));

// 获取使用统计
router.get('/usage-stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const stats = await parentalControlService.getUsageStats(userId, startDate, endDate);
  sendSuccess(res, stats);
}));

// 检查时长限制
router.get('/check-limit', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const result = await parentalControlService.checkTimeLimit(userId);
  sendSuccess(res, result);
}));

export default router;
