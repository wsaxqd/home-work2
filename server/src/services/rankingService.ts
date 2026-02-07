import { query } from '../config/database';

// 段位配置
export const RANK_TIERS = {
  bronze: { name: '青铜', minPoints: 0, maxPoints: 999, stars: 5, color: '#CD7F32' },
  silver: { name: '白银', minPoints: 1000, maxPoints: 1999, stars: 5, color: '#C0C0C0' },
  gold: { name: '黄金', minPoints: 2000, maxPoints: 2999, stars: 5, color: '#FFD700' },
  platinum: { name: '铂金', minPoints: 3000, maxPoints: 3999, stars: 5, color: '#E5E4E2' },
  diamond: { name: '钻石', minPoints: 4000, maxPoints: 4999, stars: 5, color: '#B9F2FF' },
  master: { name: '大师', minPoints: 5000, maxPoints: 5999, stars: 5, color: '#9370DB' },
  grandmaster: { name: '宗师', minPoints: 6000, maxPoints: 6999, stars: 5, color: '#FF4500' },
  challenger: { name: '王者', minPoints: 7000, maxPoints: 999999, stars: 5, color: '#FF0000' }
};

// 根据积分计算段位
export function calculateRankTier(points: number): {
  tier: string;
  tierName: string;
  stars: number;
  maxStars: number;
  progress: number;
  color: string;
} {
  let currentTier = 'bronze';

  for (const [tier, config] of Object.entries(RANK_TIERS)) {
    if (points >= config.minPoints && points <= config.maxPoints) {
      currentTier = tier;
      break;
    }
  }

  const tierConfig = RANK_TIERS[currentTier as keyof typeof RANK_TIERS];
  const pointsInTier = points - tierConfig.minPoints;
  const tierRange = tierConfig.maxPoints - tierConfig.minPoints + 1;
  const pointsPerStar = tierRange / tierConfig.stars;
  const stars = Math.floor(pointsInTier / pointsPerStar);
  const progress = ((pointsInTier % pointsPerStar) / pointsPerStar) * 100;

  return {
    tier: currentTier,
    tierName: tierConfig.name,
    stars: Math.min(stars, tierConfig.stars),
    maxStars: tierConfig.stars,
    progress: Math.round(progress),
    color: tierConfig.color
  };
}

// 计算段位分变化
export function calculateRankPointsChange(
  isWinner: boolean,
  myPoints: number,
  opponentPoints: number,
  winStreak: number,
  gameType: string
): number {
  // 基础分数
  let basePoints = 25;

  // 段位差异调整
  const pointsDiff = opponentPoints - myPoints;
  if (pointsDiff > 0) {
    // 对手分数更高,赢了多加分,输了少扣分
    basePoints += Math.min(Math.floor(pointsDiff / 100), 15);
  } else {
    // 对手分数更低,赢了少加分,输了多扣分
    basePoints -= Math.min(Math.floor(Math.abs(pointsDiff) / 100), 10);
  }

  // 连胜加成(最多+20分)
  if (isWinner && winStreak >= 3) {
    const streakBonus = Math.min((winStreak - 2) * 3, 20);
    basePoints += streakBonus;
  }

  // 保护机制:最低加分10,最低扣分-15
  if (isWinner) {
    return Math.max(basePoints, 10);
  } else {
    return -Math.max(Math.floor(basePoints * 0.6), 15);
  }
}

// 匹配算法:根据段位分查找合适的对手
export async function findMatchOpponent(
  userId: string,
  gameType: string,
  myPoints: number
): Promise<any> {
  // 匹配范围:±200分
  const matchRange = 200;

  // 查找在线且等待匹配的玩家
  const result = await query(`
    SELECT r.*, u.nickname, u.avatar
    FROM pk_ranks r
    JOIN users u ON r.user_id = u.id
    WHERE r.game_type = $1
      AND r.user_id != $2
      AND r.rank_points BETWEEN $3 AND $4
      AND EXISTS (
        SELECT 1 FROM pk_rooms pr
        WHERE pr.created_by = r.user_id
          AND pr.room_status = 'waiting'
          AND pr.game_type = $1
      )
    ORDER BY ABS(r.rank_points - $5)
    LIMIT 1
  `, [gameType, userId, myPoints - matchRange, myPoints + matchRange, myPoints]);

  return result.rows[0] || null;
}

