import { useNavigate } from 'react-router-dom'
import './Header.css'

interface HeaderProps {
  title: string
  gradient?: string
  showBack?: boolean
  showLogout?: boolean
  rightContent?: React.ReactNode
}

export default function Header({
  title,
  gradient = 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
  showBack = true,
  showLogout = false,
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

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      localStorage.removeItem('token')
      localStorage.removeItem('userProfile')
      navigate('/login')
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
        {showLogout && (
          <div className="logout-button" onClick={handleLogout}>
            退出
          </div>
        )}
        {rightContent}
      </div>
    </div>
  )
}
