import { Router } from 'express';
import { contentGenerationService } from '../services/contentGenerationService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errorHandler';

const router = Router();

// 生成增强版故事
router.post('/story/enhanced', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const options = req.body;

  const story = await contentGenerationService.generateEnhancedStory(userId, options);
  sendSuccess(res, story);
}));

// 生成诗歌/儿歌
router.post('/poetry', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { topic, style, mood, length } = req.body;

  if (!topic) {
    throw new AppError('请提供诗歌主题', 400);
  }

  const poetry = await contentGenerationService.generatePoetry(userId, {
    topic,
    style,
    mood,
    length,
  });

  sendSuccess(res, poetry);
}));

// 生成绘画提示词
router.post('/art-prompt', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { subject, style, mood, colors, details } = req.body;

  if (!subject) {
    throw new AppError('请提供绘画主题', 400);
  }

  const artPrompt = await contentGenerationService.generateArtPrompt(userId, {
    subject,
    style,
    mood,
    colors,
    details,
  });

  sendSuccess(res, artPrompt);
}));

// 生成编程代码
router.post('/code', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { task, language, difficulty, includeComments } = req.body;

  if (!task) {
    throw new AppError('请描述编程任务', 400);
  }

  const code = await contentGenerationService.generateCode(userId, {
    task,
    language,
    difficulty,
    includeComments,
  });

  sendSuccess(res, code);
}));

// 生成学习卡片
router.post('/learning-card', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { topic, subject } = req.body;

  if (!topic || !subject) {
    throw new AppError('请提供主题和科目', 400);
  }

  const card = await contentGenerationService.generateLearningCard(userId, topic, subject);
  sendSuccess(res, card);
}));

// 生成互动故事
router.post('/interactive-story', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { theme, currentChoice } = req.body;

  if (!theme) {
    throw new AppError('请提供故事主题', 400);
  }

  const story = await contentGenerationService.generateInteractiveStory(userId, theme, currentChoice);
  sendSuccess(res, story);
}));

// 获取生成历史
router.get('/history', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { type, limit } = req.query;

  const history = await contentGenerationService.getGenerationHistory(
    userId,
    type as string,
    limit ? parseInt(limit as string) : undefined
  );

  sendSuccess(res, history);
}));

// 点赞生成的内容
router.post('/:generationId/like', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { generationId } = req.params;

  await contentGenerationService.likeGeneration(userId, generationId);
  sendSuccess(res, { message: '点赞成功' });
}));

export default router;
