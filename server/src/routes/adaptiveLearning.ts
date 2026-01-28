import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendError } from '../utils/response';
import { knowledgeGraphService } from '../services/knowledgeGraphService';
import { learningBehaviorService } from '../services/learningBehaviorService';
import { adaptiveLearningService } from '../services/adaptiveLearningService';
import { learningQuestionService } from '../services/learningQuestionService';

const router = Router();

// ==================== 知识图谱相关 ====================

/**
 * 获取知识图谱
 * GET /api/adaptive-learning/knowledge-graph
 */
router.get('/knowledge-graph', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { subject, grade } = req.query;
  const userId = req.userId!;

  if (!subject || !grade) {
    return sendError(res, '缺少subject或grade参数', 400);
  }

  const knowledgeGraph = await knowledgeGraphService.getKnowledgeGraph(
    subject as string,
    grade as string,
    userId
  );

  sendSuccess(res, knowledgeGraph);
}));

/**
 * 获取知识点详情
 * GET /api/adaptive-learning/knowledge-point/:id
 */
router.get('/knowledge-point/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.userId!;

  const knowledgePoint = await knowledgeGraphService.getKnowledgePoint(id, userId);
  sendSuccess(res, knowledgePoint);
}));

/**
 * 搜索知识点
 * GET /api/adaptive-learning/knowledge-search
 */
router.get('/knowledge-search', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { keyword, subject, grade } = req.query;

  if (!keyword) {
    return sendError(res, '缺少keyword参数', 400);
  }

  const results = await knowledgeGraphService.searchKnowledgePoints(
    keyword as string,
    subject as string | undefined,
    grade as string | undefined
  );

  sendSuccess(res, results);
}));

// ==================== 学习行为相关 ====================

/**
 * 提交答题记录
 * POST /api/adaptive-learning/submit-answer
 */
router.post('/submit-answer', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const {
    questionId,
    knowledgePointId,
    difficultyLevel,
    answer,
    isCorrect,
    answerTime,
    hintUsed,
    attemptNumber
  } = req.body;

  if (!knowledgePointId || typeof isCorrect !== 'boolean' || !answerTime) {
    return sendError(res, '缺少必要参数', 400);
  }

  // 记录答题行为
  const result = await learningBehaviorService.recordQuestionAttempt({
    userId,
    questionId,
    knowledgePointId,
    difficultyLevel: difficultyLevel || 1,
    answer: answer || '',
    isCorrect,
    answerTime,
    hintUsed,
    attemptNumber
  });

  // 获取下一步建议
  const nextAction = await adaptiveLearningService.adjustDifficulty(
    userId,
    knowledgePointId,
    difficultyLevel || 1
  );

  // 获取更新后的知识点掌握情况
  const behaviors = await learningBehaviorService.getUserLearningBehavior(userId, knowledgePointId);
  const currentBehavior = behaviors[0];

  sendSuccess(res, {
    isCorrect,
    feedback: isCorrect ? '回答正确！继续保持！' : '答案不对哦，再想想~',
    nextAction: {
      type: nextAction.change > 0 ? 'increase_difficulty' :
            nextAction.change < 0 ? 'decrease_difficulty' : 'continue',
      message: nextAction.reason,
      nextDifficulty: nextAction.newDifficulty
    },
    knowledgePointUpdate: {
      knowledgePointId,
      previousMastery: result.masteryLevel - (isCorrect ? 1 : 0),
      currentMastery: result.masteryLevel,
      accuracyRate: currentBehavior?.accuracy_rate || 0,
      consecutiveCorrect: currentBehavior?.consecutive_correct || 0,
      consecutiveWrong: currentBehavior?.consecutive_wrong || 0
    }
  });
}));

/**
 * 获取用户学习行为数据
 * GET /api/adaptive-learning/learning-behavior
 */
router.get('/learning-behavior', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { knowledgePointId } = req.query;

  const behaviors = await learningBehaviorService.getUserLearningBehavior(
    userId,
    knowledgePointId as string | undefined
  );

  sendSuccess(res, behaviors);
}));

// ==================== 薄弱点诊断 ====================

/**
 * 获取薄弱点诊断
 * GET /api/adaptive-learning/weak-points
 */
router.get('/weak-points', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { subject, threshold } = req.query;

  const weakPoints = await learningBehaviorService.detectWeakPoints(
    userId,
    subject as string | undefined,
    threshold ? parseFloat(threshold as string) : 0.6
  );

  const summary = {
    totalWeakPoints: weakPoints.length,
    mostUrgent: weakPoints.length > 0 ? weakPoints[0].knowledgePointId : null,
    estimatedImprovementDays: Math.ceil(weakPoints.length * 2)
  };

  sendSuccess(res, {
    weakPoints,
    summary
  });
}));

