import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import { difyAdapter } from './difyAdapter';

export type AITaskType = 'story' | 'chat' | 'voice' | 'image_recognition' | 'emotion_analysis';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequestInput {
  taskType: AITaskType;
  prompt?: string;
  messages?: ChatMessage[];
  imageUrl?: string;
  voiceUrl?: string;
  context?: Record<string, any>;
}

export class AIService {
  /**
   * AI对话
   * @param userId 用户ID
   * @param messages 对话消息列表
   * @param context 上下文信息（如会话ID）
   */
  async chat(userId: string, messages: ChatMessage[], context?: Record<string, any>) {
    // 获取最后一条用户消息
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    if (!lastUserMessage) {
      throw new AppError('请提供有效的对话消息', 400);
    }

    // 从上下文中获取会话ID
    const conversationId = context?.conversationId;

    try {
      // 调用Dify对话API
      const response = await difyAdapter.chat(
        userId,
        lastUserMessage.content,
        conversationId,
        context
      );

      // 保存对话记录
      const updatedMessages = [
        ...messages,
        {
          role: 'assistant' as const,
          content: response.answer,
        },
      ];

      await this.saveConversation(userId, 'chat', updatedMessages, response.conversation_id);

      return {
        reply: response.answer,
        conversationId: response.conversation_id,
        messageId: response.message_id,
      };
    } catch (error: any) {
      console.error('AI chat error:', error);
      // 如果Dify调用失败，返回友好的错误消息
      throw new AppError('AI助手暂时无法回复，请稍后再试', 500);
    }
  }

  /**
   * AI生成故事
   * @param userId 用户ID
   * @param prompt 故事主题/提示
   * @param options 生成选项
   */
  async generateStory(userId: string, prompt: string, options?: {
    theme?: string;
    length?: 'short' | 'medium' | 'long';
    style?: string;
  }) {
    try {
      // 调用Dify故事生成API
      const result = await difyAdapter.generateStory(userId, prompt, options);

      // 保存生成记录
      await query(
        `INSERT INTO ai_generations (user_id, generation_type, input_data, output_data)
         VALUES ($1, 'story', $2, $3)`,
        [userId, JSON.stringify({ prompt, theme: options?.theme, length: options?.length, style: options?.style }), result.story]
      );

      return {
        story: result.story,
        title: result.title,
      };
    } catch (error: any) {
      console.error('Generate story error:', error);
      throw new AppError('故事生成失败，请稍后再试', 500);
    }
  }

  /**
   * 图像识别
   * @param userId 用户ID
   * @param imageUrl 图像URL
   * @param taskType 识别类型
   */
  async recognizeImage(userId: string, imageUrl: string, taskType: 'object' | 'emotion' | 'scene') {
    try {
      // TODO: 这里需要根据Dify是否支持图像识别来实现
      // 如果Dify不支持，可以对接其他视觉AI服务（如百度AI、腾讯AI等）

      // 临时返回模拟数据
      const response = {
        objects: ['示例对象'],
        confidence: 0.95,
        description: '图像识别功能开发中，敬请期待',
      };

      // 保存识别记录
      await query(
        `INSERT INTO ai_generations (user_id, generation_type, input_data, output_data)
         VALUES ($1, 'image_recognition', $2, $3)`,
        [userId, JSON.stringify({ imageUrl, taskType }), JSON.stringify(response)]
      );

      return response;
    } catch (error: any) {
      console.error('Image recognition error:', error);
      throw new AppError('图像识别失败，请稍后再试', 500);
    }
  }

  /**
   * 情感分析
   * @param userId 用户ID
   * @param text 待分析的文本
   */
  async analyzeEmotion(userId: string, text: string) {
    try {
      // 调用Dify情感分析API
      const result = await difyAdapter.analyzeEmotion(userId, text);

      // 保存分析记录
      await query(
        `INSERT INTO ai_generations (user_id, generation_type, input_data, output_data)
         VALUES ($1, 'emotion_analysis', $2, $3)`,
        [userId, JSON.stringify({ text }), JSON.stringify(result)]
      );

      return {
        emotion: result.emotion,
        confidence: result.confidence,
        suggestions: result.suggestions,
      };
    } catch (error: any) {
      console.error('Emotion analysis error:', error);
      throw new AppError('情感分析失败，请稍后再试', 500);
    }
  }

