import express from 'express';
import * as noteController from '../controllers/noteController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 所有笔记路由都需要认证
router.use(authMiddleware);

// 创建笔记
router.post('/', noteController.createNote);

// 获取笔记列表
router.get('/', noteController.getNotes);

// 获取所有标签
router.get('/tags', noteController.getAllTags);

// 获取笔记详情
router.get('/:id', noteController.getNoteDetail);

// 更新笔记
router.put('/:id', noteController.updateNote);

// 删除笔记
router.delete('/:id', noteController.deleteNote);

export default router;
