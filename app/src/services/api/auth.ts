import { api } from '../../config/api'
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '../../types'

export const authApi = {
  // 用户注册
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  // 用户登录
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  // 获取当前用户信息
  getCurrentUser: () =>
    api.get<User>('/auth/me'),

  // 刷新Token
  refreshToken: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),

  // 登出
  logout: () =>
    api.post('/auth/logout'),

  // 修改密码
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),

  // 发送邮箱验证码
  sendEmailVerifyCode: (data: { email: string }) =>
    api.post('/auth/send-email-code', data),

  // 邮箱验证码登录
  emailLogin: (data: { email: string; code: string }) =>
    api.post<AuthResponse>('/auth/email-login', data),
}
