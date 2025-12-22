import { api } from '../../config/api'
import type { AIGenerateRequest, AIGenerateResponse } from '../../types'

export const aiApi = {
  // AI生成内容
  generate: (data: AIGenerateRequest) =>
    api.post<AIGenerateResponse>('/ai/generate', data),

  // AI生成故事
  generateStory: (prompt: string, options?: Record<string, any>) =>
    api.post<AIGenerateResponse>('/ai/generate/story', { prompt, options }),

  // AI生成诗歌
  generatePoem: (prompt: string, options?: Record<string, any>) =>
    api.post<AIGenerateResponse>('/ai/generate/poem', { prompt, options }),

  // AI生成图片描述
  generateArt: (prompt: string, options?: Record<string, any>) =>
    api.post<AIGenerateResponse>('/ai/generate/art', { prompt, options }),

  // AI生成音乐
  generateMusic: (prompt: string, options?: Record<string, any>) =>
    api.post<AIGenerateResponse>('/ai/generate/music', { prompt, options }),

  // AI对话
  chat: (message: string, context?: string[]) =>
    api.post<{ response: string }>('/ai/chat', { message, context }),

  // AI评价作品
  evaluateWork: (workId: string) =>
    api.post<{ score: number; feedback: string; suggestions: string[] }>(
      `/ai/evaluate/${workId}`
    ),
}
