import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadService } from '../services/uploadService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';

const router = Router();

// 配置multer临时存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/temp'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 9, // 最多9个文件
  }
});

// 确保临时目录存在
import fs from 'fs';
const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 上传单个图片
router.post('/image', authMiddleware, upload.single('image'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '请选择要上传的图片' });
  }

  const category = (req.body.category as 'works' | 'avatars' | 'general') || 'general';
  const result = await uploadService.uploadImage(req.file as any, category);

  sendSuccess(res, result, '图片上传成功', 201);
}));

// 批量上传图片
router.post('/images', authMiddleware, upload.array('images', 9), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    return res.status(400).json({ success: false, message: '请选择要上传的图片' });
  }

  const category = (req.body.category as 'works' | 'avatars' | 'general') || 'general';
  const result = await uploadService.uploadImages(req.files as any[], category);

  sendSuccess(res, result, '图片上传完成', 201);
}));

// 上传音频
router.post('/audio', authMiddleware, upload.single('audio'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '请选择要上传的音频' });
  }

  const result = await uploadService.uploadAudio(req.file as any);

  sendSuccess(res, result, '音频上传成功', 201);
}));

// 上传头像
router.post('/avatar', authMiddleware, upload.single('avatar'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '请选择要上传的头像' });
  }

  const result = await uploadService.uploadImage(req.file as any, 'avatars');

  sendSuccess(res, result, '头像上传成功', 201);
}));

// 删除文件
router.delete('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, message: '请提供文件URL' });
  }

  uploadService.deleteFileByUrl(url);

  sendSuccess(res, null, '文件删除成功');
}));

export default router;
