import { api } from '../../config/api'
import type { UserProfile, User, PaginatedResponse, Follow } from '../../types'

export const userApi = {
  // 获取用户信息
  getUser: (userId: string) =>
    api.get<UserProfile>(`/users/${userId}`),

  // 更新用户信息
  updateUser: (userId: string, data: Partial<User>) =>
    api.put<User>(`/users/${userId}`, data),

  // 获取用户的关注列表
  getFollowing: (userId: string) =>
    api.get<PaginatedResponse<User>>(`/users/${userId}/following`),

  // 获取用户的粉丝列表
  getFollowers: (userId: string) =>
    api.get<PaginatedResponse<User>>(`/users/${userId}/followers`),

  // 关注用户
  followUser: (userId: string) =>
    api.post<Follow>(`/users/${userId}/follow`),

  // 取消关注
  unfollowUser: (userId: string) =>
    api.delete(`/users/${userId}/follow`),

  // 搜索用户
  searchUsers: (keyword: string) =>
    api.get<User[]>(`/users/search?q=${encodeURIComponent(keyword)}`),

  // 获取推荐用户
  getRecommendedUsers: () =>
    api.get<User[]>('/users/recommended'),
}