// 更新段位信息
export async function updateRankAfterMatch(
  userId: string,
  gameType: string,
  isWinner: boolean,
  pointsChange: number,
  season: string = '2026-S1'
): Promise<void> {
  // 获取当前段位信息
  const rankResult = await query(`
    SELECT * FROM pk_ranks
    WHERE user_id = $1 AND game_type = $2 AND season = $3
  `, [userId, gameType, season]);

  if (rankResult.rows.length === 0) {
    // 创建新的段位记录
    const newPoints = Math.max(pointsChange, 0);
    const rankInfo = calculateRankTier(newPoints);

    await query(`
      INSERT INTO pk_ranks (
        user_id, game_type, season,
        rank_level, rank_stars, rank_points,
        total_wins, total_losses,
        win_streak, max_win_streak,
        highest_rank
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      userId, gameType, season,
      rankInfo.tier, rankInfo.stars, newPoints,
      isWinner ? 1 : 0, isWinner ? 0 : 1,
      isWinner ? 1 : 0, isWinner ? 1 : 0,
      rankInfo.tier
    ]);
  } else {
    // 更新现有段位记录
    const currentRank = rankResult.rows[0];
    const newPoints = Math.max(currentRank.rank_points + pointsChange, 0);
    const rankInfo = calculateRankTier(newPoints);
    const newWinStreak = isWinner ? currentRank.win_streak + 1 : 0;
    const newMaxWinStreak = Math.max(currentRank.max_win_streak, newWinStreak);

    // 更新最高段位
    const currentTierIndex = Object.keys(RANK_TIERS).indexOf(currentRank.rank_level);
    const newTierIndex = Object.keys(RANK_TIERS).indexOf(rankInfo.tier);
    const highestRank = newTierIndex > currentTierIndex ? rankInfo.tier : currentRank.highest_rank;

    await query(`
      UPDATE pk_ranks SET
        rank_level = $1,
        rank_stars = $2,
        rank_points = $3,
        total_wins = total_wins + $4,
        total_losses = total_losses + $5,
        win_streak = $6,
        max_win_streak = $7,
        highest_rank = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $9 AND game_type = $10 AND season = $11
    `, [
      rankInfo.tier, rankInfo.stars, newPoints,
      isWinner ? 1 : 0, isWinner ? 0 : 1,
      newWinStreak, newMaxWinStreak, highestRank,
      userId, gameType, season
    ]);
  }
}

// 获取用户段位信息
export async function getUserRank(
  userId: string,
  gameType: string,
  season: string = '2026-S1'
): Promise<any> {
  const result = await query(`
    SELECT * FROM pk_ranks
    WHERE user_id = $1 AND game_type = $2 AND season = $3
  `, [userId, gameType, season]);

  if (result.rows.length === 0) {
    // 返回默认青铜段位
    return {
      user_id: userId,
      game_type: gameType,
      season,
      rank_level: 'bronze',
      rank_stars: 0,
      rank_points: 0,
      total_wins: 0,
      total_losses: 0,
      win_streak: 0,
      max_win_streak: 0,
      highest_rank: 'bronze',
      ...calculateRankTier(0)
    };
  }

  const rank = result.rows[0];
  return {
    ...rank,
    ...calculateRankTier(rank.rank_points)
  };
}

// 获取排行榜
export async function getLeaderboard(
  gameType: string,
  season: string = '2026-S1',
  limit: number = 100
): Promise<any[]> {
  const result = await query(`
    SELECT
      r.*,
      u.nickname,
      u.avatar,
      ROW_NUMBER() OVER (ORDER BY r.rank_points DESC, r.total_wins DESC) as rank_position
    FROM pk_ranks r
    JOIN users u ON r.user_id = u.id
    WHERE r.game_type = $1 AND r.season = $2
    ORDER BY r.rank_points DESC, r.total_wins DESC
    LIMIT $3
  `, [gameType, season, limit]);

  return result.rows.map(row => ({
    ...row,
    ...calculateRankTier(row.rank_points)
  }));
}

// 获取用户在排行榜中的位置
export async function getUserRankPosition(
  userId: string,
  gameType: string,
  season: string = '2026-S1'
): Promise<number> {
  const result = await query(`
    SELECT COUNT(*) + 1 as position
    FROM pk_ranks r1
    WHERE r1.game_type = $1 AND r1.season = $2
      AND (
        r1.rank_points > (
          SELECT rank_points FROM pk_ranks
          WHERE user_id = $3 AND game_type = $1 AND season = $2
        )
        OR (
          r1.rank_points = (
            SELECT rank_points FROM pk_ranks
            WHERE user_id = $3 AND game_type = $1 AND season = $2
          )
          AND r1.total_wins > (
            SELECT total_wins FROM pk_ranks
            WHERE user_id = $3 AND game_type = $1 AND season = $2
          )
        )
      )
  `, [gameType, season, userId]);

  return parseInt(result.rows[0]?.position || '0');
}

// 获取段位分布统计
export async function getRankDistribution(
  gameType: string,
  season: string = '2026-S1'
): Promise<any> {
  const result = await query(`
    SELECT
      rank_level,
      COUNT(*) as player_count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
    FROM pk_ranks
    WHERE game_type = $1 AND season = $2
    GROUP BY rank_level
    ORDER BY
      CASE rank_level
        WHEN 'challenger' THEN 8
        WHEN 'grandmaster' THEN 7
        WHEN 'master' THEN 6
        WHEN 'diamond' THEN 5
        WHEN 'platinum' THEN 4
        WHEN 'gold' THEN 3
        WHEN 'silver' THEN 2
        WHEN 'bronze' THEN 1
        ELSE 0
      END DESC
  `, [gameType, season]);

  return result.rows.map(row => ({
    ...row,
    tier_name: RANK_TIERS[row.rank_level as keyof typeof RANK_TIERS]?.name || row.rank_level,
    color: RANK_TIERS[row.rank_level as keyof typeof RANK_TIERS]?.color || '#999999'
  }));
}

export const rankingService = {
  calculateRankTier,
  calculateRankPointsChange,
  findMatchOpponent,
  updateRankAfterMatch,
  getUserRank,
  getLeaderboard,
  getUserRankPosition,
  getRankDistribution
};
