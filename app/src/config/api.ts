// API配置
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
}

// API响应接口
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 请求配置接口
export interface RequestConfig extends RequestInit {
  timeout?: number
  params?: Record<string, string | number | boolean>
}

// 基础请求函数
export async function request<T = unknown>(
  endpoint: string,
  options: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { timeout = API_CONFIG.TIMEOUT, ...fetchOptions } = options

  const url = `${API_CONFIG.BASE_URL}${endpoint}`

  // 获取token
  const token = localStorage.getItem('token')

  // 设置默认headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  }

  // 创建超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // 处理响应
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || '请求失败',
        message: data.message || data.error || '请求失败',
      }
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: '请求超时',
          message: '请求超时',
        }
      }

      return {
        success: false,
        error: error.message || '网络错误',
        message: error.message || '网络错误',
      }
    }

    return {
      success: false,
      error: '未知错误',
      message: '未知错误',
    }
  }
}

// 便捷方法
export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestConfig) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, data?: unknown, options?: RequestConfig) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T = unknown>(endpoint: string, data?: unknown, options?: RequestConfig) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestConfig) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T = unknown>(endpoint: string, data?: unknown, options?: RequestConfig) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
