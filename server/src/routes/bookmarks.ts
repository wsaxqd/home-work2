import express from 'express';
import * as bookmarkController from '../controllers/bookmarkController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 所有书签路由都需要认证
router.use(authMiddleware);

// 添加书签
router.post('/', bookmarkController.createBookmark);

// 获取书签列表
router.get('/', bookmarkController.getBookmarks);

// 检查书签是否存在
router.get('/check', bookmarkController.checkBookmark);

// 更新书签
router.put('/:id', bookmarkController.updateBookmark);

// 删除书签
router.delete('/:id', bookmarkController.deleteBookmark);

export default router;
