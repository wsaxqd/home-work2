import { api } from '../../config/api'

export interface Chapter {
  id: number
  title: string
  content: string
  translation?: string
}

export interface Classic {
  id: string
  title: string
  author: string
  period: string
  cover: string
  color: string
  bgColor: string
  intro: string
  chapters: Chapter[]
  createdAt?: string
  updatedAt?: string
}

export interface ReadingProgress {
  classicId: string
  chapterId: number
  lastReadAt: string
}

export const encyclopediaApi = {
  // 获取经典列表
  getClassics: () =>
    api.get<{ items: Classic[]; total: number }>('/encyclopedia/classics'),

  // 获取经典详情
  getClassic: (classicId: string) =>
    api.get<Classic>(`/encyclopedia/classics/${classicId}`),

  // 记录阅读进度
  recordReading: (classicId: string, chapterId: number) =>
    api.post('/encyclopedia/classics/reading', { classicId, chapterId }),

  // 获取阅读进度
  getReadingProgress: () =>
    api.get<{ items: ReadingProgress[] }>('/encyclopedia/classics/reading'),

  // 获取推荐经典
  getRecommended: () =>
    api.get<{ items: Classic[] }>('/encyclopedia/classics/recommended'),
}
