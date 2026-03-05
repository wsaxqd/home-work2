import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useCallback, memo } from 'react'
import { contentControlManager, type ContentControlSettings } from '../../services/contentControl'
import { useToast } from '../Toast'
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
    path: '/learning-map',
    icon: '📚',
    text: '学习',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    activeColor: '#4facfe',
    contentType: null // 学习功能不受限制
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
    path: '/create',
    icon: '✨',
    text: '创作',
    gradient: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
    activeColor: '#ffa726',
    contentType: 'creation' as const
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

function BottomNav() {
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

  const handleNavClick = useCallback(async (item: typeof navItems[0]) => {
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
  }, [navigate, toast])

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

export default memo(BottomNav)
