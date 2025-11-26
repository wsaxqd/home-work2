import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Explore.css'

const categories = [
  { icon: '🎮', title: 'AI游戏', items: [
    { icon: '😊', name: '表情模仿秀', path: '/expression-game' },
    { icon: '🔍', name: '猜猜我是谁', path: '/image-recognition-game' },
  ]},
  { icon: '🎨', title: '创意工坊', items: [
    { icon: '🖼️', name: 'AI绘画', path: '/art-creator' },
    { icon: '🎵', name: 'AI音乐', path: '/music-creator' },
    { icon: '📖', name: 'AI故事', path: '/story-creator' },
    { icon: '✍️', name: 'AI诗词', path: '/poem-creator' },
  ]},
  { icon: '💝', title: '情感成长', items: [
    { icon: '🌸', name: '心灵花园', path: '/mind-garden' },
    { icon: '📊', name: '能力评估', path: '/assessment' },
  ]},
]

export default function Explore() {
  const navigate = useNavigate()

  return (
    <Layout>
      <Header title="探索发现" gradient="linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)" />
      <div className="main-content">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="搜索你感兴趣的内容..." />
        </div>

        {categories.map((category) => (
          <div key={category.title} className="explore-category">
            <div className="category-header">
              <span className="category-icon">{category.icon}</span>
              <span className="category-title">{category.title}</span>
            </div>
            <div className="category-items">
              {category.items.map((item) => (
                <div
                  key={item.path}
                  className="explore-item"
                  onClick={() => navigate(item.path)}
                >
                  <div className="item-icon">{item.icon}</div>
                  <div className="item-name">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="section-title">推荐挑战</div>
        <div className="challenge-cards">
          <div className="challenge-card" onClick={() => navigate('/expression-game')}>
            <div className="challenge-badge">每日挑战</div>
            <div className="challenge-icon">🎯</div>
            <div className="challenge-title">表情大挑战</div>
            <div className="challenge-reward">完成获得 +50 积分</div>
          </div>
          <div className="challenge-card" onClick={() => navigate('/art-creator')}>
            <div className="challenge-badge">创意任务</div>
            <div className="challenge-icon">🎨</div>
            <div className="challenge-title">画出你的梦想</div>
            <div className="challenge-reward">完成获得 +30 积分</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
