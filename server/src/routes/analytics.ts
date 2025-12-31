import { Router } from 'express';
import { analyticsService } from '../services/analyticsService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';

const router = Router();

// 获取仪表板总览
router.get('/dashboard/overview', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const overview = await analyticsService.getDashboardOverview();
  sendSuccess(res, overview);
}));

// 获取用户参与度分析
router.get('/engagement', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { days } = req.query;
  const engagement = await analyticsService.getUserEngagement(
    days ? parseInt(days as string) : undefined
  );
  sendSuccess(res, engagement);
}));

// 获取学习分析
router.get('/learning', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const learning = await analyticsService.getLearningAnalytics();
  sendSuccess(res, learning);
}));

// 获取内容分析
router.get('/content', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { limit } = req.query;
  const content = await analyticsService.getContentAnalytics(
    limit ? parseInt(limit as string) : undefined
  );
  sendSuccess(res, content);
}));

// 获取安全分析
router.get('/safety', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { days } = req.query;
  const safety = await analyticsService.getSafetyAnalytics(
    days ? parseInt(days as string) : undefined
  );
  sendSuccess(res, safety);
}));

// 获取用户个人分析
router.get('/user/:userId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.params;
  const userAnalytics = await analyticsService.getUserPersonalAnalytics(userId);
  sendSuccess(res, userAnalytics);
}));

// 获取当前用户的个人分析
router.get('/user/me/stats', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const userAnalytics = await analyticsService.getUserPersonalAnalytics(userId);
  sendSuccess(res, userAnalytics);
}));

// 生成并导出报告
router.get('/report/:type', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { type } = req.params;
  const { format } = req.query;

  if (!['overview', 'learning', 'content', 'safety'].includes(type)) {
    return res.status(400).json({ success: false, message: '无效的报告类型' });
  }

  const report = await analyticsService.generateReport(
    type as any,
    format as any
  );

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    res.send(report);
  } else {
    sendSuccess(res, report);
  }
}));

export default router;
