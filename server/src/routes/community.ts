import { Router } from 'express';
import { communityService } from '../services/communityService';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';

const router = Router();

// ============ 点赞 ============

// 点赞作品
router.post('/works/:id/like', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const workId = req.params.id;
  const userId = req.userId!;
  const result = await communityService.likeWork(workId, userId);
  sendSuccess(res, null, result.message);
}));

// 取消点赞
router.delete('/works/:id/like', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const workId = req.params.id;
  const userId = req.userId!;
  const result = await communityService.unlikeWork(workId, userId);
  sendSuccess(res, null, result.message);
}));

// ============ 评论 ============

// 发表评论
router.post('/works/:id/comments', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const workId = req.params.id;
  const userId = req.userId!;
  const { content, parentId } = req.body;
  const comment = await communityService.createComment(workId, userId, content, parentId);
  sendSuccess(res, comment, '评论成功', 201);
}));

// 获取评论列表
router.get('/works/:id/comments', asyncHandler(async (req, res) => {
  const workId = req.params.id;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const result = await communityService.getComments(workId, page, pageSize);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 获取评论回复
router.get('/comments/:id/replies', asyncHandler(async (req, res) => {
  const commentId = req.params.id;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const result = await communityService.getCommentReplies(commentId, page, pageSize);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 删除评论
router.delete('/comments/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const commentId = req.params.id;
  const userId = req.userId!;
  const result = await communityService.deleteComment(commentId, userId);
  sendSuccess(res, null, result.message);
}));

// ============ 心愿墙 ============

// 发布心愿
router.post('/wishes', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { content } = req.body;
  const wish = await communityService.createWish(userId, content);
  sendSuccess(res, wish, '心愿发布成功', 201);
}));

// 获取心愿墙
router.get('/wishes', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;
  const result = await communityService.getWishes(page, pageSize, status);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 支持心愿
router.post('/wishes/:id/support', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const wishId = req.params.id;
  const userId = req.userId!;
  const result = await communityService.supportWish(wishId, userId);
  sendSuccess(res, null, result.message);
}));

// 更新心愿状态
router.put('/wishes/:id/status', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const wishId = req.params.id;
  const userId = req.userId!;
  const { status } = req.body;
  const wish = await communityService.updateWishStatus(wishId, userId, status);
  sendSuccess(res, wish, '状态更新成功');
}));

export default router;
