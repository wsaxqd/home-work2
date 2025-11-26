import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Home.css'

const features = [
  { icon: '🎨', title: 'AI绘画', desc: '和AI一起创作艺术', path: '/art-creator' },
  { icon: '🎵', title: 'AI音乐', desc: '创造属于你的旋律', path: '/music-creator' },
  { icon: '📖', title: 'AI故事', desc: '编织奇幻童话', path: '/story-creator' },
  { icon: '✍️', title: 'AI诗词', desc: '学习创作诗词', path: '/poem-creator' },
]

const games = [
  { icon: '😊', title: '表情模仿秀', desc: 'AI识别你的表情', path: '/expression-game' },
  { icon: '🔍', title: '猜猜我是谁', desc: 'AI图像识别游戏', path: '/image-recognition-game' },
]

export default function Home() {
  const navigate = useNavigate()
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')

  return (
    <Layout>
      <Header title="启蒙之光" showBack={false} />
      <div className="main-content">
        <div className="welcome-section">
          <div className="welcome-avatar">{userProfile.avatar || '🌟'}</div>
          <div className="welcome-text">
            <h2>你好，{userProfile.nickname || '小朋友'}！</h2>
            <p>今天想要探索什么呢？</p>
          </div>
        </div>

        <div className="section-title">AI创作工坊</div>
        <div className="feature-grid">
          {features.map((item) => (
            <div
              key={item.path}
              className="feature-card"
              onClick={() => navigate(item.path)}
            >
              <div className="feature-icon">{item.icon}</div>
              <div className="feature-title">{item.title}</div>
              <div className="feature-desc">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="section-title">AI游戏实验室</div>
        <div className="game-list">
          {games.map((item) => (
            <div
              key={item.path}
              className="game-card"
              onClick={() => navigate(item.path)}
            >
              <div className="game-icon">{item.icon}</div>
              <div className="game-info">
                <div className="game-title">{item.title}</div>
                <div className="game-desc">{item.desc}</div>
              </div>
              <div className="game-arrow">→</div>
            </div>
          ))}
        </div>

        <div className="section-title">心灵花园</div>
        <div className="garden-card" onClick={() => navigate('/mind-garden')}>
          <div className="garden-icon">🌸</div>
          <div className="garden-info">
            <div className="garden-title">进入心灵花园</div>
            <div className="garden-desc">记录心情，培养积极情绪</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
