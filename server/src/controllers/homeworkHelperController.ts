/**
 * AI作业助手控制器
 * 支持小学和初中作业辅导
 */

import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { homeworkHelperService } from '../services/homeworkHelperService';
import { AIService } from '../services/aiService';
import { query } from '../config/database';
import multer from 'multer';
import path from 'path';

const aiService = new AIService();

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
  async uploadQuestion(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
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
  async answerQuestion(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
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
  async getHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
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
  async favoriteQuestion(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
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
  async getFavorites(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
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
  async socraticExplain(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
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

      // 调用AI服务生成回复
      let aiResponse: string;
      try {
        const messages = [
          ...conversationHistory,
          { role: 'user' as const, content: systemPrompt }
        ];

        const result = await aiService.chat(userId, messages, { conversationId: questionId });
        aiResponse = result.reply;
      } catch (error) {
        console.error('AI服务调用失败，使用默认回复:', error);
        // 如果AI服务失败，使用默认回复
        aiResponse = `这是一个很好的问题！在回答之前，我想先问你几个问题：

1. 你能先告诉我，这道题目主要考查的是什么知识点吗？
2. 你在解题时，第一步想到的是什么？
3. 是什么让你觉得困惑了呢？

别着急，慢慢思考，我们一起来解决这个问题！`;
      }

      // 保存对话记录到数据库
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: userQuestion },
        { role: 'assistant', content: aiResponse }
      ];

      await query(
        `INSERT INTO homework_conversations (user_id, question_id, conversation_history, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, question_id)
         DO UPDATE SET conversation_history = $3, updated_at = NOW()`,
        [userId, questionId || 'general', JSON.stringify(updatedHistory)]
      );

      res.json({
        success: true,
        message: 'AI讲解生成成功',
        data: {
          response: aiResponse,
          conversationHistory: updatedHistory
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
  async stepByStepExplain(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '请先登录',
        });
      }

      const { questionId } = req.params;

      // 获取题目信息并生成分步讲解
      let questionInfo: any = null;
      try {
        const result = await query(
          'SELECT * FROM questions WHERE id = $1',
          [questionId]
        );
        if (result.rows.length > 0) {
          questionInfo = result.rows[0];
        }
      } catch (error) {
        console.error('获取题目信息失败:', error);
      }

      // 构建分步讲解提示词
      const prompt = questionInfo
        ? `请为以下题目生成详细的分步讲解：

题目：${questionInfo.question_text}
科目：${questionInfo.subject}
难度：${questionInfo.difficulty}

要求：
1. 将解题过程分为4-6个清晰的步骤
2. 每个步骤包含：标题、详细说明、关键要点
3. 如果涉及计算，展示计算过程和公式
4. 最后提供答案验证方法
5. 列出相关知识点

请以JSON格式返回，包含steps数组和summary字段。`
        : `请生成一个通用的解题步骤模板，包含：理解题意、分析思路、计算过程、验证答案四个步骤。`;

      // 调用AI服务生成分步讲解
      let steps: any[];
      let summary: string;
      let relatedKnowledge: string[];

      try {
        const messages = [{ role: 'user' as const, content: prompt }];
        const result = await aiService.chat(userId, messages);

        // 尝试解析AI返回的JSON
        try {
          const parsed = JSON.parse(result.reply);
          steps = parsed.steps || [];
          summary = parsed.summary || '通过以上步骤，我们成功解决了这道题。';
          relatedKnowledge = parsed.relatedKnowledge || [];
        } catch {
          // 如果解析失败，使用默认结构
          steps = [
            {
              step: 1,
              title: '理解题意',
              content: result.reply.substring(0, 200),
              keyPoints: ['仔细阅读题目', '找出关键信息']
            }
          ];
          summary = '请仔细理解每个步骤的内容。';
          relatedKnowledge = questionInfo ? [questionInfo.subject] : [];
        }
      } catch (error) {
        console.error('AI服务调用失败，使用默认讲解:', error);
        // 使用默认的分步讲解
        steps = [
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
        summary = '通过这4个步骤，我们成功解决了这道题。你学会了吗？';
        relatedKnowledge = questionInfo ? [questionInfo.subject] : ['基础知识'];
      }

      res.json({
        success: true,
        message: '分步讲解生成成功',
        data: {
          steps,
          summary,
          relatedKnowledge
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
