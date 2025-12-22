import { Response } from 'express';
import { userService } from '../services/userService';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const profile = await userService.getProfile(userId);
  sendSuccess(res, profile);
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { nickname, avatar, bio } = req.body;
  const user = await userService.updateProfile(userId, { nickname, avatar, bio });
  sendSuccess(res, user, '更新成功');
});

export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.userId;
  const user = await userService.getUserById(id, currentUserId);
  sendSuccess(res, user);
});

export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const stats = await userService.getUserStats(userId);
  sendSuccess(res, stats);
});
