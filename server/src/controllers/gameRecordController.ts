import { Request, Response } from 'express';
import gameRecordService from '../services/gameRecordService';

// 保存游戏记录
export const saveGameRecord = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { game_type, difficulty, score, time_spent, best_streak, accuracy, metadata } = req.body;

    // 验证必填字段
    if (!game_type || !difficulty || score === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
    }

    const record = await gameRecordService.saveGameRecord({
      user_id: userId,
      game_type,
      difficulty,
      score,
      time_spent: time_spent || 0,
      best_streak: best_streak || 0,
      accuracy: accuracy || 0,
      metadata: metadata || {}
    });

    res.json({
      success: true,
      message: '游戏记录保存成功',
      data: record
    });
  } catch (error: any) {
    console.error('保存游戏记录失败:', error);
    res.status(500).json({
      success: false,
      message: '保存游戏记录失败',
      error: error.message
    });
  }
};

// 获取用户游戏统计
export const getUserGameStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || (req as any).user.id;
    const { game_type } = req.query;

    const statistics = await gameRecordService.getUserGameStatistics(
      userId,
      game_type as string
    );

    res.json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    console.error('获取游戏统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取游戏统计失败',
      error: error.message
    });
  }
};

// 获取游戏排行榜
export const getGameLeaderboard = async (req: Request, res: Response) => {
  try {
    const { gameType, difficulty } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const leaderboard = await gameRecordService.getGameLeaderboard(
      gameType,
      difficulty,
      limit
    );

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error: any) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({
      success: false,
      message: '获取排行榜失败',
      error: error.message
    });
  }
};

// 获取用户排名
export const getUserRank = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gameType, difficulty } = req.params;

    const rank = await gameRecordService.getUserRank(userId, gameType, difficulty);

    res.json({
      success: true,
      data: rank
    });
  } catch (error: any) {
    console.error('获取用户排名失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户排名失败',
      error: error.message
    });
  }
};

// 获取用户游戏记录
export const getUserGameRecords = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || (req as any).user.id;
    const { game_type, limit } = req.query;

    const records = await gameRecordService.getUserGameRecords(
      userId,
      game_type as string,
      limit ? parseInt(limit as string) : 50
    );

    res.json({
      success: true,
      data: records
    });
  } catch (error: any) {
    console.error('获取游戏记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取游戏记录失败',
      error: error.message
    });
  }
};

// 获取游戏类型列表
export const getGameTypes = async (req: Request, res: Response) => {
  try {
    const types = await gameRecordService.getGameTypes();

    res.json({
      success: true,
      data: types
    });
  } catch (error: any) {
    console.error('获取游戏类型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取游戏类型失败',
      error: error.message
    });
  }
};

// 获取全局游戏统计
export const getGlobalGameStatistics = async (req: Request, res: Response) => {
  try {
    const { gameType } = req.params;

    const stats = await gameRecordService.getGlobalGameStatistics(gameType);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('获取全局统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取全局统计失败',
      error: error.message
    });
  }
};
