import { cacheService } from './cacheService'
import * as rankingService from './rankingService'

const CACHE_TTL = {
  LEADERBOARD: 300, // 5分钟
  USER_RANK: 60 // 1分钟
}

export async function getLeaderboard(gameType: string, season: string, limit: number) {
  const cacheKey = `leaderboard:${gameType}:${season}:${limit}`
  const cached = await cacheService.get(cacheKey)

  if (cached) return cached

  const data = await rankingService.getLeaderboard(gameType, season, limit)
  await cacheService.set(cacheKey, data, CACHE_TTL.LEADERBOARD)

  return data
}

export async function getUserRank(userId: string, gameType: string, season: string) {
  const cacheKey = `user_rank:${userId}:${gameType}:${season}`
  const cached = await cacheService.get(cacheKey)

  if (cached) return cached

  const data = await rankingService.getUserRank(userId, gameType, season)
  await cacheService.set(cacheKey, data, CACHE_TTL.USER_RANK)

  return data
}

export async function invalidateLeaderboardCache(gameType: string, season: string) {
  await cacheService.delPattern(`leaderboard:${gameType}:${season}:*`)
}

export async function invalidateUserRankCache(userId: string) {
  await cacheService.delPattern(`user_rank:${userId}:*`)
}
