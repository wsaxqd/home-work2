import { Router } from 'express';
import { templateService } from '../services/templateService';
import { topicService } from '../services/topicService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';

const router = Router();

// ============ 创作模板 ============

// 获取模板列表
router.get('/templates', asyncHandler(async (req, res) => {
  const type = req.query.type as string;
  const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : undefined;
  const templates = await templateService.getTemplates(type, difficulty);
  sendSuccess(res, templates);
}));

// 使用模板
router.post('/templates/:id/use', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const templateId = req.params.id;
  await templateService.useTemplate(templateId);
  sendSuccess(res, null, '模板使用成功');
}));

// ============ 收藏功能 ============

// 收藏/取消收藏
router.post('/favorites', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { itemType, itemId } = req.body;

  if (!itemType || !itemId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  const result = await templateService.toggleFavorite(userId, itemType, itemId);
  sendSuccess(res, result, result.message);
}));

// 获取收藏列表
router.get('/favorites', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const itemType = req.query.itemType as string;
  const favorites = await templateService.getUserFavorites(userId, itemType);
  sendSuccess(res, favorites);
}));

// ============ 话题功能 ============

// 获取话题列表
router.get('/topics', asyncHandler(async (req, res) => {
  const status = (req.query.status as string) || 'active';
  const isFeatured = req.query.featured ? req.query.featured === 'true' : undefined;
  const topics = await topicService.getTopics(status, isFeatured);
  sendSuccess(res, topics);
}));

// 参与话题
router.post('/topics/:id/participate', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const topicId = req.params.id;
  const userId = req.userId!;
  const { workId } = req.body;

  if (!workId) {
    return res.status(400).json({ success: false, message: '缺少作品ID' });
  }

  const result = await topicService.participateInTopic(topicId, workId, userId);
  sendSuccess(res, null, result.message);
}));

// 获取话题下的作品
router.get('/topics/:id/works', asyncHandler(async (req, res) => {
  const topicId = req.params.id;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const result = await topicService.getTopicWorks(topicId, page, pageSize);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

export default router;
