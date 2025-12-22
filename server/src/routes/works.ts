import { Router } from 'express';
import { workService } from '../services/workService';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';

const router = Router();

// 获取公开作品画廊
router.get('/gallery', asyncHandler(async (req, res) => {
  const type = req.query.type as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const result = await workService.getGallery({ type: type as any, page, pageSize });
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 获取热门作品
router.get('/trending', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const works = await workService.getTrending(limit);
  sendSuccess(res, works);
}));

// 创建作品
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { type, title, content, coverImage, audioUrl } = req.body;
  const work = await workService.create(userId, { type, title, content, coverImage, audioUrl });
  sendSuccess(res, work, '创建成功', 201);
}));

// 获取用户作品列表
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const type = req.query.type as string;
  const status = req.query.status as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const result = await workService.getUserWorks(userId, { type: type as any, status: status as any, page, pageSize });
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 获取作品详情
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const workId = req.params.id;
  const userId = req.userId;
  const work = await workService.getById(workId, userId);
  sendSuccess(res, work);
}));

// 更新作品
router.put('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const workId = req.params.id;
  const userId = req.userId!;
  const { title, content, coverImage, audioUrl } = req.body;
  const work = await workService.update(workId, userId, { title, content, coverImage, audioUrl });
  sendSuccess(res, work, '更新成功');
}));

// 删除作品
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const workId = req.params.id;
  const userId = req.userId!;
  await workService.delete(workId, userId);
  sendSuccess(res, null, '删除成功');
}));

// 发布作品
router.post('/:id/publish', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const workId = req.params.id;
  const userId = req.userId!;
  const work = await workService.publish(workId, userId);
  sendSuccess(res, work, '发布成功');
}));

// 取消发布
router.post('/:id/unpublish', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const workId = req.params.id;
  const userId = req.userId!;
  const work = await workService.unpublish(workId, userId);
  sendSuccess(res, work, '已取消发布');
}));

export default router;
