import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { useToast } from '../components/Toast'
import './PKBattle.css'

interface Room {
  id: number
  room_code: string
  game_type: string
  subject: string
  difficulty: string
  question_count: number
  time_limit: number
  current_players: number
  creator_name: string
}

interface RankInfo {
  rank_level: string
  rank_stars: number
  rank_points: number
  total_wins: number
  total_losses: number
  win_streak: number
  max_win_streak: number
}

const RANK_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  bronze: { name: '青铜', color: '#CD7F32', icon: '🥉' },
  silver: { name: '白银', color: '#C0C0C0', icon: '🥈' },
  gold: { name: '黄金', color: '#FFD700', icon: '🥇' },
  platinum: { name: '铂金', color: '#E5E4E2', icon: '💎' },
  diamond: { name: '钻石', color: '#B9F2FF', icon: '💠' },
  master: { name: '大师', color: '#FF6B9D', icon: '👑' },
  grandmaster: { name: '宗师', color: '#FF4757', icon: '🏆' },
}

export default function PKBattle() {
  const toast = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'quick' | 'rooms' | 'friends' | 'rank'>('quick')
  const [rooms, setRooms] = useState<Room[]>([])
  const [rankInfo, setRankInfo] = useState<RankInfo | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [roomCode, setRoomCode] = useState('')

  // 创建房间表单
  const [createForm, setCreateForm] = useState({
    gameType: 'math-quiz',
    subject: 'math',
    difficulty: 'medium',
    questionCount: 10,
    timeLimit: 300,
    isPrivate: false
  })

  useEffect(() => {
    loadRankInfo()
    loadLeaderboard()
  }, [])

  useEffect(() => {
    if (activeTab === 'rooms') {
      loadRooms()
    }
  }, [activeTab])

  const loadRooms = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pk/rooms/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setRooms(data.data)
      }
    } catch (error) {
      console.error('加载房间列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRankInfo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pk/ranks/math-quiz', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setRankInfo(data.data)
      }
    } catch (error) {
      console.error('加载段位信息失败:', error)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pk/leaderboard/math-quiz?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setLeaderboard(data.data)
      }
    } catch (error) {
      console.error('加载排行榜失败:', error)
    }
  }

  const handleQuickMatch = async () => {
    // 快速匹配：创建房间并等待匹配
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pk/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameType: 'math-quiz',
          subject: 'math',
          difficulty: 'medium',
          questionCount: 10,
          timeLimit: 300,
          isPrivate: false
        })
      })
      const data = await response.json()
      if (data.success) {
        // 跳转到对战房间
        navigate(`/pk/room/${data.data.id}`)
      }
    } catch (error) {
      console.error('快速匹配失败:', error)
      toast.error('匹配失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pk/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      })
      const data = await response.json()
      if (data.success) {
        setCreateModalOpen(false)
        navigate(`/pk/room/${data.data.id}`)
      }
    } catch (error) {
      console.error('创建房间失败:', error)
      toast.error('创建失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async (roomId?: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pk/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomCode: roomId ? undefined : roomCode })
      })
      const data = await response.json()
      if (data.success) {
        setJoinModalOpen(false)
        navigate(`/pk/room/${data.data.id}`)
      } else {
        toast.info(data.message)
      }
    } catch (error) {
      console.error('加入房间失败:', error)
      toast.error('加入失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const getRankConfig = (rankLevel: string) => {
    return RANK_CONFIG[rankLevel] || RANK_CONFIG.bronze
  }

  return (
    <Layout>
      <Header
        title="多人竞技"
        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
      />

      <div className="pk-battle-container">
        {/* 段位信息卡片 */}
        {rankInfo && (
          <div className="rank-info-card">
            <div className="rank-badge">
              <span className="rank-icon">{getRankConfig(rankInfo.rank_level).icon}</span>
              <div className="rank-details">
                <div className="rank-name" style={{ color: getRankConfig(rankInfo.rank_level).color }}>
                  {getRankConfig(rankInfo.rank_level).name}
                </div>
                <div className="rank-points">{rankInfo.rank_points} 分</div>
              </div>
            </div>
            <div className="rank-stats">
              <div className="rank-stat">
                <span className="stat-value">{rankInfo.total_wins}</span>
                <span className="stat-label">胜场</span>
              </div>
              <div className="rank-stat">
                <span className="stat-value">{rankInfo.total_losses}</span>
                <span className="stat-label">败场</span>
              </div>
              <div className="rank-stat">
                <span className="stat-value">{rankInfo.win_streak}</span>
                <span className="stat-label">连胜</span>
              </div>
              <div className="rank-stat">
                <span className="stat-value">
                  {rankInfo.total_wins + rankInfo.total_losses > 0
                    ? Math.round((rankInfo.total_wins / (rankInfo.total_wins + rankInfo.total_losses)) * 100)
                    : 0}%
                </span>
                <span className="stat-label">胜率</span>
              </div>
            </div>
          </div>
        )}

        {/* 标签切换 */}
        <div className="pk-tabs">
          <button
            className={`pk-tab ${activeTab === 'quick' ? 'active' : ''}`}
            onClick={() => setActiveTab('quick')}
          >
            ⚡ 快速匹配
          </button>
          <button
            className={`pk-tab ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            🏠 房间列表
          </button>
          <button
            className={`pk-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            👥 好友对战
          </button>
          <button
            className={`pk-tab ${activeTab === 'rank' ? 'active' : ''}`}
            onClick={() => setActiveTab('rank')}
          >
            🏆 排行榜
          </button>
        </div>

        {/* 快速匹配 */}
        {activeTab === 'quick' && (
          <div className="tab-content">
            <div className="quick-match-area">
              <div className="quick-match-icon">⚔️</div>
              <h3>快速匹配</h3>
              <p>系统将自动为你匹配旗鼓相当的对手</p>
              <button
                className="btn-primary btn-large"
                onClick={handleQuickMatch}
                disabled={loading}
              >
                {loading ? '匹配中...' : '开始匹配'}
              </button>
            </div>

            <div className="quick-actions">
              <button className="action-btn" onClick={() => setCreateModalOpen(true)}>
                <span className="btn-icon">➕</span>
                创建房间
              </button>
              <button className="action-btn" onClick={() => setJoinModalOpen(true)}>
                <span className="btn-icon">🔑</span>
                输入房间码
              </button>
            </div>
          </div>
        )}

        {/* 房间列表 */}
        {activeTab === 'rooms' && (
          <div className="tab-content">
            <div className="rooms-list">
              {loading ? (
                <div className="loading">加载中...</div>
              ) : rooms.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏠</div>
                  <p>暂无可用房间</p>
                  <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                    创建房间
                  </button>
                </div>
              ) : (
                rooms.map((room) => (
                  <div key={room.id} className="room-card">
                    <div className="room-header">
                      <span className="room-code">{room.room_code}</span>
                      <span className="room-players">
                        {room.current_players}/2
                      </span>
                    </div>
                    <div className="room-info">
                      <div className="room-detail">
                        <span className="detail-label">科目:</span>
                        <span className="detail-value">{room.subject}</span>
                      </div>
                      <div className="room-detail">
                        <span className="detail-label">难度:</span>
                        <span className="detail-value">{room.difficulty}</span>
                      </div>
                      <div className="room-detail">
                        <span className="detail-label">题数:</span>
                        <span className="detail-value">{room.question_count}题</span>
                      </div>
                    </div>
                    <div className="room-footer">
                      <span className="room-creator">房主: {room.creator_name}</span>
                      <button
                        className="btn-join"
                        onClick={() => handleJoinRoom(room.id)}
                      >
                        加入房间
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 好友对战 */}
        {activeTab === 'friends' && (
          <div className="tab-content">
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>好友功能开发中...</p>
            </div>
          </div>
        )}

        {/* 排行榜 */}
        {activeTab === 'rank' && (
          <div className="tab-content">
            <div className="leaderboard">
              {leaderboard.map((player, index) => (
                <div key={player.user_id} className="leaderboard-item">
                  <div className="player-rank">
                    {index < 3 ? (
                      <span className="rank-medal">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="rank-number">{index + 1}</span>
                    )}
                  </div>
                  <div className="player-avatar">{player.avatar || '👤'}</div>
                  <div className="player-info">
                    <div className="player-name">{player.nickname}</div>
                    <div className="player-rank-badge">
                      {getRankConfig(player.rank_level).icon} {getRankConfig(player.rank_level).name}
                    </div>
                  </div>
                  <div className="player-stats">
                    <div className="stat-item">
                      <span className="stat-label">积分</span>
                      <span className="stat-value">{player.rank_points}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">胜场</span>
                      <span className="stat-value">{player.total_wins}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 创建房间弹窗 */}
        {createModalOpen && (
          <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>创建房间</h3>
                <button className="modal-close" onClick={() => setCreateModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>科目</label>
                  <select
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  >
                    <option value="math">数学</option>
                    <option value="chinese">语文</option>
                    <option value="english">英语</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>难度</label>
                  <select
                    value={createForm.difficulty}
                    onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value })}
                  >
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>题目数量</label>
                  <select
                    value={createForm.questionCount}
                    onChange={(e) => setCreateForm({ ...createForm, questionCount: parseInt(e.target.value) })}
                  >
                    <option value="5">5题</option>
                    <option value="10">10题</option>
                    <option value="20">20题</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={createForm.isPrivate}
                      onChange={(e) => setCreateForm({ ...createForm, isPrivate: e.target.checked })}
                    />
                    <span>私密房间</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  取消
                </button>
                <button className="btn-primary" onClick={handleCreateRoom} disabled={loading}>
                  {loading ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 加入房间弹窗 */}
        {joinModalOpen && (
          <div className="modal-overlay" onClick={() => setJoinModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>加入房间</h3>
                <button className="modal-close" onClick={() => setJoinModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>房间码</label>
                  <input
                    type="text"
                    placeholder="输入6位房间码"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setJoinModalOpen(false)}>
                  取消
                </button>
                <button
                  className="btn-primary"
                  onClick={() => handleJoinRoom()}
                  disabled={loading || roomCode.length !== 6}
                >
                  {loading ? '加入中...' : '加入'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
