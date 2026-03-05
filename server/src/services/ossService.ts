import OSS from 'ali-oss'
import { logger } from '../utils/logger'

const ossConfig = {
  region: process.env.OSS_REGION || 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.OSS_BUCKET || ''
}

export class OSSService {
  private client: OSS

  constructor() {
    this.client = new OSS(ossConfig)
  }

  async upload(file: Buffer, filename: string, folder: string = 'uploads'): Promise<string> {
    try {
      const path = `${folder}/${Date.now()}-${filename}`
      const result = await this.client.put(path, file)
      logger.info(`File uploaded to OSS: ${result.url}`)
      return result.url
    } catch (error) {
      logger.error('OSS upload error:', error)
      throw error
    }
  }

  async delete(filename: string): Promise<void> {
    try {
      await this.client.delete(filename)
      logger.info(`File deleted from OSS: ${filename}`)
    } catch (error) {
      logger.error('OSS delete error:', error)
      throw error
    }
  }

  getSignedUrl(filename: string, expires: number = 3600): string {
    return this.client.signatureUrl(filename, { expires })
  }
}

export const ossService = new OSSService()
