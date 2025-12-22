import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

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
  // AI对话
  async chat(userId: string, messages: ChatMessage[], context?: Record<string, any>) {
    // 保存对话记录
    await this.saveConversation(userId, 'chat', messages);

    // 这里是AI调用的占位符，实际需要对接具体的AI服务
    // 如：OpenAI、百度文心一言、讯飞星火等
    const response = await this.callAIService('chat', { messages, context });

    return {
      reply: response.content,
      conversationId: response.conversationId,
    };
  }

  // AI生成故事
  async generateStory(userId: string, prompt: string, options?: {
    theme?: string;
    length?: 'short' | 'medium' | 'long';
    style?: string;
  }) {
    const fullPrompt = this.buildStoryPrompt(prompt, options);

    const response = await this.callAIService('story', { prompt: fullPrompt });

    // 保存生成记录
    await query(
      `INSERT INTO ai_generations (user_id, task_type, prompt, result)
       VALUES ($1, 'story', $2, $3)`,
      [userId, prompt, response.content]
    );

    return {
      story: response.content,
      title: response.title || '我的故事',
    };
  }

  // 图像识别
  async recognizeImage(userId: string, imageUrl: string, taskType: 'object' | 'emotion' | 'scene') {
    const response = await this.callAIService('image_recognition', {
      imageUrl,
      taskType,
    });

    // 保存识别记录
    await query(
      `INSERT INTO ai_generations (user_id, task_type, prompt, result)
       VALUES ($1, 'image_recognition', $2, $3)`,
      [userId, imageUrl, JSON.stringify(response)]
    );

    return response;
  }

  // 情感分析
  async analyzeEmotion(userId: string, text: string) {
    const response = await this.callAIService('emotion_analysis', { text });

    return {
      emotion: response.emotion,
      confidence: response.confidence,
      suggestions: response.suggestions,
    };
  }

  // 语音转文字
  async speechToText(userId: string, voiceUrl: string) {
    const response = await this.callAIService('voice', {
      voiceUrl,
      direction: 'speech_to_text',
    });

    return {
      text: response.text,
      duration: response.duration,
    };
  }

  // 文字转语音
  async textToSpeech(userId: string, text: string, voice?: string) {
    const response = await this.callAIService('voice', {
      text,
      voice: voice || 'default',
      direction: 'text_to_speech',
    });

    return {
      audioUrl: response.audioUrl,
      duration: response.duration,
    };
  }

  // 获取AI使用历史
  async getHistory(userId: string, taskType?: AITaskType, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (taskType) {
      whereClause += ` AND task_type = $${paramIndex++}`;
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

  // 获取AI使用统计
  async getUsageStats(userId: string) {
    const result = await query(
      `SELECT task_type, COUNT(*) as count
       FROM ai_generations
       WHERE user_id = $1
       GROUP BY task_type`,
      [userId]
    );

    const totalResult = await query(
      'SELECT COUNT(*) FROM ai_generations WHERE user_id = $1',
      [userId]
    );

    const stats: Record<string, number> = {};
    for (const row of result.rows) {
      stats[row.task_type] = parseInt(row.count);
    }

    return {
      total: parseInt(totalResult.rows[0].count),
      byType: stats,
    };
  }

  // 保存对话记录
  private async saveConversation(userId: string, taskType: AITaskType, messages: ChatMessage[]) {
    await query(
      `INSERT INTO ai_conversations (user_id, task_type, messages)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, task_type)
       DO UPDATE SET messages = $3, updated_at = CURRENT_TIMESTAMP`,
      [userId, taskType, JSON.stringify(messages)]
    );
  }

  // 构建故事生成提示词
  private buildStoryPrompt(prompt: string, options?: {
    theme?: string;
    length?: 'short' | 'medium' | 'long';
    style?: string;
  }): string {
    let fullPrompt = `请为儿童创作一个有趣的故事。\n主题：${prompt}`;

    if (options?.theme) {
      fullPrompt += `\n风格主题：${options.theme}`;
    }
    if (options?.length) {
      const lengthMap = { short: '200字左右', medium: '500字左右', long: '1000字左右' };
      fullPrompt += `\n长度要求：${lengthMap[options.length]}`;
    }
    if (options?.style) {
      fullPrompt += `\n写作风格：${options.style}`;
    }

    fullPrompt += '\n\n请确保故事内容积极向上，适合儿童阅读。';

    return fullPrompt;
  }

  // AI服务调用（占位符，需要对接实际AI服务）
  private async callAIService(taskType: string, params: any): Promise<any> {
    // TODO: 对接实际的AI服务
    // 这里返回模拟数据，实际使用时需要替换为真实的AI调用

    switch (taskType) {
      case 'chat':
        return {
          content: '你好！我是AI小助手，很高兴认识你！有什么我可以帮助你的吗？',
          conversationId: Date.now().toString(),
        };

      case 'story':
        return {
          content: '从前，在一个美丽的森林里，住着一只善良的小兔子...',
          title: '森林里的小兔子',
        };

      case 'image_recognition':
        return {
          objects: ['示例对象'],
          confidence: 0.95,
          description: '这是一张示例图片',
        };

      case 'emotion_analysis':
        return {
          emotion: 'happy',
          confidence: 0.85,
          suggestions: ['保持积极的心态！'],
        };

      case 'voice':
        if (params.direction === 'speech_to_text') {
          return {
            text: '这是识别出的文字',
            duration: 5,
          };
        } else {
          return {
            audioUrl: '/audio/generated.mp3',
            duration: 3,
          };
        }

      default:
        throw new AppError('不支持的AI任务类型', 400);
    }
  }
}

export const aiService = new AIService();
