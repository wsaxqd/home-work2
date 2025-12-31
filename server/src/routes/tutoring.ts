import { Router } from 'express';
import { tutoringService } from '../services/tutoringService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errorHandler';

const router = Router();

// 获取可用科目列表
router.get('/subjects', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const subjects = tutoringService.getAvailableSubjects();
  sendSuccess(res, subjects);
}));

// 开始新的辅导会话
router.post('/sessions/start', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { subject } = req.body;

  if (!subject) {
    throw new AppError('请选择辅导科目', 400);
  }

  const session = await tutoringService.startSession(userId, subject);
  sendSuccess(res, session);
}));

// 获取下一个问题
router.get('/sessions/:sessionId/next-question', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { sessionId } = req.params;
  const question = await tutoringService.getNextQuestion(sessionId);
  sendSuccess(res, question);
}));

// 提交答案
router.post('/sessions/:sessionId/submit-answer', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { sessionId } = req.params;
  const { question, answer } = req.body;

  if (!question || !answer) {
    throw new AppError('问题和答案不能为空', 400);
  }

  const result = await tutoringService.submitAnswer(sessionId, question, answer);
  sendSuccess(res, result);
}));

// 结束辅导会话
router.post('/sessions/:sessionId/end', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { sessionId } = req.params;
  const summary = await tutoringService.endSession(sessionId);
  sendSuccess(res, summary);
}));

// 获取辅导历史
router.get('/history', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { subject, limit } = req.query;

  const history = await tutoringService.getHistory(
    userId,
    subject as string,
    limit ? parseInt(limit as string) : undefined
  );

  sendSuccess(res, history);
}));

// 获取学习统计
router.get('/statistics', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { subject } = req.query;

  const stats = await tutoringService.getStatistics(userId, subject as string);
  sendSuccess(res, stats);
}));

export default router;
