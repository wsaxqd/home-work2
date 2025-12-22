import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/errorHandler';
import config from '../config';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export class UploadService {
  private uploadDir: string;
  private allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
  private maxImageSize = 5 * 1024 * 1024; // 5MB
  private maxAudioSize = 10 * 1024 * 1024; // 10MB

  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureUploadDirs();
  }

  // 确保上传目录存在
  private ensureUploadDirs() {
    const dirs = ['images', 'audio', 'works', 'avatars'];
    dirs.forEach(dir => {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  // 上传图片
  async uploadImage(file: UploadedFile, category: 'works' | 'avatars' | 'general' = 'general') {
    // 验证文件类型
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      // 删除已上传的临时文件
      this.deleteFile(file.path);
      throw new AppError('不支持的图片格式，请上传 JPG、PNG、GIF 或 WebP 格式', 400);
    }

    // 验证文件大小
    if (file.size > this.maxImageSize) {
      this.deleteFile(file.path);
      throw new AppError('图片大小不能超过 5MB', 400);
    }

    // 生成新文件名
    const ext = path.extname(file.originalname);
    const newFilename = `${uuidv4()}${ext}`;
    const targetDir = category === 'general' ? 'images' : category;
    const targetPath = path.join(this.uploadDir, targetDir, newFilename);

    // 移动文件
    fs.renameSync(file.path, targetPath);

    // 返回文件URL
    const fileUrl = `/uploads/${targetDir}/${newFilename}`;

    return {
      url: fileUrl,
      filename: newFilename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  // 上传音频
  async uploadAudio(file: UploadedFile) {
    // 验证文件类型
    if (!this.allowedAudioTypes.includes(file.mimetype)) {
      this.deleteFile(file.path);
      throw new AppError('不支持的音频格式，请上传 MP3、WAV 或 OGG 格式', 400);
    }

    // 验证文件大小
    if (file.size > this.maxAudioSize) {
      this.deleteFile(file.path);
      throw new AppError('音频大小不能超过 10MB', 400);
    }

    // 生成新文件名
    const ext = path.extname(file.originalname);
    const newFilename = `${uuidv4()}${ext}`;
    const targetPath = path.join(this.uploadDir, 'audio', newFilename);

    // 移动文件
    fs.renameSync(file.path, targetPath);

    // 返回文件URL
    const fileUrl = `/uploads/audio/${newFilename}`;

    return {
      url: fileUrl,
      filename: newFilename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  // 批量上传图片
  async uploadImages(files: UploadedFile[], category: 'works' | 'avatars' | 'general' = 'general') {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.uploadImage(file, category);
        results.push(result);
      } catch (error: any) {
        errors.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    return {
      success: results,
      failed: errors,
      totalSuccess: results.length,
      totalFailed: errors.length,
    };
  }

  // 删除文件
  deleteFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('删除文件失败:', error);
    }
  }

  // 根据URL删除文件
  deleteFileByUrl(fileUrl: string) {
    // 从URL提取文件路径
    const relativePath = fileUrl.replace('/uploads/', '');
    const fullPath = path.join(this.uploadDir, relativePath);
    this.deleteFile(fullPath);
  }
}

export const uploadService = new UploadService();
