import { useNavigate } from 'react-router-dom'
import './Header.css'

interface HeaderProps {
  title: string
  subtitle?: string // 副标题（用于首页显示使命）
  gradient?: string
  showBack?: boolean
  showLogout?: boolean // 保留兼容性，但不再使用（由Layout的LogoutButton处理）
  rightContent?: React.ReactNode
  onBack?: () => void | Promise<void> // 支持自定义返回逻辑
}

export default function Header({
  title,
  subtitle,
  gradient = 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
  showBack = true,
  rightContent,
  onBack
}: HeaderProps) {
  const navigate = useNavigate()

  const goBack = () => {
    if (onBack) {
      onBack()
    } else if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/create')
    }
  }

  return (
    <div className={`header ${subtitle ? 'header-with-subtitle' : ''}`} style={{ background: gradient }}>
      {showBack ? (
        <div className="back-button" onClick={goBack}>←</div>
      ) : (
        <div style={{ width: 24 }} />
      )}
      <div className="header-title-wrapper">
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      <div className="header-right">
        {rightContent}
      </div>
    </div>
  )
}
