import { useState } from 'react'
import { Layout, Header } from '../components/layout'
import { classicPoems, getAllCategories, getRandomPoem, type Poem } from '../data/classicPoems'
import './Creator.css'
import './PoemCreator.css'

const themes = [
  { icon: '🌳', name: '自然风光', value: 'nature' },
  { icon: '🤝', name: '友谊情感', value: 'friendship' },
  { icon: '👨‍👩‍👧', name: '家庭温馨', value: 'family' },
  { icon: '✨', name: '梦想未来', value: 'dream' },
  { icon: '🍂', name: '四季变化', value: 'seasons' },
  { icon: '🎯', name: '自定义', value: 'custom' },
]

const styles = [
  { icon: '📜', name: '古典诗词', value: 'ancient' },
  { icon: '🖋️', name: '现代诗歌', value: 'modern' },
  { icon: '🧒', name: '童谣儿歌', value: 'children' },
  { icon: '🎌', name: '俳句短诗', value: 'haiku' },
]

export default function PoemCreator() {
  const [mode, setMode] = useState<'create' | 'browse'>('create') // 'create' 创作模式, 'browse' 浏览模式
  const [step, setStep] = useState(1)
  const [selectedTheme, setSelectedTheme] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [poem, setPoem] = useState({ title: '', content: '' })

  // 诗词浏览模式状态
  const [selectedDynasty, setSelectedDynasty] = useState<'all' | '唐' | '宋'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null)
  const [displayPoems, setDisplayPoems] = useState<Poem[]>(classicPoems)

  const addKeyword = () => {
    if (keywordInput && keywords.length < 5) {
      setKeywords([...keywords, keywordInput])
      setKeywordInput('')
    }
  }

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setPoem({
        title: '春日小诗',
        content: `春风轻轻吹，
花儿朵朵开。
小鸟枝头唱，
快乐满心怀。`
      })
      setStep(4)
    }, 3000)
  }

  // 诗词筛选
  const filterPoems = (dynasty: 'all' | '唐' | '宋', category: string) => {
    let filtered = classicPoems
    if (dynasty !== 'all') {
      filtered = filtered.filter(p => p.dynasty === dynasty)
    }
    if (category !== 'all') {
      filtered = filtered.filter(p => p.category === category)
    }
    setDisplayPoems(filtered)
  }

  // 处理朝代选择
  const handleDynastyChange = (dynasty: 'all' | '唐' | '宋') => {
    setSelectedDynasty(dynasty)
    filterPoems(dynasty, selectedCategory)
  }

  // 处理分类选择
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    filterPoems(selectedDynasty, category)
  }

  // 随机一首
  const handleRandomPoem = () => {
    const randomPoem = getRandomPoem()
    setSelectedPoem(randomPoem)
  }

  return (
    <Layout>
      <Header title="AI诗词助手" gradient="linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)" />
      <div className="main-content">
        {/* 模式切换 */}
        <div className="mode-switcher">
          <button
            className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
          >
            ✍️ AI创作诗词
          </button>
          <button
            className={`mode-btn ${mode === 'browse' ? 'active' : ''}`}
            onClick={() => setMode('browse')}
          >
            📚 唐诗宋词500首
          </button>
        </div>

        {/* AI创作模式 */}
        {mode === 'create' && (
          <>
            <div className="wizard-steps">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={`wizard-step ${step >= s ? 'active' : ''}`}>
                  <div className="step-circle">{s}</div>
                  <div className="step-label">
                    {s === 1 ? '主题' : s === 2 ? '风格' : s === 3 ? '关键词' : '生成'}
                  </div>
                </div>
              ))}
            </div>

        {step === 1 && (
          <div className="step-content">
            <div className="section-title">选择诗词主题</div>
            <div className="theme-grid">
              {themes.map((theme) => (
                <div
                  key={theme.value}
                  className={`theme-card poem-theme ${selectedTheme === theme.value ? 'selected' : ''}`}
                  onClick={() => setSelectedTheme(theme.value)}
                >
                  <div className="theme-icon">{theme.icon}</div>
                  <div className="theme-name">{theme.name}</div>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary next-btn"
              disabled={!selectedTheme}
              onClick={() => setStep(2)}
            >
              下一步
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="section-title">选择诗词风格</div>
            <div className="style-grid poem-style">
              {styles.map((style) => (
                <div
                  key={style.value}
                  className={`style-card ${selectedStyle === style.value ? 'selected' : ''}`}
                  onClick={() => setSelectedStyle(style.value)}
                >
                  <div className="style-icon">{style.icon}</div>
                  <div className="style-name">{style.name}</div>
                </div>
              ))}
            </div>
            <div className="control-buttons">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>上一步</button>
              <button
                className="btn btn-primary"
                disabled={!selectedStyle}
                onClick={() => setStep(3)}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <div className="section-title">设置诗词关键词</div>
            <div className="keywords-section">
              <div className="keyword-input-group">
                <input
                  type="text"
                  placeholder="输入关键词，如：春天、友谊..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                />
                <button onClick={addKeyword}>添加</button>
              </div>
              <div className="keywords-list">
                {keywords.map((kw, index) => (
                  <span key={index} className="keyword-tag">
                    {kw}
                    <span className="remove" onClick={() => removeKeyword(index)}>×</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="control-buttons">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>上一步</button>
              <button className="btn btn-primary" onClick={handleGenerate}>
                生成诗词 ✍️
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            {isGenerating ? (
              <div className="loading-animation">
                <div className="spinner"></div>
                <div className="loading-text">AI正在创作你的诗词...</div>
              </div>
            ) : (
              <div className="result-section">
                <div className="poem-preview">
                  <div className="poem-title">{poem.title}</div>
                  <div className="poem-content">{poem.content}</div>
                </div>

                <div className="poem-actions">
                  <button className="poem-btn">🎵 押韵建议</button>
                  <button className="poem-btn">💡 词汇建议</button>
                  <button className="poem-btn">📐 结构优化</button>
                </div>

                <div className="action-buttons">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>
                    重新创作
                  </button>
                  <button className="btn btn-primary">保存诗词</button>
                </div>
              </div>
            )}
          </div>
        )}
          </>
        )}

        {/* 唐诗宋词浏览模式 */}
        {mode === 'browse' && (
          <div className="classic-poems-section">
            {!selectedPoem ? (
              <>
                {/* 筛选器 */}
                <div className="poem-filters">
                  <div className="filter-group">
                    <div className="filter-label">朝代:</div>
                    <div className="filter-options">
                      <button
                        className={`filter-btn ${selectedDynasty === 'all' ? 'active' : ''}`}
                        onClick={() => handleDynastyChange('all')}
                      >
                        全部
                      </button>
                      <button
                        className={`filter-btn ${selectedDynasty === '唐' ? 'active' : ''}`}
                        onClick={() => handleDynastyChange('唐')}
                      >
                        唐诗
                      </button>
                      <button
                        className={`filter-btn ${selectedDynasty === '宋' ? 'active' : ''}`}
                        onClick={() => handleDynastyChange('宋')}
                      >
                        宋词
                      </button>
                    </div>
                  </div>

                  <div className="filter-group">
                    <div className="filter-label">分类:</div>
                    <div className="filter-options">
                      <button
                        className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('all')}
                      >
                        全部
                      </button>
                      {getAllCategories().map(cat => (
                        <button
                          key={cat}
                          className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                          onClick={() => handleCategoryChange(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="random-btn" onClick={handleRandomPoem}>
                    🎲 随机一首
                  </button>
                </div>

                {/* 诗词列表 */}
                <div className="poems-list">
                  {displayPoems.map(poem => (
                    <div
                      key={poem.id}
                      className="poem-item"
                      onClick={() => setSelectedPoem(poem)}
                    >
                      <div className="poem-item-header">
                        <div className="poem-item-title">{poem.title}</div>
                        <div className="poem-item-dynasty">{poem.dynasty}</div>
                      </div>
                      <div className="poem-item-author">{poem.author}</div>
                      <div className="poem-item-preview">
                        {poem.content.split('\n')[0]}...
                      </div>
                      <div className="poem-item-category">{poem.category}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* 诗词详情 */}
                <div className="poem-detail">
                  <button className="back-btn" onClick={() => setSelectedPoem(null)}>
                    ← 返回列表
                  </button>
                  <div className="poem-detail-header">
                    <div className="poem-detail-title">{selectedPoem.title}</div>
                    <div className="poem-detail-meta">
                      <span className="dynasty-tag">{selectedPoem.dynasty}代</span>
                      <span className="author-tag">{selectedPoem.author}</span>
                      <span className="category-tag">{selectedPoem.category}</span>
                    </div>
                  </div>
                  <div className="poem-detail-content">
                    {selectedPoem.content}
                  </div>
                  {selectedPoem.translation && (
                    <div className="poem-translation">
                      <div className="translation-title">译文:</div>
                      <div className="translation-content">{selectedPoem.translation}</div>
                    </div>
                  )}
                  <div className="poem-actions-bottom">
                    <button className="action-icon-btn">❤️ 收藏</button>
                    <button className="action-icon-btn">📖 朗读</button>
                    <button className="action-icon-btn">🎨 临摹</button>
                    <button className="action-icon-btn">📱 分享</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
