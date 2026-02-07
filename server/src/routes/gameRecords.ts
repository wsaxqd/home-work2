import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  saveGameRecord,
  getUserGameStatistics,
  getGameLeaderboard,
  getUserRank,
  getUserGameRecords,
  getGameTypes,
  getGlobalGameStatistics
} from '../controllers/gameRecordController';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 保存游戏记录
router.post('/record', saveGameRecord);

// 获取用户游戏统计
router.get('/statistics/:userId?', getUserGameStatistics);

// 获取游戏排行榜
router.get('/leaderboard/:gameType/:difficulty', getGameLeaderboard);

// 获取用户排名
router.get('/rank/:gameType/:difficulty', getUserRank);

// 获取用户游戏记录
router.get('/records/:userId?', getUserGameRecords);

// 获取游戏类型列表
router.get('/types', getGameTypes);

// 获取全局游戏统计
router.get('/global-stats/:gameType', getGlobalGameStatistics);

export default router;
