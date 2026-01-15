import { api } from '../../config/api'

export interface DailyQuote {
  id: string
  text: string
  author: string
  date: string
}

export interface Story {
  id: string
  type: 'bedtime' | 'inspirational' | 'educational'
  title: string
  content: string
  duration?: string
  author?: string
  audioUrl?: string
  imageUrl?: string
  createdAt?: string
}

export interface PlayRecord {
  storyId: string
  playedAt: string
  duration: number
}

export const storiesApi = {
  // 获取每日一句
  getDailyQuote: () =>
    api.get<DailyQuote>('/stories/daily-quote'),

  // 获取睡前故事列表
  getBedtimeStories: (params?: { page?: number; limit?: number }) =>
    api.get<{ items: Story[]; total: number }>('/stories/bedtime', { params }),

  // 获取励志故事列表
  getInspirationalStories: (params?: { page?: number; limit?: number }) =>
    api.get<{ items: Story[]; total: number }>('/stories/inspirational', { params }),

  // 获取所有故事列表
  getAllStories: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get<{ items: Story[]; total: number }>('/stories', { params }),

  // 获取故事详情
  getStory: (storyId: string) =>
    api.get<Story>(`/stories/${storyId}`),

  // 记录播放
  recordPlay: (storyId: string, duration?: number) =>
    api.post('/stories/play', { storyId, duration }),

  // 获取推荐故事
  getRecommended: () =>
    api.get<{ items: Story[] }>('/stories/recommended'),

  // 获取播放历史
  getPlayHistory: () =>
    api.get<{ items: PlayRecord[] }>('/stories/history'),
}
