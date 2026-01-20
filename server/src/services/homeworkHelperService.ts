/**
 * AI作业助手服务
 * 处理题目上传、OCR识别、AI解答等核心业务逻辑
 */

import { query } from '../config/database';
import { getTencentOCRService } from './tencentOCRService';
import { aiService } from './aiService';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface UploadQuestionParams {
  userId: string;
  imageBuffer: Buffer;
  filename: string;
  questionType?: string;
  subject?: string;
  gradeLevel?: string;
}

interface QuestionAnalysis {
  questionId: string;
  ocrText: string;
  confidence: number;
  answer?: {
    answerId: string;
    answerText: string;
    explanation: string;
    steps: any[];
    knowledgePoints: string[];
  };
}

export class HomeworkHelperService {
  /**
   * 上传并识别题目
   */
  async uploadQuestion(params: UploadQuestionParams): Promise<QuestionAnalysis> {
    const { userId, imageBuffer, filename, questionType, subject, gradeLevel } = params;

    try {
      // 1. 保存图片
      const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
      const ext = path.extname(filename);
      const newFilename = `${imageHash}${ext}`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'homework');

      // 确保目录存在
      await fs.mkdir(uploadDir, { recursive: true });

      const imagePath = path.join(uploadDir, newFilename);
      const imageUrl = `/uploads/homework/${newFilename}`;

      await fs.writeFile(imagePath, imageBuffer);

      // 2. OCR识别
      const imageBase64 = imageBuffer.toString('base64');
      const ocrService = getTencentOCRService();
      const ocrResult = await ocrService.recognizeSmart(imageBase64, questionType);

      if (!ocrResult.success) {
        throw new Error(`OCR识别失败: ${ocrResult.error}`);
      }

      // 3. 保存题目到数据库
      const questionResult = await query(
        `INSERT INTO homework_questions
         (user_id, image_url, image_hash, ocr_text, ocr_confidence, question_type, subject, grade_level, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         RETURNING id`,
        [userId, imageUrl, imageHash, ocrResult.text, ocrResult.confidence, questionType || 'general', subject, gradeLevel]
      );

      const questionId = questionResult.rows[0].id;

      console.log(`✅ 题目上传成功: ${questionId}`);
      console.log(`📝 OCR识别文本: ${ocrResult.text.substring(0, 100)}...`);

      return {
        questionId,
        ocrText: ocrResult.text,
        confidence: ocrResult.confidence,
      };
    } catch (error: any) {
      console.error('❌ 上传题目失败:', error.message);
      throw error;
    }
  }

  /**
   * AI解答题目
   */
  async answerQuestion(questionId: string, userId: string): Promise<any> {
    try {
      // 1. 获取题目信息
      const questionResult = await query(
        'SELECT * FROM homework_questions WHERE id = $1 AND user_id = $2',
        [questionId, userId]
      );

      if (questionResult.rows.length === 0) {
        throw new Error('题目不存在');
      }

      const question = questionResult.rows[0];

      // 2. 构造AI提示词
      const prompt = this.buildAnswerPrompt(question);

      // 3. 调用AI服务
      const aiResponse = await aiService.chat({
        message: prompt,
        conversationId: `homework_${questionId}`,
        userId,
      });

      // 4. 解析AI响应
      const parsedAnswer = this.parseAIAnswer(aiResponse.message);

      // 5. 保存解答
      const answerResult = await query(
        `INSERT INTO homework_answers
         (question_id, answer_text, explanation, steps, knowledge_points, ai_provider, ai_model)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          questionId,
          parsedAnswer.answer,
          parsedAnswer.explanation,
          JSON.stringify(parsedAnswer.steps),
          JSON.stringify(parsedAnswer.knowledgePoints),
          'dify',
          'gpt-4',
        ]
      );

      const answerId = answerResult.rows[0].id;

      // 6. 更新题目状态
      await query(
        'UPDATE homework_questions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['answered', questionId]
      );

      console.log(`✅ AI解答完成: ${answerId}`);

      return {
        answerId,
        ...parsedAnswer,
      };
    } catch (error: any) {
      console.error('❌ AI解答失败:', error.message);
      throw error;
    }
  }

  /**
   * 构造AI解答提示词
   */
  private buildAnswerPrompt(question: any): string {
    const subject = question.subject || '未知学科';
    const gradeLevel = question.grade_level || '小学';

    return `你是一位专业的${subject}老师,正在辅导${gradeLevel}学生。

学生提出了以下题目:
${question.ocr_text}

请按以下格式详细解答:

**题目分析:**
(分析题目考察的知识点和解题思路)

**详细步骤:**
(一步一步展示解题过程,确保学生能理解每一步)

**答案:**
(最终答案)

**知识点总结:**
(列出相关知识点)

**温馨提示:**
(给学生的学习建议)

请用通俗易懂的语言,确保小学生能够理解。`;
  }

  /**
   * 解析AI响应
   */
  private parseAIAnswer(aiResponse: string): {
    answer: string;
    explanation: string;
    steps: string[];
    knowledgePoints: string[];
  } {
    // 简单的解析逻辑,可以根据实际AI响应格式调整
    const lines = aiResponse.split('\n');

    return {
      answer: aiResponse,
      explanation: aiResponse,
      steps: lines,
      knowledgePoints: [],
    };
  }

  /**
   * 获取用户的题目历史
   */
  async getQuestionHistory(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT
        q.id,
        q.image_url,
        q.ocr_text,
        q.question_type,
        q.subject,
        q.status,
        q.created_at,
        a.answer_text,
        a.id as answer_id
       FROM homework_questions q
       LEFT JOIN homework_answers a ON q.id = a.question_id
       WHERE q.user_id = $1
       ORDER BY q.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * 收藏题目
   */
  async favoriteQuestion(userId: string, questionId: string, tags?: string[], notes?: string) {
    await query(
      `INSERT INTO homework_favorites (user_id, question_id, tags, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, question_id) DO UPDATE SET tags = $3, notes = $4`,
      [userId, questionId, JSON.stringify(tags || []), notes]
    );

    console.log(`✅ 收藏题目: ${questionId}`);
  }

  /**
   * 获取收藏的题目
   */
  async getFavoriteQuestions(userId: string) {
    const result = await query(
      `SELECT
        q.id,
        q.image_url,
        q.ocr_text,
        q.question_type,
        q.subject,
        f.tags,
        f.notes,
        f.created_at as favorited_at
       FROM homework_favorites f
       JOIN homework_questions q ON f.question_id = q.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * 更新学习统计
   */
  async updateStatistics(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const stats = await query(
      `SELECT
        COUNT(*) as total_questions,
        COUNT(CASE WHEN status = 'answered' THEN 1 END) as solved_questions,
        AVG(ocr_confidence) as average_confidence
       FROM homework_questions
       WHERE user_id = $1 AND DATE(created_at) = $2`,
      [userId, today]
    );

    await query(
      `INSERT INTO homework_statistics (user_id, date, total_questions, solved_questions, average_confidence)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, date) DO UPDATE
       SET total_questions = $3, solved_questions = $4, average_confidence = $5, updated_at = CURRENT_TIMESTAMP`,
      [userId, today, stats.rows[0].total_questions, stats.rows[0].solved_questions, stats.rows[0].average_confidence]
    );
  }
}

export const homeworkHelperService = new HomeworkHelperService();
