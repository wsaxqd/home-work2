import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Games.css'

const gameItems = [
  { icon: '😊', title: '表情识别', desc: '识别不同的表情，学习情感管理', path: '/expression-game', color: '#feca57', bgColor: '#fff9e6', difficulty: '简单', tips: '认识6种基本表情' },
  { icon: '🖼️', title: '图像认知', desc: '识别物品和场景，提升观察力', path: '/image-recognition-game', color: '#48dbfb', bgColor: '#e3f9ff', difficulty: '中等', tips: '挑战100+种物品' },
  { icon: '🎯', title: '更多游戏', desc: '更多有趣的AI游戏即将上线', path: '/games', color: '#ff6348', bgColor: '#ffe5e1', difficulty: '敬请期待', tips: '持续更新中...' },
]

export default function Games() {
  const navigate = useNavigate()

  return (
    <Layout>
      <Header
        title="AI游戏乐园"
        gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        showBack={false}
        showLogout={true}
      />
      <div className="main-content">
        <div className="games-intro">
          <div className="intro-icon-big">🎮</div>
          <div className="intro-content">
            <h3>边玩边学习</h3>
            <p>通过AI游戏，提升你的观察力和认知能力！</p>
          </div>
        </div>

        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🌟</span>
            热门游戏
          </div>
          <div className="section-subtitle">选择一个游戏开始挑战吧</div>
        </div>

        <div className="games-grid">
          {gameItems.map((item) => (
            <div
              key={item.path}
              className="game-card"
              style={{ backgroundColor: item.bgColor, borderColor: item.color }}
              onClick={() => item.path !== '/games' && navigate(item.path)}
            >
              <div className="game-header">
                <div className="game-icon-huge" style={{ color: item.color }}>{item.icon}</div>
                <div className="game-badge" style={{ backgroundColor: item.color }}>
                  {item.difficulty}
                </div>
              </div>
              <div className="game-title">{item.title}</div>
              <div className="game-desc">{item.desc}</div>
              <div className="game-tips">
                <span className="tips-label">💡 特色：</span>
                <span className="tips-text">{item.tips}</span>
              </div>
              {item.path !== '/games' && (
                <div className="play-button" style={{ background: item.color }}>
                  开始游戏 →
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="stats-card">
          <div className="stats-icon">📊</div>
          <div className="stats-content">
            <div className="stats-title">我的游戏记录</div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">游戏次数</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">最高分</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">通关数</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
