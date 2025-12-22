import { Router } from 'express';
import { assessmentService, AssessmentType } from '../services/assessmentService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';

const router = Router();

// 获取评估题目
router.get('/questions', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const assessmentType = req.query.type as AssessmentType;
  const level = req.query.level as any;

  if (!assessmentType) {
    return res.status(400).json({ success: false, message: '请指定评估类型' });
  }

  const questions = await assessmentService.getQuestions(assessmentType, level);
  sendSuccess(res, questions);
}));

// 提交评估
router.post('/submit', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { assessmentType, answers, totalTime } = req.body;

  const result = await assessmentService.submitAssessment(userId, {
    assessmentType,
    answers,
    totalTime,
  });

  sendSuccess(res, result, '评估提交成功', 201);
}));

// 获取评估历史
router.get('/history', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const assessmentType = req.query.type as AssessmentType;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const result = await assessmentService.getHistory(userId, assessmentType, page, pageSize);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 获取学习进度报告
router.get('/report', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const report = await assessmentService.getProgressReport(userId);
  sendSuccess(res, report);
}));

// 获取能力雷达图数据
router.get('/radar', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const radar = await assessmentService.getSkillRadar(userId);
  sendSuccess(res, radar);
}));

export default router;
