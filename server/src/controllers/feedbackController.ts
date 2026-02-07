import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { feedbackService } from '../services/feedbackService';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';

/**
 * 提交反馈
 */
export const createFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { type, content, images, contact } = req.body;

  const feedback = await feedbackService.createFeedback({
    userId,
    type,
    content,
    images,
    contact
  });

  sendSuccess(res, feedback, '反馈提交成功，我们会尽快处理');
});

/**
 * 获取我的反馈列表
 */
export const getMyFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await feedbackService.getUserFeedback(userId, page, limit);

  sendSuccess(res, result);
});

/**
 * 获取反馈详情
 */
export const getFeedbackDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const feedbackId = parseInt(req.params.id);

  const feedback = await feedbackService.getFeedbackById(feedbackId, userId);

  sendSuccess(res, feedback);
});

/**
 * 删除反馈
 */
export const deleteFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const feedbackId = parseInt(req.params.id);

  await feedbackService.deleteFeedback(feedbackId, userId);

  sendSuccess(res, null, '反馈已删除');
});
