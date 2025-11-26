import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Splash.css'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login')
    }, 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="splash-container">
      <div className="splash-content">
        <div className="splash-logo">
          <span className="logo-icon">🌟</span>
        </div>
        <h1 className="splash-title">启蒙之光</h1>
        <p className="splash-subtitle">AI赋能儿童情感与创造力</p>
        <div className="splash-loading">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      <div className="splash-footer">
        <p>专为3-12岁儿童设计</p>
      </div>
    </div>
  )
}
