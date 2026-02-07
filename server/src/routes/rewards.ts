// 成就和每日任务路由
import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import { achievementService } from '../services/achievementService';
import { dailyTaskService } from '../services/dailyTaskService';

const router = express.Router();

// ===== 成就系统 =====

// 1. 获取所有成就
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    const achievements = await achievementService.getAchievements(category as string);

    res.json({ success: true, data: achievements });
  } catch (error: any) {
    console.error('获取成就失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. 获取用户成就进度
router.get('/achievements/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { category } = req.query;

    const achievements = await achievementService.getUserAchievements(String(userId), category as string);

    res.json({ success: true, data: achievements });
  } catch (error: any) {
    console.error('获取用户成就失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. 获取成就统计
router.get('/achievements/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const stats = await achievementService.getUserAchievementStats(String(userId));

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('获取成就统计失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== 每日任务系统 =====

// 4. 获取今日任务
router.get('/daily-tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const tasks = await dailyTaskService.getUserDailyTasks(String(userId));

    res.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('获取每日任务失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. 更新任务进度
router.post('/daily-tasks/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { taskId, progress } = req.body;

    const result = await dailyTaskService.updateTaskProgress(String(userId), taskId, progress);

    res.json({
      success: true,
      data: result,
      message: result.completed ? '任务完成！获得奖励' : '进度已更新'
    });
  } catch (error: any) {
    console.error('更新任务进度失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 6. 获取任务统计
router.get('/daily-tasks/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const stats = await dailyTaskService.getUserTaskStats(String(userId));

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('获取任务统计失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
