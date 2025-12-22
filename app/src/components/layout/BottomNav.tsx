import { useNavigate, useLocation } from 'react-router-dom'
import './BottomNav.css'

const navItems = [
  { path: '/create', icon: '✨', text: 'AI创作', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { path: '/games', icon: '🎮', text: 'AI游戏', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { path: '/mind-garden', icon: '💝', text: '心灵花园', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { path: '/profile', icon: '👤', text: '我的', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="bottom-nav">
      {navItems.map((item) => (
        <div
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <div className="nav-icon">{item.icon}</div>
          <div className="nav-text">{item.text}</div>
        </div>
      ))}
    </div>
  )
}
