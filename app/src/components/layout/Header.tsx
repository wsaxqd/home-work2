import { useNavigate } from 'react-router-dom'
import './Header.css'

interface HeaderProps {
  title: string
  gradient?: string
  showBack?: boolean
  showLogout?: boolean // 保留兼容性，但不再使用（由Layout的LogoutButton处理）
  rightContent?: React.ReactNode
}

export default function Header({
  title,
  gradient = 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
  showBack = true,
  rightContent
}: HeaderProps) {
  const navigate = useNavigate()

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/create')
    }
  }

  return (
    <div className="header" style={{ background: gradient }}>
      {showBack ? (
        <div className="back-button" onClick={goBack}>←</div>
      ) : (
        <div style={{ width: 24 }} />
      )}
      <div className="page-title">{title}</div>
      <div className="header-right">
        {rightContent}
      </div>
    </div>
  )
}
