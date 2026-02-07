import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { sendVerifyCode, verifyCode } from '../services/emailVerifyService';
import { sendSMSCode, verifySMSCode } from '../services/smsVerifyService';
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

// 发送短信验证码
export const sendSMSVerifyCode = asyncHandler(async (req: Request, res: Response) => {
  const { phone, purpose = 'login' } = req.body;

  if (!phone) {
    throw new AppError('请提供手机号', 400);
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new AppError('手机号格式不正确', 400);
  }

  // 获取IP和User-Agent
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const result = await sendSMSCode({
    phone,
    purpose,
    ipAddress,
    userAgent
  });

  sendSuccess(res, null, result.message);
});

// 手机号验证码登录
export const phoneLogin = asyncHandler(async (req: Request, res: Response) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    throw new AppError('请提供手机号和验证码', 400);
  }

  // 验证验证码
  const isValid = await verifySMSCode({ phone, code, purpose: 'login' });

  if (!isValid) {
    throw new AppError('验证码错误或已过期', 400);
  }

  // 使用手机号登录
  const result = await authService.loginByPhone(phone);

  sendSuccess(res, result, '登录成功');
});

// 发起密码找回请求
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { contact, method } = req.body; // contact: 手机号或邮箱, method: 'phone' | 'email'

  if (!contact || !method) {
    throw new AppError('请提供联系方式和找回方式', 400);
  }

  if (method === 'phone') {
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(contact)) {
      throw new AppError('手机号格式不正确', 400);
    }

    // 获取IP和User-Agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await sendSMSCode({
      phone: contact,
      purpose: 'reset',
      ipAddress,
      userAgent
    });

    sendSuccess(res, null, '验证码已发送至手机');
  } else if (method === 'email') {
    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      throw new AppError('邮箱格式不正确', 400);
    }

    await sendVerifyCode(contact, 'reset');
    sendSuccess(res, null, '验证码已发送至邮箱');
  } else {
    throw new AppError('不支持的找回方式', 400);
  }
});

// 验证重置码
export const verifyResetCode = asyncHandler(async (req: Request, res: Response) => {
  const { contact, code, method } = req.body;

  if (!contact || !code || !method) {
    throw new AppError('请提供完整信息', 400);
  }

  let isValid = false;

  if (method === 'phone') {
    isValid = await verifySMSCode({ phone: contact, code, purpose: 'reset' });
  } else if (method === 'email') {
    isValid = await verifyCode(contact, code, 'reset');
  }

  if (!isValid) {
    throw new AppError('验证码错误或已过期', 400);
  }

  // 生成重置令牌
  const resetToken = await authService.generateResetToken(contact, method);

  sendSuccess(res, { resetToken }, '验证成功');
});

// 重置密码
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    throw new AppError('请提供重置令牌和新密码', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('密码至少需要8位', 400);
  }

  await authService.resetPassword(resetToken, newPassword);

  sendSuccess(res, null, '密码重置成功');
});
