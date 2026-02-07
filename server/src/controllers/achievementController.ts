import { Request, Response } from 'express';
import * as achievementService from '../services/achievementService';

// 获取所有成就
export const getAllAchievements = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const achievements = await achievementService.getAchievements(category as string);

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('获取成就列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成就列表失败'
    });
  }
};

// 获取用户成就
export const getUserAchievements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { category } = req.query;

    const achievements = await achievementService.getUserAchievements(userId, category as string);

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('获取用户成就失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户成就失败'
    });
  }
};

// 获取成就统计
export const getAchievementStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const stats = await achievementService.getUserAchievementStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取成就统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成就统计失败'
    });
  }
};

// 获取成就进度
export const getAchievementProgress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const progress = await achievementService.getAchievementProgress(userId);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('获取成就进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成就进度失败'
    });
  }
};
