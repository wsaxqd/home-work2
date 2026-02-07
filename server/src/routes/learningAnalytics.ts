// 学习数据分析路由
import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import { learningAnalyticsService } from '../services/learningAnalyticsService';

const router = express.Router();

// 0. 获取学习仪表盘(综合数据)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const data = await learningAnalyticsService.getDashboardData(String(userId));

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('获取学习仪表盘失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 1. 获取学习概览(最近7天)
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const days = Number(req.query.days) || 7;

    const data = await learningAnalyticsService.getUserLearningOverview(String(userId), days);

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('获取学习概览失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. 获取今日统计
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const data = await learningAnalyticsService.getTodayStatistics(String(userId));

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('获取今日统计失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. 记录学习行为
router.post('/log', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const behaviorData = req.body;

    await learningAnalyticsService.logBehavior(String(userId), behaviorData);

    // 如果有时长,同时更新统计
    if (behaviorData.duration) {
      await learningAnalyticsService.updateLearningTime(
        String(userId),
        behaviorData.behavior_type,
        behaviorData.duration
      );
    }

    res.json({ success: true, message: '行为记录成功' });
  } catch (error: any) {
    console.error('记录学习行为失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. 获取学习报告
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '缺少开始日期或结束日期'
      });
    }

    const report = await learningAnalyticsService.getLearningReport(
      String(userId),
      startDate as string,
      endDate as string
    );

    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('获取学习报告失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. 获取学习排行榜
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const period = (req.query.period as 'week' | 'month') || 'week';
    const limit = Number(req.query.limit) || 10;

    const data = await learningAnalyticsService.getLeaderboard(period, limit);

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
