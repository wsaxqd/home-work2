import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 用户注册
router.post('/register', authController.register);

// 用户登录
router.post('/login', authController.login);

// 退出登录
router.post('/logout', authMiddleware, authController.logout);

// 刷新令牌
router.post('/refresh-token', authController.refreshToken);

// 修改密码
router.post('/change-password', authMiddleware, authController.changePassword);

// 发送邮箱验证码
router.post('/send-email-code', authController.sendEmailVerifyCode);

// 邮箱验证码登录
router.post('/email-login', authController.emailLogin);

export default router;
