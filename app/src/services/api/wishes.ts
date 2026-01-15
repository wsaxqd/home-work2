import { api } from '../../config/api'

export interface Wish {
  id: string
  userId: string
  content: string
  category: 'study' | 'toy' | 'family' | 'friend' | 'other'
  status: 'pending' | 'fulfilled'
  createdAt: string
  updatedAt: string
  fulfilledAt?: string
}

export interface CreateWishRequest {
  content: string
  category: string
}

export interface UpdateWishRequest {
  content?: string
  category?: string
  status?: 'pending' | 'fulfilled'
}

export const wishesApi = {
  // 获取心愿列表
  getWishes: (params?: { status?: string; category?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.category) queryParams.append('category', params.category)

    const query = queryParams.toString()
    return api.get<{ items: Wish[]; total: number }>(`/wishes${query ? `?${query}` : ''}`)
  },

  // 获取单个心愿
  getWish: (wishId: string) =>
    api.get<Wish>(`/wishes/${wishId}`),

  // 创建心愿
  createWish: (data: CreateWishRequest) =>
    api.post<Wish>('/wishes', data),

  // 更新心愿
  updateWish: (wishId: string, data: UpdateWishRequest) =>
    api.put<Wish>(`/wishes/${wishId}`, data),

  // 删除心愿
  deleteWish: (wishId: string) =>
    api.delete(`/wishes/${wishId}`),

  // 实现心愿
  fulfillWish: (wishId: string) =>
    api.put<Wish>(`/wishes/${wishId}`, { status: 'fulfilled' }),

  // 获取心愿统计
  getStats: () =>
    api.get<{ total: number; pending: number; fulfilled: number; byCategory: Record<string, number> }>('/wishes/stats'),
}
