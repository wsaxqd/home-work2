import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LogoutButton.css'

export default function LogoutButton() {
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleLogout = () => {
    setShowConfirm(true)
  }

  const confirmLogout = () => {
    localStorage.removeItem('userProfile')
    localStorage.removeItem('token')
    navigate('/login')
  }

  const cancelLogout = () => {
    setShowConfirm(false)
  }

  return (
    <>
      <button className="logout-button" onClick={handleLogout}>
        <span className="logout-icon">🚪</span>
        <span className="logout-text">退出</span>
      </button>

      {showConfirm && (
        <div className="logout-modal-overlay" onClick={cancelLogout}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-icon">⚠️</div>
            <h3 className="logout-modal-title">确认退出</h3>
            <p className="logout-modal-text">你确定要退出登录吗？</p>
            <div className="logout-modal-actions">
              <button className="logout-modal-btn cancel" onClick={cancelLogout}>
                取消
              </button>
              <button className="logout-modal-btn confirm" onClick={confirmLogout}>
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
