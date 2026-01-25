// AI图像生成服务适配器
// 支持多种图像生成API（DeepSeek、OpenAI DALL-E等）

interface ImageGenerationOptions {
  prompt: string
  style?: string
  size?: '256x256' | '512x512' | '1024x1024'
  n?: number
}

interface ImageGenerationResult {
  success: boolean
  imageUrl?: string
  error?: string
}

class ImageGenerationService {
  private baseUrl: string

  constructor() {
    this.baseUrl = 'http://localhost:3000/api'
  }

  /**
   * 生成AI图像
   * @param options 生成选项
   * @returns 图像URL
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      const token = localStorage.getItem('token')

      // 构建完整的提示词（包含风格信息）
      const fullPrompt = this.buildPrompt(options.prompt, options.style)

      const response = await fetch(`${this.baseUrl}/ai/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          size: options.size || '512x512',
          n: options.n || 1
        })
      })

      const data = await response.json()

      if (data.success && data.data?.imageUrl) {
        return {
          success: true,
          imageUrl: data.data.imageUrl
        }
      } else {
        return {
          success: false,
          error: data.message || '生成图像失败'
        }
      }
    } catch (error) {
      console.error('Image generation error:', error)
      return {
        success: false,
        error: '网络错误，请稍后重试'
      }
    }
  }

  /**
   * 构建完整的提示词
   * @param prompt 用户输入的提示词
   * @param style 风格类型
   * @returns 完整的提示词
   */
  private buildPrompt(prompt: string, style?: string): string {
    const stylePrompts: { [key: string]: string } = {
      'cartoon': '卡通风格，色彩鲜艳，线条简洁，儿童友好',
      'watercolor': '水彩画风格，柔和渐变，艺术感强',
      'sketch': '素描风格，黑白线条，简约优雅',
      'fantasy': '梦幻风格，奇幻色彩，充满想象力'
    }

    const stylePrefix = style ? stylePrompts[style] || '' : ''
    const safetyPrefix = '适合儿童观看的，温馨可爱的'

    return `${safetyPrefix}${stylePrefix ? '，' + stylePrefix : ''}，${prompt}`
  }

  /**
   * 保存生成的图像到服务器
   * @param imageUrl 图像URL
   * @param metadata 元数据
   */
  async saveArtwork(imageUrl: string, metadata: {
    prompt: string
    style: string
    userId?: number
  }): Promise<{ success: boolean; artworkId?: number }> {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`${this.baseUrl}/creation/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'art',
          title: '我的AI画作',
          content: metadata.prompt,
          imageUrl: imageUrl,
          metadata: {
            style: metadata.style,
            generatedAt: new Date().toISOString()
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        return {
          success: true,
          artworkId: data.data?.id
        }
      } else {
        return {
          success: false
        }
      }
    } catch (error) {
      console.error('Save artwork error:', error)
      return {
        success: false
      }
    }
  }

  /**
   * 获取用户的绘画作品列表
   */
  async getArtworks(): Promise<any[]> {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`${this.baseUrl}/creation/list?type=art`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        return data.data || []
      }
      return []
    } catch (error) {
      console.error('Get artworks error:', error)
      return []
    }
  }
}

export const imageGenerationService = new ImageGenerationService()
export type { ImageGenerationOptions, ImageGenerationResult }
