import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Create.css'

const createItems = [
  { icon: '🎨', title: 'AI魔法画布', desc: '用语言描述，AI帮你绘画', path: '/art-creator', color: '#ff9800' },
  { icon: '🎵', title: 'AI音乐画布', desc: '绘制旋律，创造音乐', path: '/music-creator', color: '#2196f3' },
  { icon: '📖', title: 'AI童话制造机', desc: '创作属于你的故事', path: '/story-creator', color: '#9c27b0' },
  { icon: '✍️', title: 'AI诗词助手', desc: '学习创作优美诗词', path: '/poem-creator', color: '#4caf50' },
]

const recentWorks = [
  { icon: '🖼️', title: '我的彩虹城堡', type: '绘画', time: '昨天' },
  { icon: '🎵', title: '快乐的一天', type: '音乐', time: '2天前' },
  { icon: '📖', title: '小兔子的冒险', type: '故事', time: '3天前' },
]

export default function Create() {
  const navigate = useNavigate()

  return (
    <Layout>
      <Header title="创意工坊" gradient="linear-gradient(135deg, #ff9800 0%, #ff5722 100%)" />
      <div className="main-content">
        <div className="create-intro">
          <div className="intro-icon">✨</div>
          <div className="intro-text">
            <h3>释放你的创造力</h3>
            <p>选择一个工具，开始创作吧！</p>
          </div>
        </div>

        <div className="section-title">创作工具</div>
        <div className="create-grid">
          {createItems.map((item) => (
            <div
              key={item.path}
              className="create-card"
              style={{ borderColor: item.color }}
              onClick={() => navigate(item.path)}
            >
              <div className="create-icon" style={{ background: item.color }}>{item.icon}</div>
              <div className="create-info">
                <div className="create-title">{item.title}</div>
                <div className="create-desc">{item.desc}</div>
              </div>
              <div className="create-arrow" style={{ color: item.color }}>→</div>
            </div>
          ))}
        </div>

        <div className="section-title">最近作品</div>
        <div className="recent-works">
          {recentWorks.map((work, index) => (
            <div key={index} className="work-item">
              <div className="work-icon">{work.icon}</div>
              <div className="work-info">
                <div className="work-title">{work.title}</div>
                <div className="work-meta">{work.type} · {work.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="inspiration-section">
          <div className="section-title">创作灵感</div>
          <div className="inspiration-tags">
            <span className="tag">🌈 彩虹</span>
            <span className="tag">🏰 城堡</span>
            <span className="tag">🦄 独角兽</span>
            <span className="tag">🚀 太空</span>
            <span className="tag">🌸 春天</span>
            <span className="tag">🎪 马戏团</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
