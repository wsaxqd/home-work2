import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authMiddleware, optionalAuth } from '../middlewares/auth';
import { followService } from '../services/followService';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

const router = Router();

// 获取当前用户信息
router.get('/profile', authMiddleware, userController.getProfile);

// 更新用户信息
router.put('/profile', authMiddleware, userController.updateProfile);

// 获取用户统计数据
router.get('/stats', authMiddleware, userController.getUserStats);

// 获取粉丝列表
router.get('/followers', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const result = await followService.getFollowers(userId, page, pageSize);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 获取关注列表
router.get('/following', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const result = await followService.getFollowing(userId, page, pageSize);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 获取指定用户信息
router.get('/:id', optionalAuth, userController.getUserById);

// 关注用户
router.post('/:id/follow', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const followerId = req.userId!;
  const followingId = req.params.id;
  const result = await followService.follow(followerId, followingId);
  sendSuccess(res, null, result.message);
}));

// 取消关注
router.delete('/:id/follow', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const followerId = req.userId!;
  const followingId = req.params.id;
  const result = await followService.unfollow(followerId, followingId);
  sendSuccess(res, null, result.message);
}));

// 绑定手机号
router.post('/bind-phone', authMiddleware, userController.bindPhone);

// 绑定邮箱
router.post('/bind-email', authMiddleware, userController.bindEmail);

export default router;
