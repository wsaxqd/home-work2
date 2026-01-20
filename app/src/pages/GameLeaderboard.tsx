import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { gamesApi } from '../services/api/games'
import type { GameScore } from '../types'
import './GameLeaderboard.css'

// 游戏类型配置
const GAME_TYPES = [
  { id: 'fruit-match', name: '水果连连看', icon: '🍎', color: '#ff6b6b' },
  { id: 'crystal-match', name: '水晶消消乐', icon: '💎', color: '#667eea' },
  { id: 'tank-battle', name: '坦克大战', icon: '🚀', color: '#5f27cd' },
  { id: 'chess-game', name: '国际象棋', icon: '♟️', color: '#2c3e50' },
  { id: 'chinese-chess', name: '中国象棋', icon: '🀄', color: '#8b0000' },
  { id: 'whack-a-mole', name: '打地鼠', icon: '🎯', color: '#f093fb' },
  { id: 'number-puzzle', name: '数字华容道', icon: '🔢', color: '#4facfe' },
  { id: 'jigsaw-puzzle', name: '拼图游戏', icon: '🧩', color: '#28c76f' },
]

// 时间范围配置
const TIME_RANGES = [
  { id: 'all', label: '全部' },
  { id: 'today', label: '今日' },
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
]

// 奖牌图标
const MEDAL_ICONS = ['🥇', '🥈', '🥉']

export default function GameLeaderboard() {
  const navigate = useNavigate()
  const { gameType: urlGameType } = useParams()

  const [selectedGame, setSelectedGame] = useState(urlGameType || 'fruit-match')
  const [timeRange, setTimeRange] = useState('all')
  const [leaderboard, setLeaderboard] = useState<GameScore[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [myScore, setMyScore] = useState<GameScore | null>(null)

  // 获取当前游戏配置
  const currentGame = GAME_TYPES.find(g => g.id === selectedGame) || GAME_TYPES[0]

  // 加载排行榜数据
  useEffect(() => {
    loadLeaderboard()
  }, [selectedGame, timeRange])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await gamesApi.getLeaderboard(selectedGame, 50)

      if (response.success && response.data) {
        const scores = response.data
        setLeaderboard(scores)

        // 查找当前用户排名
        const userId = localStorage.getItem('userId')
        if (userId) {
          const myIndex = scores.findIndex(s => s.userId === userId)
          if (myIndex !== -1) {
            setMyRank(myIndex + 1)
            setMyScore(scores[myIndex])
          } else {
            setMyRank(null)
            setMyScore(null)
          }
        }
      }
    } catch (err) {
      console.error('加载排行榜失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }

  // 格式化游戏时长
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}分${secs}秒`
  }

  return (
    <Layout>
      <Header
        title="游戏排行榜"
        gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
      />

      <div className="leaderboard-container">
        {/* 游戏选择器 */}
        <div className="game-selector">
          <div className="selector-label">选择游戏</div>
          <div className="game-tabs">
            {GAME_TYPES.map((game) => (
              <button
                key={game.id}
                className={`game-tab ${selectedGame === game.id ? 'active' : ''}`}
                onClick={() => setSelectedGame(game.id)}
                style={{
                  borderColor: selectedGame === game.id ? game.color : undefined,
                  background: selectedGame === game.id
                    ? `linear-gradient(135deg, ${game.color}22 0%, ${game.color}11 100%)`
                    : undefined
                }}
              >
                <span className="game-tab-icon">{game.icon}</span>
                <span className="game-tab-name">{game.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 时间范围选择 */}
        <div className="time-range-selector">
          {TIME_RANGES.map((range) => (
            <button
              key={range.id}
              className={`time-btn ${timeRange === range.id ? 'active' : ''}`}
              onClick={() => setTimeRange(range.id)}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* 我的排名卡片 */}
        {myRank && myScore && (
          <div className="my-rank-card" style={{ borderColor: currentGame.color }}>
            <div className="my-rank-badge" style={{ background: currentGame.color }}>
              我的排名
            </div>
            <div className="my-rank-content">
              <div className="my-rank-number">#{myRank}</div>
              <div className="my-rank-details">
                <div className="rank-detail-item">
                  <span className="detail-label">分数</span>
                  <span className="detail-value">{myScore.score.toLocaleString()}</span>
                </div>
                <div className="rank-detail-item">
                  <span className="detail-label">关卡</span>
                  <span className="detail-value">Lv.{myScore.level}</span>
                </div>
                <div className="rank-detail-item">
                  <span className="detail-label">用时</span>
                  <span className="detail-value">{formatDuration(myScore.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 排行榜列表 */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>暂无排行榜数据</h3>
            <p>快去玩游戏，成为第一名吧！</p>
            <button className="play-btn" onClick={() => navigate(`/${selectedGame}`)}>
              <span className="btn-icon">{currentGame.icon}</span>
              开始游戏
            </button>
          </div>
        ) : (
          <div className="leaderboard-list">
            <div className="list-header">
              <span className="header-rank">排名</span>
              <span className="header-player">玩家</span>
              <span className="header-score">分数</span>
              <span className="header-level">关卡</span>
              <span className="header-time">时间</span>
            </div>

            {leaderboard.map((score, index) => {
              const isMyScore = score.userId === localStorage.getItem('userId')
              const rank = index + 1

              return (
                <div
                  key={score.id}
                  className={`leaderboard-item ${isMyScore ? 'my-score' : ''} ${rank <= 3 ? 'top-three' : ''}`}
                  style={{
                    borderLeftColor: isMyScore ? currentGame.color : undefined
                  }}
                >
                  <div className="item-rank">
                    {rank <= 3 ? (
                      <span className="medal">{MEDAL_ICONS[rank - 1]}</span>
                    ) : (
                      <span className="rank-number">#{rank}</span>
                    )}
                  </div>

                  <div className="item-player">
                    <div className="player-avatar" style={{ background: currentGame.color }}>
                      {score.userId?.substring(0, 2).toUpperCase() || '?'}
                    </div>
                    <div className="player-info">
                      <div className="player-name">
                        {isMyScore ? '我' : `玩家${score.userId?.substring(0, 6)}`}
                      </div>
                      <div className="player-date">{formatDate(score.createdAt)}</div>
                    </div>
                  </div>

                  <div className="item-score">
                    <span className="score-value">{score.score.toLocaleString()}</span>
                    <span className="score-label">分</span>
                  </div>

                  <div className="item-level">
                    <span className="level-badge" style={{ background: currentGame.color }}>
                      Lv.{score.level}
                    </span>
                  </div>

                  <div className="item-time">
                    {formatDuration(score.duration)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 底部操作按钮 */}
        <div className="bottom-actions">
          <button
            className="action-button primary"
            onClick={() => navigate(`/${selectedGame}`)}
            style={{ background: currentGame.color }}
          >
            <span className="btn-icon">{currentGame.icon}</span>
            开始游戏
          </button>
          <button
            className="action-button secondary"
            onClick={() => navigate('/games')}
          >
            <span className="btn-icon">🎮</span>
            返回游戏列表
          </button>
        </div>
      </div>
    </Layout>
  )
}
