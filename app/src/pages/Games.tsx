import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Games.css'

const gameItems = [
  { icon: '🍎', title: '水果连连看', desc: '萌萌哒水果配对，锻炼记忆力', path: '/fruit-match', color: '#ff6b6b', bgColor: '#ffe5e5', difficulty: '简单', tips: '8种可爱水果等你来配对' },
  { icon: '💎', title: '水晶消消乐', desc: '晶莹剔透的消除游戏', path: '/crystal-match', color: '#667eea', bgColor: '#e8e4ff', difficulty: '中等', tips: '连击消除，挑战高分' },
  { icon: '🚀', title: '坦克大战', desc: '经典坦克射击，挑战反应速度', path: '/tank-battle', color: '#5f27cd', bgColor: '#e8e3f3', difficulty: '中等', tips: '键盘操控，激情对战' },
  { icon: '♟️', title: '国际象棋', desc: '智力对弈，挑战策略思维', path: '/chess-game', color: '#2c3e50', bgColor: '#ecf0f1', difficulty: '困难', tips: '经典棋局，锻炼逻辑思维' },
  { icon: '🀄', title: '中国象棋', desc: '楚河汉界，传统棋艺对弈', path: '/chinese-chess', color: '#8b0000', bgColor: '#ffe4e1', difficulty: '困难', tips: '体验传统象棋魅力' },
  { icon: '🎯', title: '打地鼠', desc: '快速反应，打击地鼠', path: '/whack-a-mole', color: '#f093fb', bgColor: '#fce4ff', difficulty: '简单', tips: '锻炼反应速度和手眼协调' },
  { icon: '🔢', title: '数字华容道', desc: '移动数字方块，按顺序排列', path: '/number-puzzle', color: '#4facfe', bgColor: '#e3f5ff', difficulty: '中等', tips: '挑战逻辑思维能力' },
  { icon: '🧩', title: '拼图游戏', desc: '拼接图案，完成挑战', path: '/jigsaw-puzzle', color: '#28c76f', bgColor: '#d4f4e2', difficulty: '简单', tips: '培养空间想象力' },
  { icon: '🎮', title: '更多游戏', desc: '更多有趣的AI游戏即将上线', path: '/games', color: '#ff6348', bgColor: '#ffe5e1', difficulty: '敬请期待', tips: '持续更新中...' },
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
