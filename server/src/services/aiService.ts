import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import { difyAdapter } from './difyAdapter';
import { zhipuAdapter } from './zhipuAdapter';
import { deepseekAdapter } from './deepseekAdapter';
import { getTencentVoiceService } from './tencentVoiceService';
import { getTencentImageService } from './tencentImageService';
import path from 'path';
import fs from 'fs';

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
   * 获取 AI 适配器（优先使用 DeepSeek）
   */
  private getAdapter() {
    // 优先级: DeepSeek > 智谱 > Dify
    const useDeepSeek = process.env.DEEPSEEK_API_KEY && !process.env.DEEPSEEK_API_KEY.includes('your-');
    if (useDeepSeek) return deepseekAdapter;

    const useZhipu = process.env.ZHIPU_API_KEY && !process.env.ZHIPU_API_KEY.includes('your-');
    return useZhipu ? zhipuAdapter : difyAdapter;
  }

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
      // 使用适配器调用 AI API
      const adapter = this.getAdapter();
      const response = await adapter.chat(
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

      // 如果是 Dify 相关错误（未配置、认证失败、服务不可用等），使用模拟回复
      const shouldUseMock =
        error.message?.includes('未配置') ||
        error.message?.includes('invalid') ||
        error.statusCode === 401 ||
        error.statusCode === 500 ||
        error.statusCode === 503;

      if (shouldUseMock) {
        console.log('使用模拟回复功能');
        const mockReply = this.getMockChatReply(lastUserMessage.content);
        return {
          reply: mockReply,
          conversationId: conversationId || 'mock-conversation',
          messageId: `mock-${Date.now()}`,
        };
      }

      // 其他错误，返回友好的错误消息
      throw new AppError('AI助手暂时无法回复，请稍后再试', 500);
    }
  }

  /**
   * 获取模拟聊天回复（当AI服务不可用时使用）
   */
  private getMockChatReply(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('功能') || lowerMessage.includes('可以做什么')) {
      return '启蒙之光有很多有趣的功能呢！🌟\n\n' +
        '📝 AI创作工具：可以创作绘画、故事、诗歌和音乐\n' +
        '🎮 AI游戏：有7款益智游戏等你来玩\n' +
        '💝 心灵花园：记录你的心情日记\n' +
        '📊 成长档案：查看你的学习成果\n\n' +
        '你想试试哪个功能呢？';
    }

    if (lowerMessage.includes('游戏')) {
      return '我们有好多有趣的游戏！🎮\n\n' +
        '😊 表情识别 - 认识基本表情\n' +
        '🍎 水果连连看 - 锻炼记忆力\n' +
        '💎 水晶消消乐 - 消除挑战\n' +
        '🚀 坦克大战 - 射击游戏\n' +
        '♟️ 国际象棋 - 策略对弈\n' +
        '🀄 中国象棋 - 传统棋艺\n\n' +
        '快去游戏乐园试试吧！';
    }

    if (lowerMessage.includes('创作') || lowerMessage.includes('画画') || lowerMessage.includes('故事')) {
      return 'AI创作工具非常有趣！✨\n\n' +
        '你可以：\n' +
        '🎨 用AI绘画创作你想象的画面\n' +
        '📖 写属于自己的童话故事\n' +
        '🎵 创作动听的音乐\n' +
        '✍️ 写优美的诗歌\n\n' +
        '想试试哪一个呢？';
    }

    if (lowerMessage.includes('怎么用') || lowerMessage.includes('如何') || lowerMessage.includes('开始')) {
      return '使用很简单哦！😊\n\n' +
        '1️⃣ 在首页选择你想要的功能\n' +
        '2️⃣ 按照页面提示进行操作\n' +
        '3️⃣ 发挥你的创造力\n' +
        '4️⃣ 保存和分享你的作品\n\n' +
        '如果遇到问题，随时可以问我哦！';
    }

    // 默认回复
    return '你好！我是AI助手小启 🤖\n\n' +
      '你可以问我关于应用功能的问题，比如：\n' +
      '• 这个应用有哪些功能？\n' +
      '• 有什么游戏可以玩？\n' +
      '• 如何开始创作？\n\n' +
      '我很乐意帮助你！😊';
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
      // 使用适配器调用 AI API
      const adapter = this.getAdapter();
      const result = await adapter.generateStory(userId, prompt, options);

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
   * @param imageBase64 图像Base64编码（可选，与imageUrl二选一）
   */
  async recognizeImage(
    userId: string,
    imageUrl: string,
    taskType: 'object' | 'emotion' | 'scene',
    imageBase64?: string
  ) {
    try {
      // 使用腾讯云图像识别服务
      const imageService = getTencentImageService();

      // 调用对应的识别服务
      const result = await imageService.recognize(taskType, imageUrl, imageBase64);

      if (!result.success) {
        // 如果识别失败，返回友好的错误信息
        console.warn('Image recognition failed:', result.error);

        // 返回模拟数据作为降级方案
        const fallbackResponse = {
          objects: taskType === 'object' ? ['未识别'] : undefined,
          emotions: taskType === 'emotion' ? ['中性'] : undefined,
          scenes: taskType === 'scene' ? ['未知场景'] : undefined,
          confidence: 0,
          description: `图像识别暂时不可用：${result.error}`,
        };

        // 保存识别记录
        await query(
          `INSERT INTO ai_generations (user_id, generation_type, input_data, output_data)
           VALUES ($1, 'image_recognition', $2, $3)`,
          [userId, JSON.stringify({ imageUrl, taskType }), JSON.stringify(fallbackResponse)]
        );

        return fallbackResponse;
      }

      // 构建返回数据
      const response = {
        objects: result.objects,
        emotions: result.emotions,
        scenes: result.scenes,
        confidence: result.confidence,
        description: result.description,
        details: result.details,
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

      // 如果是配置错误，返回友好提示
      if (error.message?.includes('未配置')) {
        return {
          objects: taskType === 'object' ? ['示例对象'] : undefined,
          emotions: taskType === 'emotion' ? ['开心'] : undefined,
          scenes: taskType === 'scene' ? ['室内'] : undefined,
          confidence: 0,
          description: '图像识别功能需要配置腾讯云密钥，请联系管理员',
        };
      }

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
      // 使用适配器调用 AI API
      const adapter = this.getAdapter();
      const result = await adapter.analyzeEmotion(userId, text);

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
   * @param voiceUrl 语音文件URL或Base64编码
   * @param format 音频格式(mp3/wav/m4a等)
   */
  async speechToText(userId: string, voiceUrl: string, format: string = 'mp3') {
    try {
      // 使用腾讯云语音识别服务
      const voiceService = getTencentVoiceService();

      let result;
      // 判断是URL还是Base64
      if (voiceUrl.startsWith('http://') || voiceUrl.startsWith('https://')) {
        // 从URL识别
        result = await voiceService.speechToTextFromUrl(voiceUrl, format);
      } else {
        // Base64编码
        result = await voiceService.speechToText(voiceUrl, format);
      }

      if (!result.success) {
        throw new AppError(result.error || '语音识别失败', 500);
      }

      // 记录到数据库
      await query(
        `INSERT INTO ai_generations (user_id, generation_type, prompt, result, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, 'voice', voiceUrl.substring(0, 100), result.text]
      );

      return {
        text: result.text,
        duration: result.duration || 0,
      };
    } catch (error: any) {
      console.error('Speech to text error:', error);
      throw new AppError(error.message || '语音识别失败，请稍后再试', 500);
    }
  }

  /**
   * 文字转语音
   * @param userId 用户ID
   * @param text 文本内容
   * @param voiceType 语音类型(0-女声,1-男声,10-智瑜,11-智聆等)
   * @param saveToFile 是否保存为文件
   */
  async textToSpeech(userId: string, text: string, voiceType: number = 10, saveToFile: boolean = true) {
    try {
      // 使用腾讯云语音合成服务
      const voiceService = getTencentVoiceService();

      let result;
      if (saveToFile) {
        // 保存为文件
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const audioDir = path.join(uploadDir, 'audio');

        // 确保目录存在
        if (!fs.existsSync(audioDir)) {
          fs.mkdirSync(audioDir, { recursive: true });
        }

        const filename = `tts_${userId}_${Date.now()}.mp3`;
        const filepath = path.join(audioDir, filename);

        result = await voiceService.textToSpeechFile(text, filepath, voiceType);

        if (!result.success) {
          throw new AppError(result.error || '语音合成失败', 500);
        }

        // 返回相对URL
        const audioUrl = `/uploads/audio/${filename}`;

        // 记录到数据库
        await query(
          `INSERT INTO ai_generations (user_id, generation_type, prompt, result, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [userId, 'voice', text, audioUrl]
        );

        return {
          audioUrl,
          duration: result.duration || 0,
        };
      } else {
        // 返回Base64
        result = await voiceService.textToSpeech(text, voiceType);

        if (!result.success) {
          throw new AppError(result.error || '语音合成失败', 500);
        }

        return {
          audioBase64: result.audioBase64,
          duration: result.duration || 0,
        };
      }
    } catch (error: any) {
      console.error('Text to speech error:', error);
      throw new AppError(error.message || '语音合成失败，请稍后再试', 500);
    }
  }

  /**
   * 获取可用的语音类型列表
   */
  getVoiceTypes() {
    try {
      const voiceService = getTencentVoiceService();
      return voiceService.getVoiceTypes();
    } catch (error: any) {
      console.error('Get voice types error:', error);
      return [];
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
    const adapter = this.getAdapter();
    return await adapter.healthCheck();
  }
}

export const aiService = new AIService();
