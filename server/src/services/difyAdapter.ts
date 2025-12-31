import axios, { AxiosInstance } from 'axios';
import config from '../config';
import { AppError } from '../utils/errorHandler';

export interface DifyMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DifyChatRequest {
  query: string;
  user: string;
  conversation_id?: string;
  inputs?: Record<string, any>;
  response_mode?: 'blocking' | 'streaming';
}

export interface DifyChatResponse {
  answer: string;
  conversation_id: string;
  message_id: string;
  created_at: number;
}

export interface DifyCompletionRequest {
  inputs: Record<string, any>;
  user: string;
  response_mode?: 'blocking' | 'streaming';
}

export interface DifyCompletionResponse {
  answer: string;
  message_id: string;
  created_at: number;
}

/**
 * Dify API适配器
 * 封装Dify平台的API调用
 */
export class DifyAdapter {
  private client: AxiosInstance;
  private chatAppKey: string;
  private storyAppKey: string;
  private emotionAppKey: string;
  private tutoringAppKey: string;
  private tutoringEvaluateAppKey: string;
  private tutoringSummaryAppKey: string;

  constructor() {
    this.chatAppKey = config.dify.chatAppKey;
    this.storyAppKey = config.dify.storyAppKey;
    this.emotionAppKey = config.dify.emotionAppKey;
    this.tutoringAppKey = config.dify.tutoringAppKey;
    this.tutoringEvaluateAppKey = config.dify.tutoringEvaluateAppKey;
    this.tutoringSummaryAppKey = config.dify.tutoringSummaryAppKey;

    // 创建axios实例
    this.client = axios.create({
      baseURL: config.dify.apiUrl,
      timeout: config.dify.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 响应拦截器 - 统一错误处理
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.message || error.message || 'AI服务调用失败';
        throw new AppError(message, error.response?.status || 500);
      }
    );
  }

  /**
   * AI对话 - 多轮对话
   * @param userId 用户ID
   * @param query 用户问题
   * @param conversationId 会话ID（可选，传入则继续之前的会话）
   * @param inputs 额外输入参数
   */
  async chat(
    userId: string,
    query: string,
    conversationId?: string,
    inputs?: Record<string, any>
  ): Promise<DifyChatResponse> {
    if (!this.chatAppKey) {
      throw new AppError('Dify聊天应用未配置', 500);
    }

    const request: DifyChatRequest = {
      query,
      user: userId,
      response_mode: 'blocking',
      inputs: inputs || {},
    };

    if (conversationId) {
      request.conversation_id = conversationId;
    }

    try {
      const response = await this.client.post('/chat-messages', request, {
        headers: {
          Authorization: `Bearer ${this.chatAppKey}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Dify chat error:', error.message);
      throw error;
    }
  }

  /**
   * 文本生成（适合故事、诗歌等单次生成任务）
   * @param appKey 应用密钥
   * @param userId 用户ID
   * @param inputs 输入参数
   */
  async completion(
    appKey: string,
    userId: string,
    inputs: Record<string, any>
  ): Promise<DifyCompletionResponse> {
    if (!appKey) {
      throw new AppError('Dify应用密钥未配置', 500);
    }

    const request: DifyCompletionRequest = {
      inputs,
      user: userId,
      response_mode: 'blocking',
    };

    try {
      const response = await this.client.post('/completion-messages', request, {
        headers: {
          Authorization: `Bearer ${appKey}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Dify completion error:', error.message);
      throw error;
    }
  }

  /**
   * 生成故事
   * @param userId 用户ID
   * @param prompt 故事主题/提示
   * @param theme 风格主题
   * @param length 故事长度
   * @param style 写作风格
   */
  async generateStory(
    userId: string,
    prompt: string,
    options?: {
      theme?: string;
      length?: 'short' | 'medium' | 'long';
      style?: string;
    }
  ): Promise<{ story: string; title: string }> {
    const inputs = {
      prompt,
      theme: options?.theme || '童话',
      length: options?.length || 'medium',
      style: options?.style || '生动有趣',
    };

    const response = await this.completion(this.storyAppKey, userId, inputs);

    // 从返回结果中提取标题和内容
    // 注意：这里的解析逻辑需要根据Dify应用的实际输出格式调整
    const answer = response.answer;
    let title = '我的故事';
    let story = answer;

    // 尝试提取标题（假设格式为：标题：xxx\n内容...）
    const titleMatch = answer.match(/^(?:标题|Title)[:：]\s*(.+?)[\n\r]/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      story = answer.replace(titleMatch[0], '').trim();
    }

    return { story, title };
  }

  /**
   * 情感分析
   * @param userId 用户ID
   * @param text 待分析的文本
   */
  async analyzeEmotion(
    userId: string,
    text: string
  ): Promise<{
    emotion: string;
    confidence: number;
    suggestions: string[];
  }> {
    const inputs = {
      text,
    };

    const response = await this.completion(this.emotionAppKey, userId, inputs);

    // 解析情感分析结果
    // 注意：这里需要根据Dify应用的实际输出格式调整
    const answer = response.answer;

    // 简单解析（实际应该根据Dify返回的JSON格式解析）
    let emotion = 'neutral';
    let confidence = 0.5;
    let suggestions: string[] = [];

    try {
      // 尝试解析JSON格式的返回
      const parsed = JSON.parse(answer);
      emotion = parsed.emotion || emotion;
      confidence = parsed.confidence || confidence;
      suggestions = parsed.suggestions || [];
    } catch {
      // 如果不是JSON，进行简单的文本分析
      if (answer.includes('开心') || answer.includes('快乐') || answer.includes('happy')) {
        emotion = 'happy';
        confidence = 0.8;
      } else if (answer.includes('伤心') || answer.includes('难过') || answer.includes('sad')) {
        emotion = 'sad';
        confidence = 0.8;
      } else if (answer.includes('生气') || answer.includes('愤怒') || answer.includes('angry')) {
        emotion = 'angry';
        confidence = 0.8;
      } else if (answer.includes('焦虑') || answer.includes('担心') || answer.includes('anxious')) {
        emotion = 'anxious';
        confidence = 0.8;
      }

      suggestions = [answer];
    }

    return { emotion, confidence, suggestions };
  }

  /**
   * 获取会话历史
   * @param conversationId 会话ID
   * @param appKey 应用密钥
   */
  async getConversationHistory(
    conversationId: string,
    appKey: string
  ): Promise<any[]> {
    try {
      const response = await this.client.get(`/messages`, {
        headers: {
          Authorization: `Bearer ${appKey}`,
        },
        params: {
          conversation_id: conversationId,
          limit: 100,
        },
      });

      return response.data.data || [];
    } catch (error: any) {
      console.error('Get conversation history error:', error.message);
      return [];
    }
  }

  /**
   * 检查Dify服务健康状态
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 简单的健康检查 - 尝试调用一个轻量级接口
      await this.client.get('/');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取辅导应用密钥
   */
  getTutoringAppKey(): string {
    return this.tutoringAppKey;
  }

  /**
   * 获取辅导评估应用密钥
   */
  getTutoringEvaluateAppKey(): string {
    return this.tutoringEvaluateAppKey;
  }

  /**
   * 获取辅导总结应用密钥
   */
  getTutoringSummaryAppKey(): string {
    return this.tutoringSummaryAppKey;
  }
}

// 导出单例
export const difyAdapter = new DifyAdapter();
