import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { noteService } from '../services/noteService';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';

/**
 * 创建笔记
 */
export const createNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { title, content, resourceType, resourceId, tags } = req.body;

  const note = await noteService.createNote({
    userId,
    title,
    content,
    resourceType,
    resourceId,
    tags
  });

  sendSuccess(res, note, '笔记创建成功');
});

/**
 * 获取笔记列表
 */
export const getNotes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const search = req.query.search as string;
  const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
  const isFavorite = req.query.isFavorite === 'true';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await noteService.getUserNotes(userId, {
    search,
    tags,
    isFavorite,
    page,
    limit
  });

  sendSuccess(res, result);
});

/**
 * 获取笔记详情
 */
export const getNoteDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const noteId = parseInt(req.params.id);

  const note = await noteService.getNoteById(noteId, userId);

  sendSuccess(res, note);
});

/**
 * 更新笔记
 */
export const updateNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const noteId = parseInt(req.params.id);
  const { title, content, resourceType, resourceId, tags, isFavorite } = req.body;

  const note = await noteService.updateNote(noteId, userId, {
    title,
    content,
    resourceType,
    resourceId,
    tags,
    isFavorite
  });

  sendSuccess(res, note, '笔记更新成功');
});

/**
 * 删除笔记
 */
export const deleteNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const noteId = parseInt(req.params.id);

  await noteService.deleteNote(noteId, userId);

  sendSuccess(res, null, '笔记删除成功');
});

/**
 * 获取所有标签
 */
export const getAllTags = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const tags = await noteService.getAllTags(userId);

  sendSuccess(res, { tags });
});