  /**
   * 语音转文字
   * @param userId 用户ID
   * @param voiceUrl 语音文件URL
   */
  async speechToText(userId: string, voiceUrl: string) {
    try {
      // TODO: 对接语音识别服务（如百度语音、讯飞等）
      // Dify可能不支持语音识别，需要单独对接

      const response = {
        text: '语音识别功能开发中，敬请期待',
        duration: 5,
      };

      return response;
    } catch (error: any) {
      console.error('Speech to text error:', error);
      throw new AppError('语音识别失败，请稍后再试', 500);
    }
  }

  /**
   * 文字转语音
   * @param userId 用户ID
   * @param text 文本内容
   * @param voice 语音类型
   */
  async textToSpeech(userId: string, text: string, voice?: string) {
    try {
      // TODO: 对接语音合成服务（如百度TTS、讯飞等）

      const response = {
        audioUrl: '/audio/generated.mp3',
        duration: 3,
      };

      return response;
    } catch (error: any) {
      console.error('Text to speech error:', error);
      throw new AppError('语音合成失败，请稍后再试', 500);
    }
  }

  /**
   * 获取AI使用历史
   * @param userId 用户ID
   * @param taskType 任务类型
   * @param page 页码
   * @param pageSize 每页数量
   */
  async getHistory(userId: string, taskType?: AITaskType, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (taskType) {
      whereClause += ` AND generation_type = $${paramIndex++}`;
      params.push(taskType);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM ai_generations ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(pageSize, offset);
    const result = await query(
      `SELECT * FROM ai_generations ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return {
      list: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取AI使用统计
   * @param userId 用户ID
   */
  async getUsageStats(userId: string) {
    const result = await query(
      `SELECT generation_type, COUNT(*) as count
       FROM ai_generations
       WHERE user_id = $1
       GROUP BY generation_type`,
      [userId]
    );

    const totalResult = await query(
      'SELECT COUNT(*) FROM ai_generations WHERE user_id = $1',
      [userId]
    );

    const stats: Record<string, number> = {};
    for (const row of result.rows) {
      stats[row.generation_type] = parseInt(row.count);
    }

    return {
      total: parseInt(totalResult.rows[0].count),
      byType: stats,
    };
  }

  /**
   * 保存对话记录
   * @param userId 用户ID
   * @param taskType 任务类型
   * @param messages 消息列表
   * @param conversationId 会话ID
   */
  private async saveConversation(
    userId: string,
    taskType: AITaskType,
    messages: ChatMessage[],
    conversationId?: string
  ) {
    await query(
      `INSERT INTO ai_conversations (user_id, task_type, messages, conversation_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, task_type)
       DO UPDATE SET
         messages = $3,
         conversation_id = $4,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, taskType, JSON.stringify(messages), conversationId || null]
    );
  }

  /**
   * 获取用户的对话上下文
   * @param userId 用户ID
   * @param taskType 任务类型
   */
  async getConversationContext(userId: string, taskType: AITaskType = 'chat') {
    const result = await query(
      `SELECT messages, conversation_id FROM ai_conversations
       WHERE user_id = $1 AND task_type = $2`,
      [userId, taskType]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      messages: result.rows[0].messages,
      conversationId: result.rows[0].conversation_id,
    };
  }

  /**
   * 清除用户的对话上下文
   * @param userId 用户ID
   * @param taskType 任务类型
   */
  async clearConversationContext(userId: string, taskType: AITaskType = 'chat') {
    await query(
      `DELETE FROM ai_conversations WHERE user_id = $1 AND task_type = $2`,
      [userId, taskType]
    );
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    return await difyAdapter.healthCheck();
  }
}

export const aiService = new AIService();
