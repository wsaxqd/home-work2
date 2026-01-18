// 错误类型定义
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// 错误信息映射
const errorMessages: Record<string, string> = {
  'Network request failed': '网络连接失败，请检查网络设置',
  'Failed to fetch': '无法连接到服务器，请稍后重试',
  'Unauthorized': '登录已过期，请重新登录',
  'Forbidden': '没有权限访问此资源',
  'Not Found': '请求的资源不存在',
  'Internal Server Error': '服务器错误，请稍后重试',
  'Bad Request': '请求参数错误',
  'Timeout': '请求超时，请重试'
}

// 获取友好的错误消息
export function getFriendlyErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return errorMessages[error] || error
  }

  if (error?.message) {
    return errorMessages[error.message] || error.message
  }

  if (error?.error) {
    return errorMessages[error.error] || error.error
  }

  return '操作失败，请重试'
}
