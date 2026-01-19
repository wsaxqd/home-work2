import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { sendVerifyCode, verifyCode } from '../services/emailVerifyService';
import { AppError } from '../utils/errorHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { phone, email, password, nickname } = req.body;

  const result = await authService.register({ phone, email, password, nickname });

  sendSuccess(res, result, '注册成功', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { phone, email, username, password } = req.body;

  const result = await authService.login({ phone, email, username, password });

  sendSuccess(res, result, '登录成功');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: '请提供刷新令牌',
    });
  }

  const tokens = await authService.refreshToken(refreshToken);

  sendSuccess(res, tokens, '令牌刷新成功');
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.userId!;

  const result = await authService.changePassword(userId, oldPassword, newPassword);

  sendSuccess(res, null, result.message);
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  // JWT是无状态的，客户端删除token即可
  // 如果需要服务端黑名单，可以在这里实现
  sendSuccess(res, null, '退出登录成功');
});

// 发送邮箱验证码
export const sendEmailVerifyCode = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('请提供邮箱地址', 400);
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('邮箱格式不正确', 400);
  }

  await sendVerifyCode(email);

  sendSuccess(res, null, '验证码已发送，请查收邮箱');
});

// 邮箱验证码登录
export const emailLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw new AppError('请提供邮箱和验证码', 400);
  }

  // 验证验证码
  const isValid = await verifyCode(email, code);

  if (!isValid) {
    throw new AppError('验证码错误或已过期', 400);
  }

  // 使用邮箱登录
  const result = await authService.loginByEmail(email);

  sendSuccess(res, result, '登录成功');
});
