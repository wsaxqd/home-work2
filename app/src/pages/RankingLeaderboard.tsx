import React, { useState, useEffect } from 'react';
import { rankingApi } from '../services/api/features';
import './RankingLeaderboard.css';

interface RankPlayer {
  user_id: string;
  nickname: string;
  avatar: string;
  rank_level: string;
  rank_stars: number;
  rank_points: number;
  total_wins: number;
  total_losses: number;
  win_streak: number;
  rank_position: number;
  tier: string;
  tierName: string;
  color: string;
}

interface RankTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  stars: number;
  color: string;
}

const RankingLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<RankPlayer[]>([]);
  const [myRank, setMyRank] = useState<RankPlayer | null>(null);
  const [gameType, setGameType] = useState('math');
  const [loading, setLoading] = useState(true);
  const [rankTiers, setRankTiers] = useState<Record<string, RankTier>>({});
  const [distribution, setDistribution] = useState<any[]>([]);

  const gameTypes = [
    { id: 'math', name: '数学竞技', icon: '🔢' },
    { id: 'chinese', name: '语文竞技', icon: '📖' },
    { id: 'english', name: '英语竞技', icon: '🔤' },
    { id: 'science', name: '科学竞技', icon: '🔬' }
  ];

  useEffect(() => {
    loadData();
  }, [gameType]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 加载段位配置
      const tiersResponse = await rankingApi.getRankTiers();
      if (tiersResponse.data.success) {
        setRankTiers(tiersResponse.data.data);
      }

      // 加载排行榜
      const leaderboardResponse = await rankingApi.getLeaderboard(gameType, undefined, 100);
      if (leaderboardResponse.data.success) {
        setLeaderboard(leaderboardResponse.data.data);
      }

      // 加载我的段位
      const myRankResponse = await rankingApi.getUserRank(gameType);
      if (myRankResponse.data.success) {
        setMyRank(myRankResponse.data.data);
      }

      // 加载段位分布
      const distResponse = await rankingApi.getRankDistribution(gameType);
      if (distResponse.data.success) {
        setDistribution(distResponse.data.data);
      }
    } catch (error) {
      console.error('加载排行榜失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number): string => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  const getWinRate = (wins: number, losses: number): string => {
    const total = wins + losses;
    if (total === 0) return '0%';
    return `${((wins / total) * 100).toFixed(1)}%`;
  };

  return (
    <div className="ranking-leaderboard">
      {/* 游戏类型选择 */}
      <div className="game-type-selector">
        {gameTypes.map(type => (
          <button
            key={type.id}
            className={`game-type-btn ${gameType === type.id ? 'active' : ''}`}
            onClick={() => setGameType(type.id)}
          >
            <span className="game-icon">{type.icon}</span>
            <span className="game-name">{type.name}</span>
          </button>
        ))}
      </div>

      {/* 我的段位卡片 */}
      {myRank && (
        <div className="my-rank-card" style={{ borderColor: myRank.color }}>
          <div className="rank-badge" style={{ backgroundColor: myRank.color }}>
            <div className="rank-tier-name">{myRank.tierName}</div>
            <div className="rank-stars">
              {Array.from({ length: myRank.stars }).map((_, i) => (
                <span key={i} className="star filled">⭐</span>
              ))}
              {Array.from({ length: 5 - myRank.stars }).map((_, i) => (
                <span key={i} className="star empty">☆</span>
              ))}
            </div>
          </div>
          <div className="rank-stats">
            <div className="stat-item">
              <div className="stat-label">排名</div>
              <div className="stat-value">#{myRank.rank_position}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">段位分</div>
              <div className="stat-value">{myRank.rank_points}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">胜率</div>
              <div className="stat-value">{getWinRate(myRank.total_wins, myRank.total_losses)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">连胜</div>
              <div className="stat-value">{myRank.win_streak}</div>
            </div>
          </div>
        </div>
      )}

      {/* 段位分布 */}
      {distribution.length > 0 && (
        <div className="rank-distribution">
          <h3>段位分布</h3>
          <div className="distribution-bars">
            {distribution.map(tier => (
              <div key={tier.rank_level} className="distribution-item">
                <div className="tier-info">
                  <span className="tier-name" style={{ color: tier.color }}>
                    {tier.tier_name}
                  </span>
                  <span className="tier-percentage">{tier.percentage}%</span>
                </div>
                <div className="tier-bar">
                  <div
                    className="tier-bar-fill"
                    style={{
                      width: `${tier.percentage}%`,
                      backgroundColor: tier.color
                    }}
                  />
                </div>
                <div className="tier-count">{tier.player_count}人</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 排行榜列表 */}
      <div className="leaderboard-list">
        <h3>排行榜</h3>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state">暂无排行数据</div>
        ) : (
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="col-rank">排名</div>
              <div className="col-player">玩家</div>
              <div className="col-tier">段位</div>
              <div className="col-points">段位分</div>
              <div className="col-record">战绩</div>
              <div className="col-winrate">胜率</div>
            </div>
            {leaderboard.map((player, index) => (
              <div
                key={player.user_id}
                className={`table-row ${myRank?.user_id === player.user_id ? 'my-row' : ''}`}
              >
                <div className="col-rank">
                  <span className={`rank-badge ${index < 3 ? 'top-three' : ''}`}>
                    {getRankIcon(index + 1)}
                  </span>
                </div>
                <div className="col-player">
                  <img
                    src={player.avatar || '/default-avatar.png'}
                    alt={player.nickname}
                    className="player-avatar"
                  />
                  <span className="player-name">{player.nickname}</span>
                </div>
                <div className="col-tier">
                  <span className="tier-badge" style={{ backgroundColor: player.color }}>
                    {player.tierName}
                  </span>
                  <div className="tier-stars">
                    {Array.from({ length: player.rank_stars }).map((_, i) => (
                      <span key={i} className="star-mini">⭐</span>
                    ))}
                  </div>
                </div>
                <div className="col-points">
                  <span className="points-value">{player.rank_points}</span>
                </div>
                <div className="col-record">
                  <span className="wins">{player.total_wins}胜</span>
                  <span className="losses">{player.total_losses}负</span>
                </div>
                <div className="col-winrate">
                  {getWinRate(player.total_wins, player.total_losses)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingLeaderboard;
