import { Router } from 'express';
import { notificationService, NotificationType } from '../services/notificationService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';

const router = Router();

// 获取通知列表
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const type = req.query.type as NotificationType;

  const result = await notificationService.getNotifications(userId, page, pageSize, type);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 获取未读通知数量
router.get('/unread-count', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const result = await notificationService.getUnreadCount(userId);
  sendSuccess(res, result);
}));

// 标记单个通知为已读
router.put('/:id/read', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const notificationId = req.params.id;

  const notification = await notificationService.markAsRead(notificationId, userId);
  sendSuccess(res, notification, '已标记为已读');
}));

// 标记所有通知为已读
router.put('/read-all', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const result = await notificationService.markAllAsRead(userId);
  sendSuccess(res, null, result.message);
}));

// 删除单个通知
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const notificationId = req.params.id;

  const result = await notificationService.deleteNotification(notificationId, userId);
  sendSuccess(res, null, result.message);
}));

// 清空已读通知
router.delete('/clear/read', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const result = await notificationService.clearReadNotifications(userId);
  sendSuccess(res, null, result.message);
}));

export default router;
