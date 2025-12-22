import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { phone, password, nickname } = req.body;

  const result = await authService.register({ phone, password, nickname });

  sendSuccess(res, result, '注册成功', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  const result = await authService.login({ phone, password });

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
