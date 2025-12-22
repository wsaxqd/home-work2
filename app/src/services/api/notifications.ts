import { api } from '../../config/api'
import type { Notification, PaginatedResponse, PaginationParams } from '../../types'

export const notificationsApi = {
  // 获取通知列表
  getNotifications: (params?: PaginationParams & { unreadOnly?: boolean }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true')

    const query = queryParams.toString()
    return api.get<PaginatedResponse<Notification>>(`/notifications${query ? `?${query}` : ''}`)
  },

  // 标记通知为已读
  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`),

  // 标记所有通知为已读
  markAllAsRead: () =>
    api.put('/notifications/read-all'),

  // 删除通知
  deleteNotification: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),

  // 获取未读通知数量
  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),
}
