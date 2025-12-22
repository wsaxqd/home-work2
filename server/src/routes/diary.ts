import { Router } from 'express';
import { diaryService, MoodType } from '../services/diaryService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';

const router = Router();

// 创建日记
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { title, content, mood, weather, images, isPrivate } = req.body;

  const diary = await diaryService.createDiary(userId, {
    title,
    content,
    mood,
    weather,
    images,
    isPrivate,
  });

  sendSuccess(res, diary, '日记创建成功', 201);
}));

// 获取日记列表
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const mood = req.query.mood as MoodType;

  const result = await diaryService.getDiaries(userId, page, pageSize, mood);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 获取心情统计
router.get('/mood-stats', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const stats = await diaryService.getMoodStats(userId, startDate, endDate);
  sendSuccess(res, stats);
}));

// 获取日历数据
router.get('/calendar', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

  const calendar = await diaryService.getCalendarData(userId, year, month);
  sendSuccess(res, calendar);
}));

// 获取日记详情
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const diaryId = req.params.id;

  const diary = await diaryService.getDiaryById(diaryId, userId);
  sendSuccess(res, diary);
}));

// 更新日记
router.put('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const diaryId = req.params.id;
  const { title, content, mood, weather, images, isPrivate } = req.body;

  const diary = await diaryService.updateDiary(diaryId, userId, {
    title,
    content,
    mood,
    weather,
    images,
    isPrivate,
  });

  sendSuccess(res, diary, '日记更新成功');
}));

// 删除日记
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const diaryId = req.params.id;

  const result = await diaryService.deleteDiary(diaryId, userId);
  sendSuccess(res, null, result.message);
}));

export default router;
