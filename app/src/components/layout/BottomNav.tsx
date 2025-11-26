import { useNavigate, useLocation } from 'react-router-dom'
import './BottomNav.css'

const navItems = [
  { path: '/', icon: '🏠', text: '首页' },
  { path: '/explore', icon: '🔍', text: '探索' },
  { path: '/create', icon: '🎨', text: '创作' },
  { path: '/mind-garden', icon: '💝', text: '心灵' },
  { path: '/profile', icon: '👤', text: '我的' },
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
