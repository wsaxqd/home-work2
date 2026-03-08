import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Games.css'

const gameItems = [
  { icon: '⚔️', title: '多人竞技PK', desc: '1v1实时答题对战，挑战全国玩家', path: '/pk-battle', color: '#f5576c', bgColor: '#ffe5f0', difficulty: '热门', tips: '段位系统，排行榜争霸', category: '竞技' },
  { icon: '🃏', title: '记忆翻牌', desc: '翻开卡片找到相同图案，挑战记忆力', path: '/memory-card-game', color: '#667eea', bgColor: '#e8e4ff', difficulty: '简单', tips: '三种难度，锻炼记忆力', category: '益智' },
  { icon: '🎮', title: '俄罗斯方块', desc: '经典方块消除游戏，挑战高分', path: '/tetris-game', color: '#0f3460', bgColor: '#e8f4f8', difficulty: '中等', tips: '键盘操控，消除得分', category: '益智' },
  { icon: '🐍', title: '贪吃蛇', desc: '控制蛇吃食物，越长越难', path: '/snake-game', color: '#11998e', bgColor: '#e8fff8', difficulty: '简单', tips: '经典游戏，挑战长度', category: '益智' },
  { icon: '🔢', title: '2048', desc: '合并数字方块，达到2048', path: '/game-2048', color: '#bbada0', bgColor: '#faf8ef', difficulty: '中等', tips: '策略游戏，挑战思维', category: '益智' },
  { icon: '🍎', title: '水果连连看', desc: '萌萌哒水果配对，锻炼记忆力', path: '/fruit-match', color: '#ff6b6b', bgColor: '#ffe5e5', difficulty: '简单', tips: '8种可爱水果等你来配对', category: '益智' },
  { icon: '💎', title: '水晶消消乐', desc: '晶莹剔透的消除游戏', path: '/crystal-match', color: '#667eea', bgColor: '#e8e4ff', difficulty: '中等', tips: '连击消除，挑战高分', category: '益智' },
  { icon: '🚀', title: '坦克大战', desc: '经典坦克射击，挑战反应速度', path: '/tank-battle', color: '#5f27cd', bgColor: '#e8e3f3', difficulty: '中等', tips: '键盘操控，激情对战', category: '动作' },
  { icon: '♟️', title: '国际象棋', desc: '智力对弈，挑战策略思维', path: '/chess-game', color: '#2c3e50', bgColor: '#ecf0f1', difficulty: '困难', tips: '经典棋局，锻炼逻辑思维', category: '策略' },
  { icon: '🀄', title: '中国象棋', desc: '楚河汉界，传统棋艺对弈', path: '/chinese-chess', color: '#8b0000', bgColor: '#ffe4e1', difficulty: '困难', tips: '体验传统象棋魅力', category: '策略' },
  { icon: '🎯', title: '打地鼠', desc: '快速反应，打击地鼠', path: '/whack-a-mole', color: '#f093fb', bgColor: '#fce4ff', difficulty: '简单', tips: '锻炼反应速度和手眼协调', category: '动作' },
  { icon: '🔢', title: '数字华容道', desc: '移动数字方块，按顺序排列', path: '/number-puzzle', color: '#4facfe', bgColor: '#e3f5ff', difficulty: '中等', tips: '挑战逻辑思维能力', category: '益智' },
  { icon: '🧩', title: '拼图游戏', desc: '拼接图案，完成挑战', path: '/jigsaw-puzzle', color: '#28c76f', bgColor: '#d4f4e2', difficulty: '简单', tips: '培养空间想象力', category: '益智' },
]

export default function Games() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('全部')

  const categories = ['全部', '竞技', '益智', '动作', '策略']

  const filteredGames = selectedCategory === '全部'
    ? gameItems
    : gameItems.filter(item => item.category === selectedCategory)

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

        {/* 游戏分类筛选 */}
        <div className="category-filter">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🌟</span>
            {selectedCategory === '全部' ? '热门游戏' : `${selectedCategory}游戏`}
          </div>
          <div className="section-subtitle">
            {filteredGames.length > 0 ? `共${filteredGames.length}款游戏` : '暂无游戏'}
          </div>
        </div>

        <div className="games-grid">
          {filteredGames.map((item, index) => (
            <div
              key={item.path}
              className="game-card"
              onClick={() => item.path !== '/games' && navigate(item.path)}
              style={{
                animationDelay: `${index * 0.1}s`,
                background: `linear-gradient(135deg, ${item.bgColor} 0%, white 100%)`
              }}
            >
              <div className="game-header">
                <div className="game-icon-huge">{item.icon}</div>
                <div className="game-badge" style={{ backgroundColor: item.color }}>
                  {item.difficulty}
                </div>
              </div>
              <div className="game-content">
                <div className="game-title">{item.title}</div>
                <div className="game-category-tag">{item.category}</div>
                <div className="game-desc">{item.desc}</div>
                <div className="game-tips">
                  <span className="tips-label">💡</span>
                  <span className="tips-text">{item.tips}</span>
                </div>
              </div>
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

        {/* 排行榜入口 */}
        <div className="leaderboard-entry" onClick={() => navigate('/game-leaderboard')}>
          <div className="entry-icon">🏆</div>
          <div className="entry-content">
            <div className="entry-title">游戏排行榜</div>
            <div className="entry-desc">查看高手排名，挑战榜首</div>
          </div>
          <div className="entry-arrow">→</div>
        </div>
      </div>
    </Layout>
  )
}
