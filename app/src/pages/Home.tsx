import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Home.css'

const features = [
  { icon: '🎨', title: 'AI绘画', desc: '说出你的想法，AI帮你画出来', path: '/art-creator', color: '#ff6b6b', bgColor: '#ffe5e5' },
  { icon: '🎵', title: 'AI音乐', desc: '创作专属你的音乐旋律', path: '/music-creator', color: '#4ecdc4', bgColor: '#e0f7f6' },
  { icon: '📖', title: 'AI故事', desc: '一起编写奇妙的童话故事', path: '/story-creator', color: '#a29bfe', bgColor: '#ededff' },
  { icon: '✍️', title: 'AI诗词', desc: '学习古诗词，创作小诗人', path: '/poem-creator', color: '#fd79a8', bgColor: '#ffeef5' },
]

const games = [
  { icon: '😊', title: '表情模仿秀', desc: '做个鬼脸，AI来认一认', path: '/expression-game', badge: '热门', color: '#fdcb6e', bgColor: '#fff8e1' },
  { icon: '🔍', title: '猜猜我是谁', desc: '拍张照片，看AI能不能猜对', path: '/image-recognition-game', badge: '新游戏', color: '#74b9ff', bgColor: '#e8f4ff' },
]

export default function Home() {
  const navigate = useNavigate()
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')

  return (
    <Layout>
      <Header title="启蒙之光" showBack={false} />
      <div className="main-content">
        {/* 欢迎卡片 */}
        <div className="welcome-section">
          <div className="welcome-avatar">{userProfile.avatar || '🌟'}</div>
          <div className="welcome-text">
            <h2>你好，{userProfile.nickname || '小朋友'}！</h2>
            <p>今天想玩什么呢？选一个试试吧 👇</p>
          </div>
        </div>

        {/* AI创作工坊 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">✨</span>
            AI创作工坊
          </div>
          <div className="section-subtitle">用AI释放你的创造力</div>
        </div>
        <div className="feature-grid-new">
          {features.map((item) => (
            <div
              key={item.path}
              className="feature-card-new"
              style={{ backgroundColor: item.bgColor }}
              onClick={() => navigate(item.path)}
            >
              <div className="feature-badge" style={{ backgroundColor: item.color }}>推荐</div>
              <div className="feature-icon-big" style={{ color: item.color }}>{item.icon}</div>
              <div className="feature-title-new">{item.title}</div>
              <div className="feature-desc-new">{item.desc}</div>
              <div className="feature-action">
                <span style={{ color: item.color }}>点击开始 →</span>
              </div>
            </div>
          ))}
        </div>

        {/* AI游戏实验室 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🎮</span>
            AI游戏实验室
          </div>
          <div className="section-subtitle">好玩又能学知识</div>
        </div>
        <div className="game-grid-new">
          {games.map((item) => (
            <div
              key={item.path}
              className="game-card-new"
              style={{ backgroundColor: item.bgColor }}
              onClick={() => navigate(item.path)}
            >
              {item.badge && (
                <div className="game-badge" style={{ backgroundColor: item.color }}>
                  {item.badge}
                </div>
              )}
              <div className="game-icon-big" style={{ color: item.color }}>{item.icon}</div>
              <div className="game-content">
                <div className="game-title-new">{item.title}</div>
                <div className="game-desc-new">{item.desc}</div>
                <div className="game-action" style={{ color: item.color }}>
                  开始游戏 →
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 心灵花园 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">💝</span>
            心灵花园
          </div>
          <div className="section-subtitle">记录心情，让心灵更健康</div>
        </div>
        <div className="garden-card-new" onClick={() => navigate('/mind-garden')}>
          <div className="garden-icon-big">🌸</div>
          <div className="garden-content">
            <div className="garden-title-new">进入心灵花园</div>
            <div className="garden-desc-new">今天心情怎么样？来记录一下吧</div>
            <div className="garden-action">开始记录 →</div>
          </div>
          <div className="garden-decoration">🌈✨🦋</div>
        </div>
      </div>
    </Layout>
  )
}
