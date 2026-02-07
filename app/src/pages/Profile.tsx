import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { authApi, worksApi } from '../services/api'
import type { User } from '../types'
import './Profile.css'

const menuItems = [
  { icon: '📅', title: '每日签到', desc: '签到领积分奖励', path: '/checkin', color: '#fa709a', bgColor: '#ffe5f0' },
  { icon: '🎯', title: '每日任务', desc: '完成任务赚积分', path: '/daily-tasks', color: '#fdcb6e', bgColor: '#fff8e1' },
  { icon: '🎓', title: '学习路径', desc: 'AI个性化学习计划', path: '/weak-point-diagnosis', color: '#ff9f43', bgColor: '#fff4e6' },
  { icon: '🏆', title: '积分排行', desc: '查看积分排行榜', path: '/coins-ranking', color: '#f093fb', bgColor: '#ffeef5' },
  { icon: '📬', title: '消息中心', desc: '查看系统消息通知', path: '/messages', color: '#667eea', bgColor: '#e8f0fe' },
  { icon: '💝', title: '温暖小屋', desc: '情感陪伴与心灵关怀', path: '/warm-house', color: '#ff7043', bgColor: '#ffe5e0' },
  { icon: '📁', title: '我的作品', desc: '查看创作的内容', path: '/my-works', color: '#f093fb', bgColor: '#ffeef5' },
  { icon: '❤️', title: '我的收藏', desc: '喜欢的作品集合', path: '/favorites', color: '#fdcb6e', bgColor: '#fff8e1' },
  { icon: '🏅', title: '成就中心', desc: '查看学习成就', path: '/checkin-achievements', color: '#4facfe', bgColor: '#e8f4ff' },
  { icon: '⚙️', title: '设置', desc: '账户与偏好设置', path: '/settings', color: '#95a5a6', bgColor: '#ecf0f1' },
]

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState([
    { label: '创作数', value: 0, icon: '🎨' },
    { label: '获赞数', value: 0, icon: '👍' },
    { label: '积分', value: 0, icon: '⭐' },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setLoading(true)

    try {
      // 获取当前用户信息
      const userResponse = await authApi.getCurrentUser()

      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data)

        // 更新统计数据
        const worksResponse = await worksApi.getMyWorks({ page: 1, limit: 1 })
        const worksCount = worksResponse.data?.total || 0

        setStats([
          { label: '创作数', value: worksCount, icon: '🎨' },
          { label: '获赞数', value: 0, icon: '👍' },
          { label: '积分', value: userResponse.data.coins || 0, icon: '⭐' },
        ])
      } else {
        // 如果获取失败，使用localStorage的数据
        const localProfile = localStorage.getItem('userProfile')
        if (localProfile) {
          const profile = JSON.parse(localProfile)
          setUser(profile)
        }
      }
    } catch (err) {
      console.error('加载用户数据失败', err)
      // 回退到localStorage
      const localProfile = localStorage.getItem('userProfile')
      if (localProfile) {
        setUser(JSON.parse(localProfile))
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Header
          title="个人中心"
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          showBack={false}
          showLogout={true}
        />
        <div className="main-content" style={{ textAlign: 'center', padding: '40px' }}>
          <div>加载中...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Header
        title="个人中心"
        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        showBack={false}
        showLogout={true}
      />
      <div className="main-content">
        {/* 紧凑型个人信息 + 统计 */}
        <div className="profile-compact-header">
          <div className="profile-top-row">
            <div className="profile-user-section">
              <div className="profile-avatar-compact">{user?.avatar || '🌟'}</div>
              <div className="profile-text-compact">
                <div className="profile-name-compact">{user?.nickname || user?.username || '小朋友'}</div>
                <div className="profile-meta-compact">
                  Lv.{user?.level || 1} · {user?.age || 8}岁
                </div>
              </div>
            </div>
            <div className="profile-level-badge">
              <div className="level-badge-icon">🏆</div>
              <div className="level-badge-text">Lv.{user?.level || 1}</div>
            </div>
          </div>

          {/* 横向统计条 */}
          <div className="stats-row-compact">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-item-compact">
                <span className="stat-icon-compact">{stat.icon}</span>
                <span className="stat-value-compact">{stat.value}</span>
                <span className="stat-label-compact">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 快捷功能网格 - 直接显示核心功能 */}
        <div className="quick-grid-compact">
          <div className="grid-item" onClick={() => navigate('/checkin')}>
            <div className="grid-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>📅</div>
            <div className="grid-label">每日签到</div>
          </div>
          <div className="grid-item" onClick={() => navigate('/daily-tasks')}>
            <div className="grid-icon" style={{ background: 'linear-gradient(135deg, #fdcb6e 0%, #f39c12 100%)' }}>🎯</div>
            <div className="grid-label">每日任务</div>
          </div>
          <div className="grid-item" onClick={() => navigate('/weak-point-diagnosis')}>
            <div className="grid-icon" style={{ background: 'linear-gradient(135deg, #ff9f43 0%, #ee5a24 100%)' }}>🎓</div>
            <div className="grid-label">学习路径</div>
          </div>
          <div className="grid-item" onClick={() => navigate('/coins-ranking')}>
            <div className="grid-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>🏆</div>
            <div className="grid-label">积分排行</div>
          </div>
        </div>

        {/* 更多功能 */}
        <div className="more-functions">
          <div className="function-row" onClick={() => navigate('/messages')}>
            <div className="function-icon">📬</div>
            <div className="function-text">
              <div className="function-title">消息中心</div>
              <div className="function-desc">查看系统消息通知</div>
            </div>
            <div className="function-arrow">→</div>
          </div>
          <div className="function-row" onClick={() => navigate('/warm-house')}>
            <div className="function-icon">💝</div>
            <div className="function-text">
              <div className="function-title">温暖小屋</div>
              <div className="function-desc">情感陪伴与心灵关怀</div>
            </div>
            <div className="function-arrow">→</div>
          </div>
          <div className="function-row" onClick={() => navigate('/my-works')}>
            <div className="function-icon">📁</div>
            <div className="function-text">
              <div className="function-title">我的作品</div>
              <div className="function-desc">查看创作的内容</div>
            </div>
            <div className="function-arrow">→</div>
          </div>
          <div className="function-row" onClick={() => navigate('/favorites')}>
            <div className="function-icon">❤️</div>
            <div className="function-text">
              <div className="function-title">我的收藏</div>
              <div className="function-desc">喜欢的作品集合</div>
            </div>
            <div className="function-arrow">→</div>
          </div>
          <div className="function-row" onClick={() => navigate('/checkin-achievements')}>
            <div className="function-icon">🏅</div>
            <div className="function-text">
              <div className="function-title">成就中心</div>
              <div className="function-desc">查看学习成就</div>
            </div>
            <div className="function-arrow">→</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