// ==================== 学习路径相关 ====================

/**
 * 生成个性化学习路径
 * POST /api/adaptive-learning/generate-path
 */
router.post('/generate-path', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { subject, grade, goal, timeConstraint, dailyTimeLimit } = req.body;

  if (!subject || !grade || !goal) {
    return sendError(res, '缺少subject、grade或goal参数', 400);
  }

  const path = await adaptiveLearningService.generateLearningPath({
    userId,
    subject,
    grade,
    goal,
    timeConstraint,
    dailyTimeLimit
  });

  sendSuccess(res, path);
}));

/**
 * 获取用户学习路径
 * GET /api/adaptive-learning/learning-path/:pathId
 */
router.get('/learning-path/:pathId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { pathId } = req.params;

  const path = await adaptiveLearningService.getUserLearningPath(userId, parseInt(pathId));
  sendSuccess(res, path);
}));

/**
 * 更新学习路径进度
 * PUT /api/adaptive-learning/learning-path/:pathId/progress
 */
router.put('/learning-path/:pathId/progress', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { pathId } = req.params;
  const { completedStep } = req.body;

  if (typeof completedStep !== 'number') {
    return sendError(res, '缺少completedStep参数', 400);
  }

  await adaptiveLearningService.updatePathProgress(userId, parseInt(pathId), completedStep);
  sendSuccess(res, { message: '进度更新成功' });
}));

// ==================== 智能推荐 ====================

/**
 * 获取智能推荐
 * GET /api/adaptive-learning/recommendations
 */
router.get('/recommendations', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { limit } = req.query;

  const recommendations = await adaptiveLearningService.generateSmartRecommendations(
    userId,
    limit ? parseInt(limit as string) : 5
  );

  sendSuccess(res, { recommendations });
}));

// ==================== 学习分析报告 ====================

/**
 * 获取学习分析报告
 * GET /api/adaptive-learning/analysis-report
 */
router.get('/analysis-report', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { subject, timeRange } = req.query;

  const report = await learningBehaviorService.getAnalysisReport(
    userId,
    subject as string | undefined,
    (timeRange as string) || 'week'
  );

  sendSuccess(res, report);
}));

// ==================== 题目相关 ====================

/**
 * 获取知识点题目列表
 * GET /api/adaptive-learning/questions
 */
router.get('/questions', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const {
    knowledgePointId,
    subject,
    grade,
    difficulty,
    questionType,
    limit,
    offset
  } = req.query;

  if (!knowledgePointId && !subject) {
    return sendError(res, '必须提供knowledgePointId或subject参数', 400);
  }

  let questions;

  if (knowledgePointId) {
    // 根据知识点获取题目
    questions = await learningQuestionService.getQuestionsByKnowledgePoint(
      knowledgePointId as string,
      {
        difficulty: difficulty ? parseInt(difficulty as string) : undefined,
        questionType: questionType as string,
        limit: limit ? parseInt(limit as string) : 10,
        offset: offset ? parseInt(offset as string) : 0
      }
    );
  } else {
    // 根据多个条件获取题目
    questions = await learningQuestionService.getQuestions({
      subject: subject as string,
      grade: grade as string,
      difficulty: difficulty ? parseInt(difficulty as string) : undefined,
      questionType: questionType as string,
      limit: limit ? parseInt(limit as string) : 10,
      offset: offset ? parseInt(offset as string) : 0
    });
  }

  sendSuccess(res, { questions, count: questions.length });
}));

/**
 * 获取推荐题目
 * GET /api/adaptive-learning/recommended-questions
 */
router.get('/recommended-questions', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { knowledgePointId, count } = req.query;

  if (!knowledgePointId) {
    return sendError(res, '缺少knowledgePointId参数', 400);
  }

  const questions = await learningQuestionService.getRecommendedQuestions(
    userId,
    knowledgePointId as string,
    count ? parseInt(count as string) : 5
  );

  sendSuccess(res, { questions, count: questions.length });
}));

/**
 * 获取题目详情
 * GET /api/adaptive-learning/questions/:id
 */
router.get('/questions/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const question = await learningQuestionService.getQuestionById(id);

  if (!question) {
    return sendError(res, '题目不存在', 404);
  }

  sendSuccess(res, question);
}));

/**
 * 统计知识点题目数量
 * GET /api/adaptive-learning/questions-count
 */
router.get('/questions-count', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { knowledgePointId, difficulty } = req.query;

  if (!knowledgePointId) {
    return sendError(res, '缺少knowledgePointId参数', 400);
  }

  const count = await learningQuestionService.countQuestionsByKnowledgePoint(
    knowledgePointId as string,
    difficulty ? parseInt(difficulty as string) : undefined
  );

  sendSuccess(res, { count });
}));

export default router;
