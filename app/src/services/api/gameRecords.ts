import api from './index';

export interface GameRecord {
  game_type: string;
  difficulty: string;
  score: number;
  time_spent: number;
  best_streak: number;
  accuracy: number;
  metadata?: any;
}

export interface GameStatistics {
  game_type: string;
  total_plays: number;
  total_score: number;
  highest_score: number;
  average_score: number;
  total_time: number;
  best_streak: number;
  average_accuracy: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar: string;
  score: number;
  rank: number;
  achieved_at: string;
}

// 保存游戏记录
export const saveGameRecord = async (record: GameRecord) => {
  const response = await api.post('/game-records/record', record);
  return response.data;
};

// 获取用户游戏统计
export const getUserGameStatistics = async (userId?: string, gameType?: string) => {
  const url = userId ? `/game-records/statistics/${userId}` : '/game-records/statistics';
  const response = await api.get(url, { params: { game_type: gameType } });
  return response.data;
};

// 获取游戏排行榜
export const getGameLeaderboard = async (gameType: string, difficulty: string, limit: number = 100) => {
  const response = await api.get(`/game-records/leaderboard/${gameType}/${difficulty}`, {
    params: { limit }
  });
  return response.data;
};

// 获取用户排名
export const getUserRank = async (gameType: string, difficulty: string) => {
  const response = await api.get(`/game-records/rank/${gameType}/${difficulty}`);
  return response.data;
};

// 获取用户游戏记录
export const getUserGameRecords = async (userId?: string, gameType?: string, limit: number = 50) => {
  const url = userId ? `/game-records/records/${userId}` : '/game-records/records';
  const response = await api.get(url, { params: { game_type: gameType, limit } });
  return response.data;
};

// 获取游戏类型列表
export const getGameTypes = async () => {
  const response = await api.get('/game-records/types');
  return response.data;
};

// 获取全局游戏统计
export const getGlobalGameStatistics = async (gameType: string) => {
  const response = await api.get(`/game-records/global-stats/${gameType}`);
  return response.data;
};
