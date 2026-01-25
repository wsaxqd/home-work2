import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { contentControlManager, type ContentControlSettings } from '../../services/contentControl'
import { useToast } from '../Toast'
import './BottomNav.css'

const navItems = [
  {
    path: '/home',
    icon: '🏠',
    text: '首页',
    gradient: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
    activeColor: '#66bb6a',
    contentType: null // 首页不受限制
  },
  {
    path: '/create',
    icon: '✨',
    text: '创作',
    gradient: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
    activeColor: '#ffa726',
    contentType: 'creation' as const
  },
  {
    path: '/games',
    icon: '🎮',
    text: '游戏',
    gradient: 'linear-gradient(135deg, #ffca28 0%, #ffa000 100%)',
    activeColor: '#ffca28',
    contentType: 'games' as const
  },
  {
    path: '/warm-house',
    icon: '💝',
    text: '温暖',
    gradient: 'linear-gradient(135deg, #ff7043 0%, #f4511e 100%)',
    activeColor: '#ff7043',
    contentType: null // 温暖小屋不受限制，公益功能
  },
  {
    path: '/profile',
    icon: '👤',
    text: '我的',
    gradient: 'linear-gradient(135deg, #26c6da 0%, #00acc1 100%)',
    activeColor: '#26c6da',
    contentType: null // 个人中心不受限制
  },
]

export default function BottomNav() {
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [contentSettings, setContentSettings] = useState<ContentControlSettings | null>(null)

  useEffect(() => {
    // 加载内容访问控制设置
    const loadSettings = async () => {
      try {
        const settings = await contentControlManager.loadSettings()
        setContentSettings(settings)
      } catch (error) {
        console.error('加载内容控制设置失败:', error)
        // 即使加载失败,也设置为null,允许继续使用
        setContentSettings(null)
      }
    }
    loadSettings()
  }, [])

  const handleNavClick = async (item: typeof navItems[0]) => {
    // 如果有内容类型限制，检查是否允许访问
    if (item.contentType) {
      try {
        const canAccess = await contentControlManager.canAccess(item.contentType)
        if (!canAccess) {
          toast.info(`家长已限制访问${item.text}功能`)
          return
        }
      } catch (error) {
        console.error('检查访问权限失败:', error)
        // 出错时默认允许访问
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
