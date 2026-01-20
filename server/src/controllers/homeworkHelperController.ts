/**
 * AI作业助手控制器
 * 支持小学和初中作业辅导
 */

import { Request, Response } from 'express';
import { homeworkHelperService } from '../services/homeworkHelperService';
import multer from 'multer';
import path from 'path';

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp)'));
    }
  },
});

export class HomeworkHelperController {
  /**
   * 上传题目图片并识别
   * POST /api/homework/upload
   */
  async uploadQuestion(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '请先登录',
        });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: '请上传图片文件',
        });
      }

      const { questionType, subject, gradeLevel } = req.body;

      const result = await homeworkHelperService.uploadQuestion({
        userId,
        imageBuffer: file.buffer,
        filename: file.originalname,
        questionType,
        subject,
        gradeLevel: gradeLevel || '小学', // 默认小学
      });

      res.json({
        success: true,
        message: '题目上传成功',
        data: result,
      });
    } catch (error: any) {
      console.error('❌ 上传题目失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '上传失败',
      });
    }
  }

  /**
   * AI解答题目
   * POST /api/homework/answer/:questionId
   */
  async answerQuestion(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '请先登录',
        });
      }

      const { questionId } = req.params;

      const result = await homeworkHelperService.answerQuestion(questionId, userId);

      // 更新统计
      await homeworkHelperService.updateStatistics(userId);

      res.json({
        success: true,
        message: 'AI解答成功',
        data: result,
      });
    } catch (error: any) {
      console.error('❌ AI解答失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '解答失败',
      });
    }
  }

  /**
   * 获取题目历史
   * GET /api/homework/history
   */
  async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '请先登录',
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const history = await homeworkHelperService.getQuestionHistory(userId, page, limit);

      res.json({
        success: true,
        message: '获取成功',
        data: {
          questions: history,
          page,
          limit,
        },
      });
    } catch (error: any) {
      console.error('❌ 获取历史失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取失败',
      });
    }
  }

  /**
   * 收藏题目
   * POST /api/homework/favorite/:questionId
   */
  async favoriteQuestion(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '请先登录',
        });
      }

      const { questionId } = req.params;
      const { tags, notes } = req.body;

      await homeworkHelperService.favoriteQuestion(userId, questionId, tags, notes);

      res.json({
        success: true,
        message: '收藏成功',
      });
    } catch (error: any) {
      console.error('❌ 收藏失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '收藏失败',
      });
    }
  }

  /**
   * 获取收藏的题目
   * GET /api/homework/favorites
   */
  async getFavorites(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '请先登录',
        });
      }

      const favorites = await homeworkHelperService.getFavoriteQuestions(userId);

      res.json({
        success: true,
        message: '获取成功',
        data: favorites,
      });
    } catch (error: any) {
      console.error('❌ 获取收藏失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取失败',
      });
    }
  }
}

export const homeworkHelperController = new HomeworkHelperController();
export const uploadMiddleware = upload.single('image');
