import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './CoinsRanking.css'

interface RankUser {
  id: string
  nickname: string
  avatar: string
  coins: number
  rank: number
  level: number
  isMe?: boolean
}

export default function CoinsRanking() {
  const navigate = useNavigate()
  const [rankings, setRankings] = useState<RankUser[]>([])
  const [myRank, setMyRank] = useState<RankUser | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRankings()
  }, [timeRange])

  const fetchRankings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3000/api/coins/ranking?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRankings(data.data?.rankings || [])
        setMyRank(data.data?.myRank || null)
      }
    } catch (error) {
      console.error('获取排行榜失败:', error)
      // 使用模拟数据
      const mockData = getMockRankings()
      setRankings(mockData.rankings)
      setMyRank(mockData.myRank)
    } finally {
      setIsLoading(false)
    }
  }

  const getMockRankings = () => {
    const rankings: RankUser[] = [
      { id: '1', nickname: '学习小天才', avatar: '🌟', coins: 3580, rank: 1, level: 12 },
      { id: '2', nickname: '知识探索者', avatar: '🚀', coins: 3240, rank: 2, level: 11 },
      { id: '3', nickname: '创意大师', avatar: '🎨', coins: 2890, rank: 3, level: 10 },
      { id: '4', nickname: '阅读之星', avatar: '📚', coins: 2650, rank: 4, level: 9 },
      { id: '5', nickname: '游戏高手', avatar: '🎮', coins: 2420, rank: 5, level: 9 },
      { id: '6', nickname: '勤奋小蜜蜂', avatar: '🐝', coins: 2180, rank: 6, level: 8 },
      { id: '7', nickname: '智慧之光', avatar: '💡', coins: 1950, rank: 7, level: 8 },
      { id: '8', nickname: '快乐学习', avatar: '😊', coins: 1720, rank: 8, level: 7 },
      { id: '9', nickname: '进步达人', avatar: '📈', coins: 1580, rank: 9, level: 7 },
      { id: '10', nickname: '努力宝宝', avatar: '💪', coins: 1420, rank: 10, level: 6 }
    ]

    const myRank: RankUser = {
      id: 'me',
      nickname: '小朋友',
      avatar: '🌈',
      coins: 1580,
      rank: 9,
      level: 7,
      isMe: true
    }

    return { rankings, myRank }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'silver'
    if (rank === 3) return 'bronze'
    return ''
  }

  return (
    <Layout>
      <Header
        title="积分排行榜"
        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        showBack={true}
      />
      <div className="main-content">
        {/* 时间范围选择 */}
        <div className="time-range-tabs">
          <button
            className={`range-tab ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            <span className="tab-icon">📅</span>
            <span>本周</span>
          </button>
          <button
            className={`range-tab ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            <span className="tab-icon">📆</span>
            <span>本月</span>
          </button>
          <button
            className={`range-tab ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            <span className="tab-icon">🏆</span>
            <span>总榜</span>
          </button>
        </div>

        {/* 我的排名卡片 */}
        {myRank && (
          <div className="my-rank-card">
            <div className="my-rank-header">
              <span className="my-rank-label">我的排名</span>
              <span className="my-rank-badge">{getRankIcon(myRank.rank)}</span>
            </div>
            <div className="my-rank-info">
              <div className="my-avatar">{myRank.avatar}</div>
              <div className="my-details">
                <div className="my-name">{myRank.nickname}</div>
                <div className="my-level">Lv.{myRank.level}</div>
              </div>
              <div className="my-coins">
                <div className="my-coins-value">{myRank.coins}</div>
                <div className="my-coins-label">积分</div>
              </div>
            </div>
          </div>
        )}

        {/* 排行榜列表 */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <p className="empty-text">暂无排名数据</p>
          </div>
        ) : (
          <div className="rankings-list">
            <div className="rankings-header">
              <span className="rankings-title">🏆 排行榜</span>
              <span className="rankings-subtitle">努力学习，冲击榜首！</span>
            </div>
            {rankings.map((user) => (
              <div
                key={user.id}
                className={`rank-item ${getRankClass(user.rank)} ${user.isMe ? 'is-me' : ''}`}
              >
                <div className="rank-badge">
                  <span className={`rank-number ${getRankClass(user.rank)}`}>
                    {getRankIcon(user.rank)}
                  </span>
                </div>
                <div className="rank-avatar">{user.avatar}</div>
                <div className="rank-info">
                  <div className="rank-name">
                    {user.nickname}
                    {user.isMe && <span className="me-badge">我</span>}
                  </div>
                  <div className="rank-level">Lv.{user.level}</div>
                </div>
                <div className="rank-coins">
                  <span className="coins-icon">⭐</span>
                  <span className="coins-value">{user.coins}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 激励卡片 */}
        <div className="motivation-card">
          <div className="motivation-icon">🎯</div>
          <div className="motivation-text">
            <div className="motivation-title">继续努力！</div>
            <div className="motivation-desc">完成任务赚取积分，冲击排行榜</div>
          </div>
          <button className="motivation-btn" onClick={() => navigate('/daily-tasks')}>
            去赚积分 →
          </button>
        </div>
      </div>
    </Layout>
  )
}
