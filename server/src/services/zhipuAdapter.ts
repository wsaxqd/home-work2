/**
 * 智谱 AI (GLM) 适配器
 * 官网: https://open.bigmodel.cn/
 */

import axios, { AxiosInstance } from 'axios';
import { AppError } from '../utils/errorHandler';

interface ZhipuConfig {
  apiKey: string;
  baseURL: string;
  timeout: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

interface ZhipuChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

interface ZhipuChatResponse {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ZhipuAdapter {
  private client: AxiosInstance;
  private config: ZhipuConfig;

  constructor() {
    this.config = {
      apiKey: process.env.ZHIPU_API_KEY || '',
      baseURL: process.env.ZHIPU_API_URL || 'https://open.bigmodel.cn/api/paas/v4',
      timeout: parseInt(process.env.ZHIPU_TIMEOUT || '30000')
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });
  }

  /**
   * 聊天对话
   */
  async chat(
    userId: string,
    message: string,
    conversationId?: string,
    context?: Record<string, any>
  ) {
    if (!this.config.apiKey || this.config.apiKey.includes('your-')) {
      throw new AppError('智谱 AI 未配置', 401);
    }

    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: '你是一个温暖、友善的AI助手，名叫"小启"。你的任务是陪伴6-12岁的儿童，提供情感支持和鼓励。使用简单、易懂的语言，充满耐心和爱心。每次回复控制在2-3句话，使用温暖、友好的语气。'
        },
        {
          role: 'user',
          content: message
        }
      ];

      const response = await this.client.post<ZhipuChatResponse>('/chat/completions', {
        model: 'glm-4-flash',
        messages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 500
      });

      return {
        answer: response.data.choices[0].message.content,
        conversation_id: conversationId || `zhipu-${Date.now()}`,
        message_id: response.data.id
      };
    } catch (error: any) {
      console.error('Zhipu chat error:', error.response?.data || error.message);
      throw new AppError(error.response?.data?.error?.message || '智谱 AI 调用失败', error.response?.status || 500);
    }
  }

  /**
   * 生成故事
   */
  async generateStory(
    userId: string,
    prompt: string,
    options?: { theme?: string; length?: string; style?: string }
  ) {
    if (!this.config.apiKey || this.config.apiKey.includes('your-')) {
      throw new AppError('智谱 AI 未配置', 401);
    }

    try {
      const lengthMap: Record<string, string> = {
        short: '200-300字',
        medium: '400-600字',
        long: '800-1000字'
      };

      const lengthText = lengthMap[options?.length || 'medium'] || '400-600字';

      const systemPrompt = `你是一个儿童故事创作专家。请根据用户的要求创作一个适合6-12岁儿童阅读的故事。

要求：
- 故事要有教育意义
- 语言简单易懂
- 情节生动有趣
- 传递正能量
- 长度约${lengthText}

请直接输出故事内容，包含标题。`;

      const userPrompt = `主题：${prompt}${options?.theme ? `\n风格：${options.theme}` : ''}${options?.style ? `\n特点：${options.style}` : ''}`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const response = await this.client.post<ZhipuChatResponse>('/chat/completions', {
        model: 'glm-4-flash',
        messages,
        temperature: 0.8,
        max_tokens: 1500
      });

      const content = response.data.choices[0].message.content;
      const lines = content.split('\n');
      const title = lines[0].replace(/^#+\s*/, '').trim();
      const story = lines.slice(1).join('\n').trim();

      return { story: story || content, title };
    } catch (error: any) {
      console.error('Zhipu story generation error:', error.response?.data || error.message);
      throw new AppError('故事生成失败', error.response?.status || 500);
    }
  }

  /**
   * 情感分析
   */
  async analyzeEmotion(userId: string, text: string) {
    if (!this.config.apiKey || this.config.apiKey.includes('your-')) {
      throw new AppError('智谱 AI 未配置', 401);
    }

    try {
      const systemPrompt = `你是一个儿童情感分析专家。请分析以下文本中表达的情感，并给出温暖的回应建议。

请以 JSON 格式返回：
{
  "emotion": "情感类型（happy/sad/angry/worried/excited/calm）",
  "confidence": 0.95,
  "suggestions": ["建议1", "建议2"]
}

要求：
- 准确识别情感
- 给出适合儿童的温暖建议
- 建议要具体、可行`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ];

      const response = await this.client.post<ZhipuChatResponse>('/chat/completions', {
        model: 'glm-4-flash',
        messages,
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result;
      }

      return {
        emotion: 'calm',
        confidence: 0.8,
        suggestions: ['继续保持积极的心态', '有任何困扰都可以和我聊聊']
      };
    } catch (error: any) {
      console.error('Zhipu emotion analysis error:', error.response?.data || error.message);
      throw new AppError('情感分析失败', error.response?.status || 500);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    if (!this.config.apiKey || this.config.apiKey.includes('your-')) {
      return false;
    }

    try {
      await this.client.post('/chat/completions', {
        model: 'glm-4-flash',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 10
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const zhipuAdapter = new ZhipuAdapter();
