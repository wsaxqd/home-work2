import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Search.css'

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  path: string
  icon: string
  tags?: string[]
}

export default function Search() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // 所有可搜索的内容数据
  const allContent: SearchResult[] = [
    // 游戏
    { id: 'fruit-match', title: '水果连连看', description: '萌萌哒水果配对，锻炼记忆力', category: '游戏', path: '/fruit-match', icon: '🍎', tags: ['简单', '记忆', '配对'] },
    { id: 'crystal-match', title: '水晶消消乐', description: '晶莹剔透的消除游戏', category: '游戏', path: '/crystal-match', icon: '💎', tags: ['中等', '消除', '策略'] },
    { id: 'tank-battle', title: '坦克大战', description: '经典坦克射击，挑战反应速度', category: '游戏', path: '/tank-battle', icon: '🚀', tags: ['中等', '射击', '反应'] },
    { id: 'chess-game', title: '国际象棋', description: '智力对弈，挑战策略思维', category: '游戏', path: '/chess-game', icon: '♟️', tags: ['困难', '策略', '思维'] },
    { id: 'chinese-chess', title: '中国象棋', description: '楚河汉界，传统棋艺对弈', category: '游戏', path: '/chinese-chess', icon: '🀄', tags: ['困难', '传统', '策略'] },
    { id: 'whack-a-mole', title: '打地鼠', description: '快速反应，打击地鼠', category: '游戏', path: '/whack-a-mole', icon: '🎯', tags: ['简单', '反应', '手眼协调'] },
    { id: 'number-puzzle', title: '数字华容道', description: '移动数字方块，按顺序排列', category: '游戏', path: '/number-puzzle', icon: '🔢', tags: ['中等', '逻辑', '思维'] },
    { id: 'jigsaw-puzzle', title: '拼图游戏', description: '拼接图案，完成挑战', category: '游戏', path: '/jigsaw-puzzle', icon: '🧩', tags: ['简单', '空间', '想象'] },

    // 创作工具
    { id: 'art-creator', title: 'AI魔法画布', description: '用AI创作精美的艺术作品', category: '创作', path: '/art-creator', icon: '🎨', tags: ['绘画', '创作', 'AI'] },
    { id: 'music-creator', title: 'AI音乐创作', description: '创作属于你的音乐旋律', category: '创作', path: '/music-creator', icon: '🎵', tags: ['音乐', '创作', 'AI'] },
    { id: 'story-creator', title: '故事创作', description: '编写精彩的故事', category: '创作', path: '/story-creator', icon: '📖', tags: ['故事', '写作', '创作'] },
    { id: 'poem-creator', title: '诗歌创作', description: '创作优美的诗歌', category: '创作', path: '/poem-creator', icon: '✍️', tags: ['诗歌', '写作', '创作'] },

    // 学习内容
    { id: 'picture-book', title: '绘本阅读', description: '92本精选儿童绘本', category: '学习', path: '/picture-book', icon: '📚', tags: ['阅读', '绘本', '故事'] },
    { id: 'four-classics', title: '四大名著', description: '西游记、三国演义、水浒传、红楼梦', category: '学习', path: '/four-classics', icon: '🏮', tags: ['名著', '经典', '文学'] },
    { id: 'ai-encyclopedia', title: 'AI百科', description: 'AI十万个为什么', category: '学习', path: '/ai-encyclopedia', icon: '🤖', tags: ['AI', '知识', '百科'] },
    { id: 'story-library', title: '故事库', description: '海量精彩故事', category: '学习', path: '/story-library', icon: '📖', tags: ['故事', '阅读', '学习'] },

    // 个人中心
    { id: 'mind-garden', title: '心灵花园', description: '记录你的成长点滴', category: '个人', path: '/mind-garden', icon: '🌱', tags: ['成长', '记录', '心情'] },
    { id: 'assessment', title: '能力评估', description: '了解你的能力水平', category: '个人', path: '/assessment', icon: '📊', tags: ['评估', '能力', '测试'] },
    { id: 'my-works', title: '我的作品', description: '查看你的创作作品', category: '个人', path: '/my-works', icon: '🎨', tags: ['作品', '创作', '收藏'] },
    { id: 'favorites', title: '我的收藏', description: '收藏的内容', category: '个人', path: '/favorites', icon: '⭐', tags: ['收藏', '喜欢', '保存'] },
  ]

  const categories = ['全部', '游戏', '创作', '学习', '个人']

  // 搜索功能
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([])
      return
    }

    setIsSearching(true)

    // 模拟搜索延迟
    const timer = setTimeout(() => {
      const filtered = allContent.filter(item => {
        const matchesCategory = activeCategory === '全部' || item.category === activeCategory
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchLower))

        return matchesCategory && matchesSearch
      })

      setResults(filtered)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, activeCategory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleResultClick = (path: string) => {
    navigate(path)
  }

  return (
    <Layout>
      <Header
        title="全局搜索"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        showBack={true}
      />
      <div className="main-content">
        {/* 搜索框 */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索游戏、故事、创作工具..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* 分类筛选 */}
        <div className="category-filter">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 搜索结果 */}
        {searchTerm.trim() === '' ? (
          <div className="search-empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">开始搜索</div>
            <div className="empty-desc">输入关键词搜索游戏、故事、创作工具等内容</div>
          </div>
        ) : isSearching ? (
          <div className="search-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">搜索中...</div>
          </div>
        ) : results.length === 0 ? (
          <div className="search-empty">
            <div className="empty-icon">😢</div>
            <div className="empty-title">没有找到结果</div>
            <div className="empty-desc">试试其他关键词吧</div>
          </div>
        ) : (
          <div className="search-results">
            <div className="results-header">
              <h3>找到 {results.length} 个结果</h3>
            </div>

            <div className="results-list">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="result-card"
                  onClick={() => handleResultClick(result.path)}
                >
                  <div className="result-icon">{result.icon}</div>
                  <div className="result-content">
                    <div className="result-title">{result.title}</div>
                    <div className="result-desc">{result.description}</div>
                    {result.tags && (
                      <div className="result-tags">
                        {result.tags.map((tag, idx) => (
                          <span key={idx} className="result-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="result-category">{result.category}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
