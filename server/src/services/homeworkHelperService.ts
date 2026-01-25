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
    steps: string[];
    knowledgePoints: string[];
  };
}

interface AnswerResult {
  answerId: string;
  answer: string;
  explanation: string;
  steps: string[];
  knowledgePoints: string[];
}

interface QuestionHistoryItem {
  id: string;
  image_url: string;
  ocr_text: string;
  question_type: string;
  subject: string;
  status: string;
  created_at: Date;
  answer_text?: string;
  answer_id?: string;
}

interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

interface FavoriteQuestionItem {
  id: string;
  image_url: string;
  ocr_text: string;
  question_type: string;
  subject: string;
  tags: string[];
  notes: string;
  favorited_at: Date;
}

interface StatisticsResult {
  total_questions: number;
  solved_questions: number;
  average_confidence: number;
}

export class HomeworkHelperService {
  /**
   * 上传并识别题目
   */
  async uploadQuestion(params: UploadQuestionParams): Promise<QuestionAnalysis> {
    const { userId, imageBuffer, filename, questionType, subject, gradeLevel } = params;

    try {
      console.log(`📤 开始处理题目上传，用户ID: ${userId}, 文件名: ${filename}, 文件大小: ${imageBuffer.length} bytes`);
      
      // 1. 检查是否重复上传
      const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
      console.log(`🔍 生成图片哈希: ${imageHash}`);
      
      // 查询数据库中是否已存在相同哈希值的图片
      const existingQuestionResult = await query(
        `SELECT id, ocr_text, ocr_confidence 
         FROM homework_questions 
         WHERE image_hash = $1 AND user_id = $2`,
        [imageHash, userId]
      );

      if (existingQuestionResult.rows.length > 0) {
        // 已存在相同图片，直接返回已有结果
        const existingQuestion = existingQuestionResult.rows[0];
        console.log(`ℹ️ 发现重复上传的图片，返回已有结果: ${existingQuestion.id}`);
        
        // 检查是否已有答案
        const existingAnswerResult = await query(
          `SELECT id, answer_text, explanation, steps, knowledge_points 
           FROM homework_answers 
           WHERE question_id = $1`,
          [existingQuestion.id]
        );

        const result: QuestionAnalysis = {
          questionId: existingQuestion.id,
          ocrText: existingQuestion.ocr_text,
          confidence: existingQuestion.ocr_confidence,
        };

        // 如果已有答案，一起返回
        if (existingAnswerResult.rows.length > 0) {
          const existingAnswer = existingAnswerResult.rows[0];
          result.answer = {
            answerId: existingAnswer.id,
            answerText: existingAnswer.answer_text,
            explanation: existingAnswer.explanation,
            steps: JSON.parse(existingAnswer.steps || '[]'),
            knowledgePoints: JSON.parse(existingAnswer.knowledge_points || '[]'),
          };
          console.log(`ℹ️ 已找到对应答案: ${existingAnswer.id}`);
        }

        return result;
      }

      // 2. 保存图片
      const ext = path.extname(filename);
      const newFilename = `${imageHash}${ext}`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'homework');

      // 确保目录存在
      await fs.mkdir(uploadDir, { recursive: true });
      console.log(`📁 确保上传目录存在: ${uploadDir}`);

      const imagePath = path.join(uploadDir, newFilename);
      const imageUrl = `/uploads/homework/${newFilename}`;

      await fs.writeFile(imagePath, imageBuffer);
      console.log(`💾 图片保存成功: ${imagePath}`);

      // 3. OCR识别
      console.log(`🔍 开始OCR识别，题目类型: ${questionType || 'general'}`);
      const imageBase64 = imageBuffer.toString('base64');
      const ocrService = getTencentOCRService();
      const ocrResult = await ocrService.recognizeSmart(imageBase64, questionType);

      if (!ocrResult.success) {
        console.error(`❌ OCR识别失败: ${ocrResult.error}`);
        throw new Error(`OCR识别失败: ${ocrResult.error}`);
      }

      console.log(`📝 OCR识别成功，置信度: ${ocrResult.confidence}`);

      // 4. 保存题目到数据库
      console.log(`💾 开始保存题目到数据库`);
      const questionResult = await query(
        `INSERT INTO homework_questions
         (user_id, image_url, image_hash, ocr_text, ocr_confidence, question_type, subject, grade_level, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         RETURNING id`,
        [userId, imageUrl, imageHash, ocrResult.text, ocrResult.confidence, questionType || 'general', subject, gradeLevel]
      );

      const questionId = questionResult.rows[0].id;

      console.log(`✅ 题目上传成功: ${questionId}`);
      console.log(`� OCR识别文本预览: ${ocrResult.text.substring(0, 100)}${ocrResult.text.length > 100 ? '...' : ''}`);

      // 更新统计数据
      await this.updateStatistics(userId);
      console.log(`📊 已更新用户统计数据，用户ID: ${userId}`);

      return {
        questionId,
        ocrText: ocrResult.text,
        confidence: ocrResult.confidence,
      };
    } catch (error: any) {
      console.error(`❌ 上传题目失败，用户ID: ${userId}, 错误类型: ${error.name}, 错误详情:`, error);
      throw new Error(`题目上传失败: ${error.message}`);
    }
  }

  /**
   * AI解答题目
   */
  async answerQuestion(questionId: string, userId: string): Promise<AnswerResult> {
    try {
      console.log(`🤖 开始AI解答题目，题目ID: ${questionId}, 用户ID: ${userId}`);
      
      // 1. 获取题目信息
      console.log(`📄 获取题目信息，题目ID: ${questionId}`);
      const questionResult = await query(
        'SELECT * FROM homework_questions WHERE id = $1 AND user_id = $2',
        [questionId, userId]
      );

      if (questionResult.rows.length === 0) {
        console.error(`❌ 题目不存在或无权限访问，题目ID: ${questionId}, 用户ID: ${userId}`);
        throw new Error('题目不存在或无权限访问');
      }

      const question = questionResult.rows[0];
      console.log(`📄 成功获取题目信息，学科: ${question.subject || '未知'}, 年级: ${question.grade_level || '未知'}`);

      // 2. 构造AI提示词
      console.log(`📝 构造AI提示词`);
      const prompt = this.buildAnswerPrompt(question);

      // 3. 调用AI服务，添加重试机制
      let aiResponse;
      const maxRetries = 3;
      const retryDelay = 1000; // 1秒

      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          console.log(`🤖 调用AI服务 (${retry + 1}/${maxRetries})`);
          aiResponse = await aiService.chat(
            userId,
            [{ role: 'user', content: prompt }],
            { conversationId: `homework_${questionId}` }
          );
          console.log(`✅ AI服务调用成功`);
          break; // 调用成功，跳出循环
        } catch (error) {
          if (retry === maxRetries - 1) {
            // 最后一次重试失败，抛出错误
            console.error(`❌ AI服务调用失败，已重试${maxRetries}次:`, error);
            throw new Error(`AI服务调用失败，请稍后重试`);
          }
          // 等待一段时间后重试
          console.warn(`⚠️ AI服务调用失败，${retryDelay}ms后重试 (${retry + 1}/${maxRetries}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      // 4. 解析AI响应
      console.log(`📝 解析AI响应`);
      const parsedAnswer = this.parseAIAnswer(aiResponse.reply);
      console.log(`✅ 解析完成，提取到答案和步骤`);

      // 5. 保存解答
      // 从AI响应中获取提供商和模型信息，或者使用默认值
      const aiProvider = (aiResponse as any).provider || 'dify';
      const aiModel = (aiResponse as any).model || 'gpt-4';

      console.log(`💾 保存解答到数据库，AI提供商: ${aiProvider}, 模型: ${aiModel}`);
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
          aiProvider,
          aiModel,
        ]
      );

      const answerId = answerResult.rows[0].id;
      console.log(`✅ 解答保存成功，答案ID: ${answerId}`);

      // 6. 更新题目状态
      console.log(`📊 更新题目状态为已解答，题目ID: ${questionId}`);
      await query(
        'UPDATE homework_questions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['answered', questionId]
      );

      // 更新统计数据
      await this.updateStatistics(userId);
      console.log(`📊 已更新用户统计数据，用户ID: ${userId}`);

      console.log(`✅ AI解答完成: ${answerId}`);

      return {
        answerId,
        ...parsedAnswer,
      };
    } catch (error: any) {
      console.error(`❌ AI解答失败，题目ID: ${questionId}, 用户ID: ${userId}, 错误类型: ${error.name}, 错误详情:`, error);
      throw new Error(`AI解答失败: ${error.message}`);
    }
  }

  /**
   * 构造AI解答提示词
   */
  private buildAnswerPrompt(question: any): string {
    const subject = question.subject || '未知学科';
    const gradeLevel = question.grade_level || '小学';
    const questionType = question.question_type || 'general';

    // 根据不同学科和题目类型调整提示词
    let subjectSpecificInstructions = '';
    let questionTypeSpecificInstructions = '';

    // 学科特定指导
    switch (subject) {
      case '数学':
        subjectSpecificInstructions = '请注重数学公式的推导和计算过程，使用直观的方法解释数学概念。';
        break;
      case '语文':
        subjectSpecificInstructions = '请注重词语解释、语法分析和阅读理解，培养学生的语言表达能力。';
        break;
      case '英语':
        subjectSpecificInstructions = '请注重语法、词汇和句型结构，提供标准的发音和用法示例。';
        break;
      case '科学':
        subjectSpecificInstructions = '请注重科学原理和实验过程，培养学生的科学思维和探究能力。';
        break;
      default:
        subjectSpecificInstructions = '请根据学科特点提供专业的解答和指导。';
    }

    // 题目类型特定指导
    switch (questionType) {
      case '选择题':
        questionTypeSpecificInstructions = '请分析每个选项的正确性，说明错误选项的原因。';
        break;
      case '填空题':
        questionTypeSpecificInstructions = '请解释填空处的关键词和上下文关系，说明填写依据。';
        break;
      case '解答题':
        questionTypeSpecificInstructions = '请详细展示解题步骤，注重逻辑推导和方法讲解。';
        break;
      case '作文题':
        questionTypeSpecificInstructions = '请提供作文思路、结构框架和参考范文，注重写作技巧指导。';
        break;
      default:
        questionTypeSpecificInstructions = '请根据题目类型提供合适的解答方式。';
    }

    return `你是一位专业的${subject}老师,正在辅导${gradeLevel}学生。

学生提出了以下题目:
${question.ocr_text}

${subjectSpecificInstructions}
${questionTypeSpecificInstructions}

请按以下格式详细解答:

**题目分析:**
(分析题目考察的知识点和解题思路)

**详细步骤:**
(一步一步展示解题过程,确保学生能理解每一步)

**答案:**
(最终答案)

**知识点总结:**
(列出相关知识点,可以用数字编号)

**温馨提示:**
(给学生的学习建议,鼓励性语言)

请用通俗易懂的语言,确保${gradeLevel}学生能够理解。`;
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
    // 实现更准确的解析逻辑，根据提示词格式提取各个部分
    let answer = '';
    let explanation = '';
    let steps: string[] = [];
    let knowledgePoints: string[] = [];

    // 提取题目分析部分
    const analysisMatch = aiResponse.match(/\*\*题目分析:\*\*(.*?)(\*\*详细步骤:\*\*|$)/s);
    if (analysisMatch && analysisMatch[1]) {
      explanation = analysisMatch[1].trim();
    }

    // 提取详细步骤部分
    const stepsMatch = aiResponse.match(/\*\*详细步骤:\*\*(.*?)(\*\*答案:\*\*|$)/s);
    if (stepsMatch && stepsMatch[1]) {
      steps = stepsMatch[1]
        .trim()
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.trim());
    }

    // 提取答案部分
    const answerMatch = aiResponse.match(/\*\*答案:\*\*(.*?)(\*\*知识点总结:\*\*|$)/s);
    if (answerMatch && answerMatch[1]) {
      answer = answerMatch[1].trim();
    }

    // 提取知识点总结部分
    const knowledgeMatch = aiResponse.match(/\*\*知识点总结:\*\*(.*?)(\*\*温馨提示:\*\*|$)/s);
    if (knowledgeMatch && knowledgeMatch[1]) {
      knowledgePoints = knowledgeMatch[1]
        .trim()
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.trim());
    }

    // 如果没有匹配到，使用默认值
    if (!answer) {
      answer = aiResponse;
    }
    if (!explanation) {
      explanation = aiResponse;
    }
    if (steps.length === 0) {
      steps = aiResponse.split('\n').filter(line => line.trim() !== '');
    }

    return {
      answer,
      explanation,
      steps,
      knowledgePoints,
    };
  }

  /**
   * 获取用户的题目历史
   */
  async getQuestionHistory(userId: string, page = 1, limit = 20): Promise<PagedResult<QuestionHistoryItem>> {
    const offset = (page - 1) * limit;

    // 获取数据
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

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM homework_questions
       WHERE user_id = $1`,
      [userId]
    );

    const total = parseInt(countResult.rows[0].total, 10);

    return {
      items: result.rows as QuestionHistoryItem[],
      total,
      page,
      limit,
      hasNext: (page * limit) < total
    };
  }

  /**
   * 收藏题目
   */
  async favoriteQuestion(userId: string, questionId: string, tags?: string[], notes?: string): Promise<boolean> {
    // 验证题目是否存在且属于该用户
    const questionResult = await query(
      `SELECT id FROM homework_questions WHERE id = $1 AND user_id = $2`,
      [questionId, userId]
    );

    if (questionResult.rows.length === 0) {
      throw new Error('题目不存在或无权限访问');
    }

    await query(
      `INSERT INTO homework_favorites (user_id, question_id, tags, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, question_id) DO UPDATE SET tags = $3, notes = $4`,
      [userId, questionId, JSON.stringify(tags || []), notes]
    );

    console.log(`✅ 收藏题目: ${questionId}`);
    return true;
  }

  /**
   * 获取收藏的题目
   */
  async getFavoriteQuestions(userId: string): Promise<FavoriteQuestionItem[]> {
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

    // 解析tags字段
    const favoriteQuestions = result.rows.map(row => ({
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || []
    })) as FavoriteQuestionItem[];

    return favoriteQuestions;
  }

  /**
   * 更新学习统计
   */
  async updateStatistics(userId: string): Promise<void> {
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

  /**
   * 获取用户统计数据
   */
  async getStatistics(userId: string, date?: string): Promise<StatisticsResult> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
        COUNT(*) as total_questions,
        COUNT(CASE WHEN status = 'answered' THEN 1 END) as solved_questions,
        COALESCE(AVG(ocr_confidence), 0) as average_confidence
       FROM homework_questions
       WHERE user_id = $1 AND DATE(created_at) = $2`,
      [userId, targetDate]
    );

    return {
      total_questions: parseInt(result.rows[0].total_questions, 10),
      solved_questions: parseInt(result.rows[0].solved_questions, 10),
      average_confidence: parseFloat(result.rows[0].average_confidence)
    };
  }
}

export const homeworkHelperService = new HomeworkHelperService();
