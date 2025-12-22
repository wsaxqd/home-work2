// 导出所有API服务
export { authApi } from './auth'
export { userApi } from './user'
export { worksApi } from './works'
export { communityApi } from './community'
export { gamesApi } from './games'
export { diaryApi } from './diary'
export { assessmentApi } from './assessment'
export { notificationsApi } from './notifications'
export { aiApi } from './ai'
export { uploadApi } from './upload'

// 统一导出
export default {
  auth: authApi,
  user: userApi,
  works: worksApi,
  community: communityApi,
  games: gamesApi,
  diary: diaryApi,
  assessment: assessmentApi,
  notifications: notificationsApi,
  ai: aiApi,
  upload: uploadApi,
}

// 导出api工具
export { api } from '../../config/api'
