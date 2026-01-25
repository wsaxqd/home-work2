import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { authApi, worksApi } from '../services/api'
import type { User } from '../types'
import './Profile.css'

const menuItems = [
  { icon: '📅', title: '每日签到', desc: '签到领积分奖励', path: '/checkin', color: '#fa709a', bgColor: '#ffe5f0' },
  { icon: '💝', title: '心灵花园', desc: '记录今天的心情', path: '/mind-garden', color: '#a8edea', bgColor: '#e0f7f6' },
  { icon: '📊', title: '能力评估', desc: '测测你的小能力', path: '/assessment', color: '#4facfe', bgColor: '#e8f4ff' },
  { icon: '📁', title: '我的作品', desc: '查看创作的内容', path: '/my-works', color: '#f093fb', bgColor: '#ffeef5' },
  { icon: '❤️', title: '我的收藏', desc: '喜欢的作品集合', path: '/favorites', color: '#fdcb6e', bgColor: '#fff8e1' },
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
        {/* 个人信息卡 */}
        <div className="profile-card-new">
          <div className="profile-avatar-big">{user?.avatar || '🌟'}</div>
          <div className="profile-info">
            <div className="profile-name-big">{user?.nickname || user?.username || '小朋友'}</div>
            <div className="profile-age-big">
              {user?.age || 8}岁 · Lv.{user?.level || 1} {user?.level && user.level > 5 ? '创意大师' : '创意小达人'}
            </div>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card-new">
              <div className="stat-icon-big">{stat.icon}</div>
              <div className="stat-value-big">{stat.value}</div>
              <div className="stat-label-new">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 学生信息区块 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">👤</span>
            学生信息
          </div>
          <div className="section-subtitle">我的基本资料</div>
        </div>
        <div className="student-info-card">
          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">👤</span>
              用户名
            </div>
            <div className="info-value">{user?.username || '-'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">✨</span>
              昵称
            </div>
            <div className="info-value">{user?.nickname || '-'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">🎂</span>
              年龄
            </div>
            <div className="info-value">{user?.age || '-'}岁</div>
          </div>
          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">🎯</span>
              等级
            </div>
            <div className="info-value">Lv.{user?.level || 1}</div>
          </div>
          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">⭐</span>
              积分
            </div>
            <div className="info-value">{user?.coins || 0}</div>
          </div>
          <div className="info-row">
            <div className="info-label">
              <span className="info-icon">📧</span>
              邮箱
            </div>
            <div className="info-value">{user?.email || '未设置'}</div>
          </div>
        </div>

        {/* 成就展示 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🏆</span>
            我的成就
          </div>
          <div className="section-subtitle">继续努力，解锁更多成就</div>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          暂无成就，快去完成任务解锁吧！
        </div>

        {/* 功能入口 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🎯</span>
            快捷入口
          </div>
          <div className="section-subtitle">常用功能都在这里</div>
        </div>
        <div className="menu-grid-new">
          {menuItems.map((item) => (
            <div
              key={item.path}
              className="menu-card-new"
              style={{ backgroundColor: item.bgColor }}
              onClick={() => navigate(item.path)}
            >
              <div className="menu-icon-big" style={{ color: item.color }}>{item.icon}</div>
              <div className="menu-title-new">{item.title}</div>
              <div className="menu-desc-new">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
