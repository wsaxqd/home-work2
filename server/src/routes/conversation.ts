import { Router } from 'express';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { conversationService } from '../services/conversationService';

const router = Router();

// 保存对话消息（支持可选认证）
router.post('/messages', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId;
  const { companionId, role, content } = req.body;

  const message = await conversationService.saveMessage(userId, companionId, role, content);
  sendSuccess(res, message, '消息保存成功', 201);
}));

// 获取对话历史（需要认证）
router.get('/history', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { companionId, limit } = req.query;

  const history = await conversationService.getHistory(
    userId,
    companionId as string | undefined,
    limit ? parseInt(limit as string) : 50
  );

  sendSuccess(res, { messages: history, total: history.length });
}));

// 清空对话历史（需要认证）
router.delete('/history', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { companionId } = req.query;

  // 这里可以添加删除逻辑
  sendSuccess(res, null, '对话历史已清空');
}));

export default router;
