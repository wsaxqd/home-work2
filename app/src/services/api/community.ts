import { api } from '../../config/api'
import type { Post, Topic, PaginatedResponse, PaginationParams } from '../../types'

export const communityApi = {
  // 获取社区动态列表
  getPosts: (params?: PaginationParams) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const query = queryParams.toString()
    return api.get<PaginatedResponse<Post>>(`/community/posts${query ? `?${query}` : ''}`)
  },

  // 获取单个动态
  getPost: (postId: string) =>
    api.get<Post>(`/community/posts/${postId}`),

  // 发布动态
  createPost: (content: string, images?: string[]) =>
    api.post<Post>('/community/posts', { content, images }),

  // 删除动态
  deletePost: (postId: string) =>
    api.delete(`/community/posts/${postId}`),

  // 点赞动态
  likePost: (postId: string) =>
    api.post(`/community/posts/${postId}/like`),

  // 取消点赞
  unlikePost: (postId: string) =>
    api.delete(`/community/posts/${postId}/like`),

  // 获取热门话题
  getTopics: () =>
    api.get<Topic[]>('/community/topics'),

  // 获取话题下的动态
  getTopicPosts: (topicId: string, params?: PaginationParams) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const query = queryParams.toString()
    return api.get<PaginatedResponse<Post>>(
      `/community/topics/${topicId}/posts${query ? `?${query}` : ''}`
    )
  },

  // 获取关注用户的动态
  getFollowingPosts: (params?: PaginationParams) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const query = queryParams.toString()
    return api.get<PaginatedResponse<Post>>(
      `/community/following${query ? `?${query}` : ''}`
    )
  },
}
