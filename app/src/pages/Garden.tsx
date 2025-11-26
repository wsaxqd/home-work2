import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Garden.css'

export default function Garden() {
  const navigate = useNavigate()

  return (
    <Layout>
      <Header title="心灵花园" gradient="linear-gradient(135deg, #e91e63 0%, #ff5722 100%)" />
      <div className="main-content">
        <div className="garden-welcome">
          <div className="welcome-icon">🌸</div>
          <h2>欢迎来到心灵花园</h2>
          <p>这里是你的情绪小天地</p>
        </div>

        <div className="garden-options">
          <div className="garden-option" onClick={() => navigate('/mind-garden')}>
            <div className="option-icon">📝</div>
            <div className="option-info">
              <div className="option-title">记录心情</div>
              <div className="option-desc">写下今天的感受</div>
            </div>
            <div className="option-arrow">→</div>
          </div>

          <div className="garden-option" onClick={() => navigate('/mind-garden')}>
            <div className="option-icon">🌱</div>
            <div className="option-info">
              <div className="option-title">我的花园</div>
              <div className="option-desc">查看成长记录</div>
            </div>
            <div className="option-arrow">→</div>
          </div>

          <div className="garden-option" onClick={() => navigate('/assessment')}>
            <div className="option-icon">📊</div>
            <div className="option-info">
              <div className="option-title">情绪报告</div>
              <div className="option-desc">了解情绪变化</div>
            </div>
            <div className="option-arrow">→</div>
          </div>

          <div className="garden-option">
            <div className="option-icon">🎮</div>
            <div className="option-info">
              <div className="option-title">情绪小游戏</div>
              <div className="option-desc">放松心情</div>
            </div>
            <div className="option-arrow">→</div>
          </div>
        </div>

        <div className="section-title">情绪小贴士</div>
        <div className="tips-carousel">
          <div className="tip-card">
            <div className="tip-emoji">😊</div>
            <div className="tip-text">保持微笑可以让心情变好哦！</div>
          </div>
          <div className="tip-card">
            <div className="tip-emoji">🌈</div>
            <div className="tip-text">每天发现一件美好的事情</div>
          </div>
          <div className="tip-card">
            <div className="tip-emoji">💪</div>
            <div className="tip-text">遇到困难时深呼吸</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
