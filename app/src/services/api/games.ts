import { api } from '../../config/api'
import type { GameScore, GameRecord } from '../../types'

export const gamesApi = {
  // 提交游戏分数
  submitScore: (data: {
    gameType: string
    score: number
    level: number
    duration: number
  }) => api.post<GameScore>('/games/scores', data),

  // 获取用户游戏记录
  getGameRecords: (userId?: string) => {
    const query = userId ? `?userId=${userId}` : ''
    return api.get<GameRecord[]>(`/games/records${query}`)
  },

  // 获取游戏排行榜
  getLeaderboard: (gameType: string, limit = 10) =>
    api.get<GameScore[]>(`/games/leaderboard/${gameType}?limit=${limit}`),

  // 获取用户最高分
  getUserHighScore: (gameType: string, userId?: string) => {
    const query = userId ? `?userId=${userId}` : ''
    return api.get<GameScore>(`/games/${gameType}/high-score${query}`)
  },
}
