import { useNavigate } from 'react-router-dom'
import './WarmHouse.css'

interface FeatureCard {
  id: string
  title: string
  icon: string
  desc: string
  color: string
  path: string
}

const FEATURES: FeatureCard[] = [
  {
    id: 'companion',
    title: 'AI小伙伴',
    icon: '🤗',
    desc: '随时陪你聊天，倾听你的心声',
    color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    path: '/warm-house/companion'
  },
  {
    id: 'diary',
    title: '心情日记',
    icon: '📔',
    desc: '记录每天的心情和想法',
    color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    path: '/warm-house/diary'
  },
  {
    id: 'radio',
    title: '温暖电台',
    icon: '📻',
    desc: '每日一句鼓励，睡前故事陪伴',
    color: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    path: '/warm-house/radio'
  },
  {
    id: 'wish',
    title: '心愿树',
    icon: '🌳',
    desc: '写下你的小心愿，等待实现',
    color: 'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
    path: '/warm-house/wish'
  }
]

export default function WarmHouse() {
  const navigate = useNavigate()

  return (
    <div className="container">
      <div className="main-content warm-house-content">
        {/* 顶部标题 */}
        <div className="warm-house-header">
          <div className="header-content">
            <h1 className="main-title">💝 温暖小屋</h1>
            <p className="subtitle">这里永远有人陪伴你</p>
          </div>
        </div>

        {/* 每日一句 */}
        <div className="daily-quote">
          <div className="quote-icon">✨</div>
          <div className="quote-content">
            <div className="quote-text">
              "你是独一无二的，世界因你而美好"
            </div>
            <div className="quote-date">今天 · {new Date().toLocaleDateString('zh-CN')}</div>
          </div>
        </div>

        {/* 功能卡片 */}
        <div className="features-grid">
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              className="feature-card"
              style={{ background: feature.color }}
              onClick={() => navigate(feature.path)}
            >
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-title">{feature.title}</div>
              <div className="feature-desc">{feature.desc}</div>
            </div>
          ))}
        </div>

        {/* 温馨提示 */}
        <div className="warm-tips">
          <div className="tips-icon">💡</div>
          <div className="tips-text">
            无论何时，只要你需要，我们都在这里陪伴你
          </div>
        </div>
      </div>
    </div>
  )
}
