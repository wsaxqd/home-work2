import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './UserProfile.css'

interface UserInfo {
  id: string
  nickname: string
  avatar: string
  bio: string
  stats: {
    works: number
    followers: number
    following: number
  }
  isFollowing: boolean
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'works' | 'likes'>('works')

  useEffect(() => {
    loadUserProfile()
  }, [id])

  const loadUserProfile = async () => {
    setLoading(true)
    try {
      // TODO: 调用API获取用户信息
      const mockUser: UserInfo = {
        id: id || '1',
        nickname: '小明同学',
        avatar: '👦',
        bio: '热爱学习,喜欢创作',
        stats: { works: 12, followers: 156, following: 89 },
        isFollowing: false
      }
      setUser(mockUser)
    } catch (error) {
      console.error('加载用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!user) return
    try {
      // TODO: 调用关注/取消关注API
      setUser({ ...user, isFollowing: !user.isFollowing })
    } catch (error) {
      alert('操作失败')
    }
  }

  if (loading) {
    return (
      <Layout>
        <Header title="用户主页" showBack={true} />
        <div className="main-content" style={{ textAlign: 'center', padding: '40px' }}>
          加载中...
        </div>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <Header title="用户主页" showBack={true} />
        <div className="main-content" style={{ textAlign: 'center', padding: '40px' }}>
          用户不存在
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Header title="用户主页" showBack={true} />
      <div className="main-content user-profile-page">
        <div className="profile-header">
          <div className="avatar-large">{user.avatar}</div>
          <h2 className="username">{user.nickname}</h2>
          <p className="user-bio">{user.bio}</p>

          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-value">{user.stats.works}</div>
              <div className="stat-label">作品</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{user.stats.followers}</div>
              <div className="stat-label">粉丝</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{user.stats.following}</div>
              <div className="stat-label">关注</div>
            </div>
          </div>

          <button
            className={`follow-button ${user.isFollowing ? 'following' : ''}`}
            onClick={handleFollow}
          >
            {user.isFollowing ? '已关注' : '关注'}
          </button>
        </div>

        <div className="content-tabs">
          <button
            className={`tab ${activeTab === 'works' ? 'active' : ''}`}
            onClick={() => setActiveTab('works')}
          >
            作品
          </button>
          <button
            className={`tab ${activeTab === 'likes' ? 'active' : ''}`}
            onClick={() => setActiveTab('likes')}
          >
            喜欢
          </button>
        </div>

        <div className="content-section">
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-text">暂无内容</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
