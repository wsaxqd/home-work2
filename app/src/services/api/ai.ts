import { api } from '../../config/api'
import type { AIGenerateRequest, AIGenerateResponse } from '../../types'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  context?: any
}

export interface ChatResponse {
  response: string
  conversationId?: string
}

export const aiApi = {
  // AI对话
  chat: (data: ChatRequest) =>
    api.post<ChatResponse>('/ai/chat', data),

  // AI生成故事
  generateStory: (data: {
    prompt: string
    theme?: string
    characters?: string[]
    setting?: string
    style?: string
    length?: 'short' | 'medium' | 'long'
    age_group?: string
  }) =>
    api.post<{ story: string; title: string }>('/ai/story', data),

  // 图像识别
  recognizeImage: (imageUrl: string, taskType?: string) =>
    api.post<{ result: any }>('/ai/image/recognize', { imageUrl, taskType }),

  // 情感分析
  analyzeEmotion: (text: string) =>
    api.post<{ emotion: string; confidence: number }>('/ai/emotion/analyze', { text }),

  // 语音转文字
  speechToText: (voiceUrl: string) =>
    api.post<{ text: string }>('/ai/voice/to-text', { voiceUrl }),

  // 文字转语音
  textToSpeech: (text: string, voice?: string) =>
    api.post<{ audioUrl: string }>('/ai/voice/to-speech', { text, voice }),

  // 获取AI使用历史
  getHistory: (params?: { page?: number; limit?: number; taskType?: string }) =>
    api.get<{ items: any[]; total: number }>('/ai/history', { params }),

  // 获取AI使用统计
  getStats: () =>
    api.get<{ totalUsage: number; taskStats: any }>('/ai/stats'),

  // 获取对话上下文
  getConversationContext: (conversationId: string) =>
    api.get<{ context: any }>(`/ai/conversation/context?conversationId=${conversationId}`),

  // 清除对话上下文
  clearConversationContext: (conversationId: string) =>
    api.delete(`/ai/conversation/context?conversationId=${conversationId}`),

  // AI健康检查
  healthCheck: () =>
    api.get<{ status: string; message: string }>('/ai/health'),

  // AI生成内容（通用）
  generate: (data: AIGenerateRequest) =>
    api.post<AIGenerateResponse>('/ai/generate', data),

  // AI评价作品
  evaluateWork: (workId: string) =>
    api.post<{ score: number; feedback: string; suggestions: string[] }>(
      `/ai/evaluate/${workId}`
    ),
}
