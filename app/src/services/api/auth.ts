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

  // 发送短信验证码
  sendSMSCode: (phone: string, purpose: string = 'login') =>
    api.post('/auth/send-sms-code', { phone, purpose }),

  // 手机号验证码登录
  phoneLogin: (data: { phone: string; code: string }) =>
    api.post<AuthResponse>('/auth/phone-login', data),

  // 发起密码找回
  forgotPassword: (contact: string, method: 'phone' | 'email') =>
    api.post('/auth/forgot-password', { contact, method }),

  // 验证重置码
  verifyResetCode: (contact: string, code: string, method: 'phone' | 'email') =>
    api.post<{ resetToken: string }>('/auth/verify-reset-code', { contact, code, method }),

  // 重置密码
  resetPassword: (resetToken: string, newPassword: string) =>
    api.post('/auth/reset-password', { resetToken, newPassword }),

  // 绑定手机号
  bindPhone: (phone: string, code: string) =>
    api.post('/users/bind-phone', { phone, code }),

  // 绑定邮箱
  bindEmail: (email: string, code: string) =>
    api.post('/users/bind-email', { email, code }),
}
