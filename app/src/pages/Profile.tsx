import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Profile.css'

const stats = [
  { label: '创作数', value: 15 },
  { label: '获赞数', value: 128 },
  { label: '积分', value: 860 },
]

const achievements = [
  { icon: '🎨', title: '小画家', desc: '完成10幅画作' },
  { icon: '📖', title: '故事大王', desc: '创作5个故事' },
  { icon: '🎵', title: '音乐达人', desc: '创作3首音乐' },
]

const menuItems = [
  { icon: '📁', title: '我的作品', path: '/my-works' },
  { icon: '❤️', title: '我的收藏', path: '/favorites' },
  { icon: '📊', title: '能力评估', path: '/assessment' },
  { icon: '⚙️', title: '设置', path: '/settings' },
]

export default function Profile() {
  const navigate = useNavigate()
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')

  return (
    <Layout>
      <Header title="个人中心" gradient="linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)" />
      <div className="main-content">
        <div className="profile-card">
          <div className="profile-avatar">{userProfile.avatar || '🌟'}</div>
          <div className="profile-name">{userProfile.nickname || '小朋友'}</div>
          <div className="profile-age">{userProfile.age || 8}岁小朋友</div>
          <div className="profile-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-title">我的成就</div>
        <div className="achievements-grid">
          {achievements.map((item) => (
            <div key={item.title} className="achievement-card">
              <div className="achievement-icon">{item.icon}</div>
              <div className="achievement-title">{item.title}</div>
              <div className="achievement-desc">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="section-title">功能菜单</div>
        <div className="menu-list">
          {menuItems.map((item) => (
            <div
              key={item.path}
              className="menu-item"
              onClick={() => navigate(item.path)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-title">{item.title}</span>
              <span className="menu-arrow">→</span>
            </div>
          ))}
        </div>

        <div className="level-card">
          <div className="level-info">
            <span className="level-badge">Lv.5</span>
            <span className="level-title">创意小达人</span>
          </div>
          <div className="level-progress">
            <div className="level-bar" style={{ width: '65%' }}></div>
          </div>
          <div className="level-text">距离下一级还需 140 积分</div>
        </div>
      </div>
    </Layout>
  )
}
