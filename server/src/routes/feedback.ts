import express from 'express';
import * as feedbackController from '../controllers/feedbackController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 所有反馈路由都需要认证
router.use(authMiddleware);

// 提交反馈
router.post('/', feedbackController.createFeedback);

// 获取我的反馈列表
router.get('/my', feedbackController.getMyFeedback);

// 获取反馈详情
router.get('/:id', feedbackController.getFeedbackDetail);

// 删除反馈
router.delete('/:id', feedbackController.deleteFeedback);

export default router;
