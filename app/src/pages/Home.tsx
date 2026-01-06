import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import AIChatbot from '../components/AIChatbot'
import './Home.css'

// AI创作工坊 - 4个创作工具
const createTools = [
  { icon: '🎨', title: 'AI绘画', desc: '输入描述，画出想象', path: '/art-creator', color: '#ff6b6b', bgColor: '#ffe5e5' },
  { icon: '🎵', title: 'AI音乐', desc: '选择风格，创作旋律', path: '/music-creator', color: '#4ecdc4', bgColor: '#e0f7f6' },
  { icon: '📖', title: 'AI故事', desc: '设定角色，编写故事', path: '/story-creator', color: '#a29bfe', bgColor: '#ededff' },
  { icon: '✍️', title: 'AI诗词', desc: '学习古诗，创作诗词', path: '/poem-creator', color: '#fd79a8', bgColor: '#ffeef5' },
]

// AI游戏乐园 - 7款游戏
const gameItems = [
  { icon: '😊', title: '表情识别', desc: '识别表情，学习情感', path: '/expression-game', color: '#feca57', bgColor: '#fff9e6' },
  { icon: '🖼️', title: '图像认知', desc: '识别物品，提升观察', path: '/image-recognition-game', color: '#48dbfb', bgColor: '#e3f9ff' },
  { icon: '🍎', title: '水果连连看', desc: '水果配对，锻炼记忆', path: '/fruit-match', color: '#ff6b6b', bgColor: '#ffe5e5' },
  { icon: '💎', title: '水晶消消乐', desc: '消除游戏，挑战高分', path: '/crystal-match', color: '#667eea', bgColor: '#e8e4ff' },
  { icon: '🚀', title: '坦克大战', desc: '射击游戏，挑战反应', path: '/tank-battle', color: '#5f27cd', bgColor: '#e8e3f3' },
  { icon: '♟️', title: '国际象棋', desc: '智力对弈，策略思维', path: '/chess-game', color: '#2c3e50', bgColor: '#ecf0f1' },
  { icon: '🀄', title: '中国象棋', desc: '传统棋艺，经典对弈', path: '/chinese-chess', color: '#8b0000', bgColor: '#ffe4e1' },
]

// 其他功能模块
const otherFeatures = [
  { icon: '📚', title: '作品展示', desc: '查看和分享作品', path: '/story-library', color: '#4facfe', bgColor: '#e0f7fa' },
  { icon: '💝', title: '心灵花园', desc: '记录心情日记', path: '/mind-garden', color: '#a29bfe', bgColor: '#f3e5f5' },
]

export default function Home() {
  const navigate = useNavigate()
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')

  return (
    <Layout>
      <Header title="启蒙之光" showBack={false} />
      <div className="main-content">
        {/* 欢迎横幅 */}
        <div className="welcome-banner">
          <div className="welcome-avatar-large">{userProfile.avatar || '🌟'}</div>
          <div className="welcome-info">
            <h1 className="welcome-greeting">你好，{userProfile.nickname || '小朋友'}！</h1>
            <p className="welcome-subtitle">选择功能开始探索吧</p>
          </div>
          <div className="welcome-decoration">✨</div>
        </div>

        {/* AI助手小光卡片 */}
        <div className="ai-assistant-card" onClick={() => {
          const chatbot = document.querySelector('.chatbot-fab') as HTMLElement;
          if (chatbot) chatbot.click();
        }}>
          <div className="assistant-avatar">🤖</div>
          <div className="assistant-content">
            <div className="assistant-name">AI助手小光</div>
            <div className="assistant-desc">有问题随时问我，我会帮你解答哦~</div>
          </div>
          <div className="assistant-action">
            <span className="chat-icon">💬</span>
            <span className="chat-text">开始聊天</span>
          </div>
        </div>

        {/* AI创作工坊区域 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🎨</span>
            AI创作工坊
          </div>
          <div className="section-subtitle">4个创作工具，释放你的创造力</div>
        </div>

        <div className="function-grid">
          {createTools.map((tool) => (
            <div
              key={tool.path}
              className="function-card"
              style={{ backgroundColor: tool.bgColor, borderColor: tool.color }}
              onClick={() => navigate(tool.path)}
            >
              <div className="function-icon" style={{ color: tool.color }}>{tool.icon}</div>
              <div className="function-title">{tool.title}</div>
              <div className="function-desc">{tool.desc}</div>
              <div className="function-action" style={{ backgroundColor: tool.color }}>
                立即使用 →
              </div>
            </div>
          ))}
        </div>

        {/* AI游戏乐园区域 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🎮</span>
            AI游戏乐园
          </div>
          <div className="section-subtitle">7款趣味游戏，边玩边学习</div>
        </div>

        <div className="function-grid">
          {gameItems.map((game) => (
            <div
              key={game.path}
              className="function-card"
              style={{ backgroundColor: game.bgColor, borderColor: game.color }}
              onClick={() => navigate(game.path)}
            >
              <div className="function-icon" style={{ color: game.color }}>{game.icon}</div>
              <div className="function-title">{game.title}</div>
              <div className="function-desc">{game.desc}</div>
              <div className="function-action" style={{ backgroundColor: game.color }}>
                开始游戏 →
              </div>
            </div>
          ))}
        </div>

        {/* 其他功能区域 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">⭐</span>
            更多功能
          </div>
          <div className="section-subtitle">查看作品和记录心情</div>
        </div>

        <div className="function-grid">
          {otherFeatures.map((feature) => (
            <div
              key={feature.path}
              className="function-card"
              style={{ backgroundColor: feature.bgColor, borderColor: feature.color }}
              onClick={() => navigate(feature.path)}
            >
              <div className="function-icon" style={{ color: feature.color }}>{feature.icon}</div>
              <div className="function-title">{feature.title}</div>
              <div className="function-desc">{feature.desc}</div>
              <div className="function-action" style={{ backgroundColor: feature.color }}>
                进入 →
              </div>
            </div>
          ))}
        </div>

        {/* 数据统计卡片 */}
        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-icon">📈</span>
            <span className="stats-title">我的成长数据</span>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">创作作品</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">游戏次数</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">连续天数</div>
            </div>
          </div>
        </div>

        {/* AI客服机器人 */}
        <AIChatbot />
      </div>
    </Layout>
  )
}
