/**
 * AI作业助手路由
 */

import { Router } from 'express';
import { homeworkHelperController, uploadMiddleware } from '../controllers/homeworkHelperController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * 上传题目图片并识别
 * POST /api/homework/upload
 * Content-Type: multipart/form-data
 * Body:
 *   - image: 图片文件
 *   - questionType: 题目类型 (可选: math, chinese, english, science)
 *   - subject: 学科 (可选)
 *   - gradeLevel: 年级 (小学1-6年级, 初中1-3年级)
 */
router.post('/upload', uploadMiddleware, homeworkHelperController.uploadQuestion.bind(homeworkHelperController));

/**
 * AI解答题目
 * POST /api/homework/answer/:questionId
 */
router.post('/answer/:questionId', homeworkHelperController.answerQuestion.bind(homeworkHelperController));

/**
 * 获取题目历史
 * GET /api/homework/history?page=1&limit=20
 */
router.get('/history', homeworkHelperController.getHistory.bind(homeworkHelperController));

/**
 * 收藏题目
 * POST /api/homework/favorite/:questionId
 * Body:
 *   - tags: 标签数组 (可选)
 *   - notes: 笔记 (可选)
 */
router.post('/favorite/:questionId', homeworkHelperController.favoriteQuestion.bind(homeworkHelperController));

/**
 * 获取收藏的题目
 * GET /api/homework/favorites
 */
router.get('/favorites', homeworkHelperController.getFavorites.bind(homeworkHelperController));

/**
 * 苏格拉底式AI讲解
 * POST /api/homework/socratic-explain/:questionId
 * Body:
 *   - userQuestion: 用户的问题或困惑
 *   - conversationHistory: 对话历史（可选）
 */
router.post('/socratic-explain/:questionId', homeworkHelperController.socraticExplain.bind(homeworkHelperController));

/**
 * 一步一步讲解
 * POST /api/homework/step-by-step/:questionId
 */
router.post('/step-by-step/:questionId', homeworkHelperController.stepByStepExplain.bind(homeworkHelperController));

export default router;
