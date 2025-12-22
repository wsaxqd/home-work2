import { api } from '../../config/api'
import type { Diary, CreateDiaryRequest, PaginatedResponse, PaginationParams } from '../../types'

export const diaryApi = {
  // 获取日记列表
  getDiaries: (params?: PaginationParams) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const query = queryParams.toString()
    return api.get<PaginatedResponse<Diary>>(`/diary${query ? `?${query}` : ''}`)
  },

  // 获取单篇日记
  getDiary: (diaryId: string) =>
    api.get<Diary>(`/diary/${diaryId}`),

  // 创建日记
  createDiary: (data: CreateDiaryRequest) =>
    api.post<Diary>('/diary', data),

  // 更新日记
  updateDiary: (diaryId: string, data: Partial<CreateDiaryRequest>) =>
    api.put<Diary>(`/diary/${diaryId}`, data),

  // 删除日记
  deleteDiary: (diaryId: string) =>
    api.delete(`/diary/${diaryId}`),

  // 获取心情统计
  getMoodStats: (startDate?: string, endDate?: string) => {
    const queryParams = new URLSearchParams()
    if (startDate) queryParams.append('startDate', startDate)
    if (endDate) queryParams.append('endDate', endDate)

    const query = queryParams.toString()
    return api.get<Record<string, number>>(`/diary/stats/mood${query ? `?${query}` : ''}`)
  },
}
