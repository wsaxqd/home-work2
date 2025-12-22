import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Profile.css'

const stats = [
  { label: '创作数', value: 15, icon: '🎨' },
  { label: '获赞数', value: 128, icon: '👍' },
  { label: '积分', value: 860, icon: '⭐' },
]

const achievements = [
  { icon: '🎨', title: '小画家', desc: '完成10幅画作', progress: 100 },
  { icon: '📖', title: '故事大王', desc: '创作5个故事', progress: 80 },
  { icon: '🎵', title: '音乐达人', desc: '创作3首音乐', progress: 60 },
]

const menuItems = [
  { icon: '💝', title: '心灵花园', desc: '记录今天的心情', path: '/mind-garden', color: '#a8edea', bgColor: '#e0f7f6' },
  { icon: '📊', title: '能力评估', desc: '测测你的小能力', path: '/assessment', color: '#4facfe', bgColor: '#e8f4ff' },
  { icon: '📁', title: '我的作品', desc: '查看创作的内容', path: '/my-works', color: '#f093fb', bgColor: '#ffeef5' },
  { icon: '❤️', title: '我的收藏', desc: '喜欢的作品集合', path: '/favorites', color: '#fdcb6e', bgColor: '#fff8e1' },
]

export default function Profile() {
  const navigate = useNavigate()
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')

  return (
    <Layout>
      <Header title="个人中心" gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" />
      <div className="main-content">
        {/* 个人信息卡 */}
        <div className="profile-card-new">
          <div className="profile-avatar-big">{userProfile.avatar || '🌟'}</div>
          <div className="profile-info">
            <div className="profile-name-big">{userProfile.nickname || '小朋友'}</div>
            <div className="profile-age-big">
              {userProfile.age || 8}岁 · Lv.5 创意小达人
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

        {/* 成就展示 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🏆</span>
            我的成就
          </div>
          <div className="section-subtitle">继续努力，解锁更多成就</div>
        </div>
        <div className="achievements-list">
          {achievements.map((item) => (
            <div key={item.title} className="achievement-card-new">
              <div className="achievement-icon-big">{item.icon}</div>
              <div className="achievement-info">
                <div className="achievement-title-new">{item.title}</div>
                <div className="achievement-desc-new">{item.desc}</div>
                <div className="achievement-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${item.progress}%` }}></div>
                  </div>
                  <div className="progress-text">{item.progress}%</div>
                </div>
              </div>
            </div>
          ))}
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
