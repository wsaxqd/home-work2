import { api } from '../../config/api'
import type {
  Work,
  CreateWorkRequest,
  Comment,
  CreateCommentRequest,
  PaginatedResponse,
  PaginationParams,
} from '../../types'

export const worksApi = {
  // 获取作品列表
  getWorks: (params?: PaginationParams & { type?: string; userId?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.type) queryParams.append('type', params.type)
    if (params?.userId) queryParams.append('userId', params.userId)

    const query = queryParams.toString()
    return api.get<PaginatedResponse<Work>>(`/works${query ? `?${query}` : ''}`)
  },

  // 获取单个作品详情
  getWork: (workId: string) =>
    api.get<Work>(`/works/${workId}`),

  // 创建作品
  createWork: (data: CreateWorkRequest) =>
    api.post<Work>('/works', data),

  // 更新作品
  updateWork: (workId: string, data: Partial<CreateWorkRequest>) =>
    api.put<Work>(`/works/${workId}`, data),

  // 删除作品
  deleteWork: (workId: string) =>
    api.delete(`/works/${workId}`),

  // 点赞作品
  likeWork: (workId: string) =>
    api.post(`/works/${workId}/like`),

  // 取消点赞
  unlikeWork: (workId: string) =>
    api.delete(`/works/${workId}/like`),

  // 获取作品评论
  getComments: (workId: string) =>
    api.get<Comment[]>(`/works/${workId}/comments`),

  // 添加评论
  addComment: (data: CreateCommentRequest) =>
    api.post<Comment>('/works/comments', data),

  // 删除评论
  deleteComment: (commentId: string) =>
    api.delete(`/works/comments/${commentId}`),

  // 获取我的作品
  getMyWorks: (params?: PaginationParams & { type?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.type) queryParams.append('type', params.type)

    const query = queryParams.toString()
    return api.get<PaginatedResponse<Work>>(`/works/my${query ? `?${query}` : ''}`)
  },

  // 获取收藏的作品
  getFavorites: (params?: PaginationParams) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const query = queryParams.toString()
    return api.get<PaginatedResponse<Work>>(`/works/favorites${query ? `?${query}` : ''}`)
  },
}
