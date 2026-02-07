import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { bookmarkService } from '../services/bookmarkService';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';

/**
 * 添加书签
 */
export const createBookmark = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { resourceType, resourceId, resourceTitle, position, notes } = req.body;

  const bookmark = await bookmarkService.createBookmark({
    userId,
    resourceType,
    resourceId,
    resourceTitle,
    position,
    notes
  });

  sendSuccess(res, bookmark, '书签添加成功');
});

/**
 * 获取书签列表
 */
export const getBookmarks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const resourceType = req.query.resourceType as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await bookmarkService.getUserBookmarks(userId, resourceType, page, limit);

  sendSuccess(res, result);
});

/**
 * 检查书签是否存在
 */
export const checkBookmark = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { resourceType, resourceId } = req.query;

  const exists = await bookmarkService.hasBookmark(
    userId,
    resourceType as string,
    resourceId as string
  );

  sendSuccess(res, { exists });
});

/**
 * 更新书签
 */
export const updateBookmark = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const bookmarkId = parseInt(req.params.id);
  const { position, notes } = req.body;

  const bookmark = await bookmarkService.updateBookmark(bookmarkId, userId, {
    position,
    notes
  });

  sendSuccess(res, bookmark, '书签更新成功');
});

/**
 * 删除书签
 */
export const deleteBookmark = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const bookmarkId = parseInt(req.params.id);

  await bookmarkService.deleteBookmark(bookmarkId, userId);

  sendSuccess(res, null, '书签删除成功');
});
