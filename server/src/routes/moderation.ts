import { Router } from 'express';
import { moderationService } from '../services/moderationService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errorHandler';

const router = Router();

// 审核单个内容
router.post('/check', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { content, contentType } = req.body;

  if (!content || !contentType) {
    throw new AppError('请提供内容和内容类型', 400);
  }

  const result = await moderationService.moderateContent(userId, content, contentType);
  sendSuccess(res, result);
}));

// 批量审核
router.post('/check-batch', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { contents } = req.body;

  if (!Array.isArray(contents) || contents.length === 0) {
    throw new AppError('请提供内容数组', 400);
  }

  const results = await moderationService.moderateBatch(userId, contents);
  sendSuccess(res, results);
}));

// 检查用户行为模式
router.get('/user-behavior', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const behavior = await moderationService.checkUserBehavior(userId);
  sendSuccess(res, behavior);
}));

// 获取审核统计（管理员）
router.get('/stats', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { userId, days } = req.query;

  const stats = await moderationService.getModerationStats(
    userId as string,
    days ? parseInt(days as string) : undefined
  );

  sendSuccess(res, stats);
}));

// 获取被标记的内容列表（管理员）
router.get('/flagged', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { limit } = req.query;

  const flagged = await moderationService.getFlaggedContent(
    limit ? parseInt(limit as string) : undefined
  );

  sendSuccess(res, flagged);
}));

// 人工审核标记的内容（管理员）
router.post('/review/:logId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { logId } = req.params;
  const { decision, note } = req.body;

  if (!decision || !['approve', 'block', 'warn'].includes(decision)) {
    throw new AppError('无效的审核决定', 400);
  }

  const result = await moderationService.reviewFlaggedContent(logId, userId, decision, note);
  sendSuccess(res, result);
}));

export default router;
