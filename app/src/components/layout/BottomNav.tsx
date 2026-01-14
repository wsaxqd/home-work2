import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { contentControlManager, type ContentControlSettings } from '../../services/contentControl'
import './BottomNav.css'

const navItems = [
  {
    path: '/home',
    icon: '🏠',
    text: '首页',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    activeColor: '#667eea',
    contentType: null // 首页不受限制
  },
  {
    path: '/create',
    icon: '✨',
    text: '创作',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    activeColor: '#f093fb',
    contentType: 'creation' as const
  },
  {
    path: '/games',
    icon: '🎮',
    text: '游戏',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    activeColor: '#fa709a',
    contentType: 'games' as const
  },
  {
    path: '/profile',
    icon: '👤',
    text: '我的',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    activeColor: '#43e97b',
    contentType: null // 个人中心不受限制
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [contentSettings, setContentSettings] = useState<ContentControlSettings | null>(null)

  useEffect(() => {
    // 加载内容访问控制设置
    const loadSettings = async () => {
      const settings = await contentControlManager.loadSettings()
      setContentSettings(settings)
    }
    loadSettings()
  }, [])

  const handleNavClick = async (item: typeof navItems[0]) => {
    // 如果有内容类型限制，检查是否允许访问
    if (item.contentType) {
      const canAccess = await contentControlManager.canAccess(item.contentType)
      if (!canAccess) {
        alert(`家长已限制访问${item.text}功能`)
        return
      }
    }
    navigate(item.path)
  }

  return (
    <div className="bottom-nav">
      <div className="nav-background"></div>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        // 检查是否被限制
        const isRestricted = item.contentType && contentSettings && contentSettings[item.contentType] === false

        return (
          <div
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''} ${isRestricted ? 'restricted' : ''}`}
            onClick={() => handleNavClick(item)}
            style={{
              '--item-gradient': item.gradient,
              '--item-color': item.activeColor,
              opacity: isRestricted ? 0.5 : 1,
            } as React.CSSProperties}
          >
            <div className="nav-icon-wrapper">
              <div className="nav-icon">{item.icon}</div>
              {isActive && <div className="icon-glow"></div>}
              {isRestricted && <div className="lock-badge">🔒</div>}
            </div>
            <div className="nav-text">{item.text}</div>
            {isActive && <div className="active-dot"></div>}
          </div>
        )
      })}
    </div>
  )
}
