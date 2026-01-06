import { useNavigate, useLocation } from 'react-router-dom'
import './BottomNav.css'

const navItems = [
  {
    path: '/home',
    icon: '🏠',
    text: '首页',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    activeColor: '#667eea'
  },
  {
    path: '/create',
    icon: '✨',
    text: '创作',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    activeColor: '#f093fb'
  },
  {
    path: '/games',
    icon: '🎮',
    text: '探索',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    activeColor: '#fa709a'
  },
  {
    path: '/story-library',
    icon: '📚',
    text: '作品',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    activeColor: '#4facfe'
  },
  {
    path: '/profile',
    icon: '👤',
    text: '我的',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    activeColor: '#43e97b'
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="bottom-nav">
      <div className="nav-background"></div>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <div
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            style={{
              '--item-gradient': item.gradient,
              '--item-color': item.activeColor,
            } as React.CSSProperties}
          >
            <div className="nav-icon-wrapper">
              <div className="nav-icon">{item.icon}</div>
              {isActive && <div className="icon-glow"></div>}
            </div>
            <div className="nav-text">{item.text}</div>
            {isActive && <div className="active-dot"></div>}
          </div>
        )
      })}
    </div>
  )
}
