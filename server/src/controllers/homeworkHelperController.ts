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

  /**
   * 苏格拉底式AI讲解
   * POST /api/homework/socratic-explain/:questionId
   */
  async socraticExplain(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '请先登录',
        });
      }

      const { questionId } = req.params;
      const { userQuestion, conversationHistory = [] } = req.body;

      // 构建苏格拉底式提示词
      const systemPrompt = `你是一位优秀的老师，擅长用苏格拉底式教学法引导学生思考。
不要直接给出答案，而是：
1. 通过提问引导学生思考问题的本质
2. 帮助学生发现自己的思维误区
3. 鼓励学生自己得出结论
4. 每次只问一个问题，循序渐进
5. 语气要温和、鼓励、耐心

学生的疑问：${userQuestion}`;

      // TODO: 调用Dify API生成回复
      // 这里先返回示例回复
      const aiResponse = `这是一个很好的问题！在回答之前，我想先问你几个问题：

1. 你能先告诉我，这道题目主要考查的是什么知识点吗？
2. 你在解题时，第一步想到的是什么？
3. 是什么让你觉得困惑了呢？

别着急，慢慢思考，我们一起来解决这个问题！`;

      // 保存对话记录
      // TODO: 保存到数据库

      res.json({
        success: true,
        message: 'AI讲解生成成功',
        data: {
          response: aiResponse,
          conversationHistory: [
            ...conversationHistory,
            { role: 'user', content: userQuestion },
            { role: 'assistant', content: aiResponse }
          ]
        }
      });
    } catch (error: any) {
      console.error('❌ 苏格拉底式讲解失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '讲解失败',
      });
    }
  }

  /**
   * 一步一步讲解
   * POST /api/homework/step-by-step/:questionId
   */
  async stepByStepExplain(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '请先登录',
        });
      }

      const { questionId } = req.params;

      // TODO: 获取题目信息并生成分步讲解
      const steps = [
        {
          step: 1,
          title: '理解题意',
          content: '首先，我们要仔细阅读题目，找出关键信息...',
          keyPoints: ['题目给出的已知条件', '需要求解的问题']
        },
        {
          step: 2,
          title: '分析思路',
          content: '根据题目信息，我们可以使用...方法来解决',
          keyPoints: ['适用的公式或定理', '解题的关键步骤']
        },
        {
          step: 3,
          title: '计算过程',
          content: '让我们一步一步进行计算...',
          formula: 'y = mx + b',
          calculation: '代入数值计算...'
        },
        {
          step: 4,
          title: '验证答案',
          content: '最后，我们要检查答案是否合理...',
          verification: '将答案代入原式验证'
        }
      ];

      res.json({
        success: true,
        message: '分步讲解生成成功',
        data: {
          steps,
          summary: '通过这4个步骤，我们成功解决了这道题。你学会了吗？',
          relatedKnowledge: ['一次函数', '斜率', '截距']
        }
      });
    } catch (error: any) {
      console.error('❌ 分步讲解失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '讲解失败',
      });
    }
  }
}

export const homeworkHelperController = new HomeworkHelperController();
export const uploadMiddleware = upload.single('image');
