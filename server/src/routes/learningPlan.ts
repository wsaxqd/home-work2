// 学习计划路由
import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import { learningPlanService } from '../services/learningPlanService';

const router = express.Router();

// 1. 创建学习计划
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const plan = await learningPlanService.createPlan(String(userId), req.body);

    res.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('创建学习计划失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. AI生成学习计划
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { subjects, daily_time, difficulty_level, start_date, duration_days } = req.body;

    if (!subjects || !daily_time || !start_date || !duration_days) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const plan = await learningPlanService.generateAIPlan(String(userId), {
      subjects,
      daily_time,
      difficulty_level: difficulty_level || 3,
      start_date,
      duration_days
    });

    res.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('AI生成计划失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. 获取我的计划列表
router.get('/my-plans', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const status = req.query.status as string | undefined;

    const plans = await learningPlanService.getUserPlans(String(userId), status);

    res.json({ success: true, data: plans });
  } catch (error: any) {
    console.error('获取计划列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. 获取计划详情
router.get('/plan/:planId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { planId } = req.params;

    const plan = await learningPlanService.getPlanDetail(planId, String(userId));

    res.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('获取计划详情失败:', error);
    res.status(404).json({ success: false, message: error.message });
  }
});

// 5. 获取计划任务
router.get('/plan/:planId/tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { planId } = req.params;
    const date = req.query.date as string | undefined;

    const tasks = await learningPlanService.getPlanTasks(planId, String(userId), date);

    res.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('获取计划任务失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. 添加任务到计划
router.post('/plan/:planId/task', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { planId } = req.params;

    const task = await learningPlanService.addPlanTask(planId, String(userId), req.body);

    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('添加任务失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. 获取今日任务
router.get('/today-tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    const tasks = await learningPlanService.getTodayTasks(String(userId));

    res.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('获取今日任务失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. 完成任务
router.post('/task/:taskId/complete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { taskId } = req.params;

    const task = await learningPlanService.completeTask(taskId, String(userId), req.body);

    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('完成任务失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. 获取能力评估
router.get('/ability-assessment', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const subject = req.query.subject as string | undefined;

    const assessment = await learningPlanService.getAbilityAssessment(String(userId), subject);

    res.json({ success: true, data: assessment });
  } catch (error: any) {
    console.error('获取能力评估失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. 更新能力评估
router.post('/ability-assessment', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { subject, skill_name, ...assessmentData } = req.body;

    if (!subject || !skill_name) {
      return res.status(400).json({
        success: false,
        message: '缺少学科或技能名称'
      });
    }

    const assessment = await learningPlanService.updateAbilityAssessment(
      String(userId),
      subject,
      skill_name,
      assessmentData
    );

    res.json({ success: true, data: assessment });
  } catch (error: any) {
    console.error('更新能力评估失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. 删除计划
router.delete('/plan/:planId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { planId } = req.params;

    await learningPlanService.deletePlan(planId, String(userId));

    res.json({ success: true, message: '计划已删除' });
  } catch (error: any) {
    console.error('删除计划失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 12. 暂停/恢复计划
router.post('/plan/:planId/toggle', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { planId } = req.params;

    const plan = await learningPlanService.togglePlanStatus(planId, String(userId));

    res.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('切换计划状态失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
