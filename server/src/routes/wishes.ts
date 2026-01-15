import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';
import { wishesService } from '../services/wishesService';

const router = Router();

// 创建心愿
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { content, category } = req.body;

  const wish = await wishesService.createWish(userId, { content, category });
  sendSuccess(res, wish, '心愿创建成功', 201);
}));

// 获取心愿列表
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const status = req.query.status as string;
  const category = req.query.category as string;

  const wishes = await wishesService.getWishes(userId, { status, category });
  sendSuccess(res, { items: wishes, total: wishes.length });
}));

// 获取单个心愿
router.get('/:wishId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { wishId } = req.params;

  const wish = await wishesService.getWish(userId, wishId);
  sendSuccess(res, wish);
}));

// 更新心愿
router.put('/:wishId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { wishId } = req.params;
  const { content, category, status } = req.body;

  const wish = await wishesService.updateWish(userId, wishId, { content, category, status });
  sendSuccess(res, wish, '心愿更新成功');
}));

// 删除心愿
router.delete('/:wishId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { wishId } = req.params;

  await wishesService.deleteWish(userId, wishId);
  sendSuccess(res, null, '心愿删除成功');
}));

// 获取心愿统计
router.get('/stats', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const stats = await wishesService.getStats(userId);
  sendSuccess(res, stats);
}));

export default router;
