import { Router } from 'express';
import { aiService, AITaskType } from '../services/aiService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendPaginated } from '../utils/response';

const router = Router();

// AI对话
router.post('/chat', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { messages, context } = req.body;

  const result = await aiService.chat(userId, messages, context);
  sendSuccess(res, result);
}));

// AI生成故事
router.post('/story', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { prompt, theme, length, style } = req.body;

  const result = await aiService.generateStory(userId, prompt, { theme, length, style });
  sendSuccess(res, result, '故事生成成功', 201);
}));

// 图像识别
router.post('/image/recognize', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { imageUrl, taskType } = req.body;

  const result = await aiService.recognizeImage(userId, imageUrl, taskType || 'object');
  sendSuccess(res, result);
}));

// 情感分析
router.post('/emotion/analyze', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { text } = req.body;

  const result = await aiService.analyzeEmotion(userId, text);
  sendSuccess(res, result);
}));

// 语音转文字
router.post('/voice/to-text', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { voiceUrl } = req.body;

  const result = await aiService.speechToText(userId, voiceUrl);
  sendSuccess(res, result);
}));

// 文字转语音
router.post('/voice/to-speech', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { text, voice } = req.body;

  const result = await aiService.textToSpeech(userId, text, voice);
  sendSuccess(res, result);
}));

// 获取AI使用历史
router.get('/history', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const taskType = req.query.taskType as AITaskType;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const result = await aiService.getHistory(userId, taskType, page, pageSize);
  sendPaginated(res, result.list, result.page, result.pageSize, result.total);
}));

// 获取AI使用统计
router.get('/stats', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const stats = await aiService.getUsageStats(userId);
  sendSuccess(res, stats);
}));

// 获取对话上下文
router.get('/conversation/context', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const taskType = (req.query.taskType as any) || 'chat';

  const context = await aiService.getConversationContext(userId, taskType);
  sendSuccess(res, context);
}));

// 清除对话上下文
router.delete('/conversation/context', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const taskType = (req.query.taskType as any) || 'chat';

  await aiService.clearConversationContext(userId, taskType);
  sendSuccess(res, null, '对话已清除');
}));

// AI健康检查
router.get('/health', asyncHandler(async (req, res) => {
  const isHealthy = await aiService.healthCheck();

  if (isHealthy) {
    sendSuccess(res, { status: 'healthy' }, 'AI服务运行正常');
  } else {
    res.status(503).json({
      success: false,
      message: 'AI服务暂时不可用',
      data: { status: 'unhealthy' },
    });
  }
}));

export default router;
