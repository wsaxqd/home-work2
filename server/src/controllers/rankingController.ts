import { Request, Response } from 'express';
import * as rankingService from '../services/rankingService';

// 获取用户段位信息
export const getUserRank = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gameType } = req.params;
    const { season } = req.query;

    const rankInfo = await rankingService.getUserRank(
      userId,
      gameType,
      season as string
    );

    // 获取排名
    const position = await rankingService.getUserRankPosition(
      userId,
      gameType,
      season as string
    );

    res.json({
      success: true,
      data: {
        ...rankInfo,
        rank_position: position
      }
    });
  } catch (error) {
    console.error('获取段位信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取段位信息失败'
    });
  }
};

// 获取排行榜
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { gameType } = req.params;
    const { season, limit = 100 } = req.query;

    const leaderboard = await rankingService.getLeaderboard(
      gameType,
      season as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({
      success: false,
      message: '获取排行榜失败'
    });
  }
};

// 获取段位分布统计
export const getRankDistribution = async (req: Request, res: Response) => {
  try {
    const { gameType } = req.params;
    const { season } = req.query;

    const distribution = await rankingService.getRankDistribution(
      gameType,
      season as string
    );

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('获取段位分布失败:', error);
    res.status(500).json({
      success: false,
      message: '获取段位分布失败'
    });
  }
};

// 快速匹配
export const quickMatch = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gameType } = req.body;

    // 获取用户当前段位分
    const userRank = await rankingService.getUserRank(userId, gameType);

    // 查找合适的对手
    const opponent = await rankingService.findMatchOpponent(
      userId,
      gameType,
      userRank.rank_points
    );

    if (!opponent) {
      return res.json({
        success: false,
        message: '暂无合适的对手,请稍后再试'
      });
    }

    res.json({
      success: true,
      data: opponent,
      message: '匹配成功!'
    });
  } catch (error) {
    console.error('快速匹配失败:', error);
    res.status(500).json({
      success: false,
      message: '快速匹配失败'
    });
  }
};

// 获取段位配置信息
export const getRankTiers = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: rankingService.RANK_TIERS
    });
  } catch (error) {
    console.error('获取段位配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取段位配置失败'
    });
  }
};
