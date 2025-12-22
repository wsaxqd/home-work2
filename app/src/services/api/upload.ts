import { API_CONFIG } from '../../config/api'
import type { UploadResponse } from '../../types'

export const uploadApi = {
  // 上传文件
  uploadFile: async (file: File): Promise<{ success: boolean; data?: UploadResponse; error?: string }> => {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || '上传失败',
        }
      }

      return {
        success: true,
        data: data.data || data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '上传失败',
      }
    }
  },

  // 上传多个文件
  uploadFiles: async (files: File[]): Promise<{ success: boolean; data?: UploadResponse[]; error?: string }> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/multiple`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || '上传失败',
        }
      }

      return {
        success: true,
        data: data.data || data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '上传失败',
      }
    }
  },

  // 删除文件
  deleteFile: async (filename: string): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/upload/${filename}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || '删除失败',
        }
      }

      return {
        success: true,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '删除失败',
      }
    }
  },
}
