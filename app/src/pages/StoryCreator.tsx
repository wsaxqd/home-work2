import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { aiApi, worksApi } from '../services/api'
import './Creator.css'
import './StoryCreator.css'

const themes = [
  { icon: '🚀', name: '奇幻冒险', value: 'adventure' },
  { icon: '🤝', name: '友谊魔法', value: 'friendship' },
  { icon: '🔬', name: '科学探索', value: 'science' },
  { icon: '🐾', name: '动物王国', value: 'animal' },
  { icon: '🤖', name: 'AI伙伴', value: 'robot' },
  { icon: '✨', name: '自定义', value: 'custom' },
]

const personalities = [
  { label: '勇敢的', value: 'brave' },
  { label: '好奇的', value: 'curious' },
  { label: '善良的', value: 'kind' },
  { label: '聪明的', value: 'smart' },
  { label: '有趣的', value: 'funny' },
]

export default function StoryCreator() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedTheme, setSelectedTheme] = useState('')
  const [character, setCharacter] = useState({ name: '', personality: '', location: '' })
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [story, setStory] = useState('')
  const [storyTitle, setStoryTitle] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError('')

    try {
      // 构建提示词
      const themeText = themes.find(t => t.value === selectedTheme)?.name || selectedTheme
      const prompt = `创作一个${themeText}主题的儿童故事，主角是一个${character.personality}的孩子，名叫${character.name}，故事发生在${character.location}。`

      // 调用API生成故事
      const response = await aiApi.generateStory({
        prompt,
        theme: themeText,
        characters: [character.name],
        setting: character.location,
        style: selectedTheme,
        length: length,
        age_group: '7-9'
      })

      if (response.success && response.data) {
        setStory(response.data.story)
        setStoryTitle(response.data.title)
        setStep(3)
      } else {
        setError(response.message || '故事生成失败，请重试')
      }
    } catch (err: any) {
      console.error('Generate story error:', err)
      setError(err.message || 'AI服务暂时不可用，请稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')

    try {
      const response = await worksApi.createWork({
        type: 'story',
        title: storyTitle,
        content: story,
        tags: [selectedTheme, character.personality],
        isPublic: true
      })

      if (response.success) {
        alert('故事保存成功！')
      } else {
        setError(response.message || '保存失败，请重试')
      }
    } catch (err: any) {
      console.error('Save story error:', err)
      setError(err.message || '保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setStory('')
    setStoryTitle('')
    setError('')
    setSelectedTheme('')
    setCharacter({ name: '', personality: '', location: '' })
  }

  return (
    <Layout>
      <Header title="AI童话制造机" gradient="linear-gradient(135deg, #7e57c2 0%, #5c6bc0 100%)" />
      <div className="main-content">
        {/* 添加故事库入口 */}
        <div className="story-library-banner" onClick={() => navigate('/story-library')}>
          <div className="banner-icon">📚</div>
          <div className="banner-content">
            <div className="banner-title">经典故事宝库</div>
            <div className="banner-desc">收录中外著名故事，激发创作灵感</div>
          </div>
          <div className="banner-arrow">→</div>
        </div>

        <div className="wizard-steps">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`wizard-step ${step >= s ? 'active' : ''}`}>
              <div className="step-circle">{s}</div>
              <div className="step-label">{s === 1 ? '选择主题' : s === 2 ? '设置角色' : '生成故事'}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="step-content">
            <div className="section-title">选择故事主题</div>
            <div className="theme-grid">
              {themes.map((theme) => (
                <div
                  key={theme.value}
                  className={`theme-card ${selectedTheme === theme.value ? 'selected' : ''}`}
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
            <div className="section-title">设置故事角色</div>
            <div className="character-form">
              <div className="form-group">
                <label>主角名字</label>
                <input
                  type="text"
                  placeholder="例如：小光、阿明..."
                  value={character.name}
                  onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>主角性格</label>
                <select
                  value={character.personality}
                  onChange={(e) => setCharacter({ ...character, personality: e.target.value })}
                >
                  <option value="">选择性格特点</option>
                  {personalities.map((p) => (
                    <option key={p.value} value={p.label}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>故事地点</label>
                <input
                  type="text"
                  placeholder="例如：魔法森林、未来城市..."
                  value={character.location}
                  onChange={(e) => setCharacter({ ...character, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>故事长度</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
                >
                  <option value="short">短篇 (约300-500字)</option>
                  <option value="medium">中篇 (约600-1000字)</option>
                  <option value="long">长篇 (约1200-2000字)</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="error-message" style={{
                padding: '10px 15px',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                color: '#856404',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <div className="control-buttons">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>上一步</button>
              <button
                className="btn btn-primary"
                disabled={!character.name || !character.personality || !character.location || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? '生成中...' : '生成故事 📖'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            {isGenerating ? (
              <div className="loading-animation">
                <div className="spinner"></div>
                <div className="loading-text">AI正在创作你的故事...</div>
              </div>
            ) : (
              <div className="result-section">
                {error && (
                  <div className="error-message" style={{
                    padding: '10px 15px',
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    color: '#856404',
                    marginBottom: '15px',
                    textAlign: 'center'
                  }}>
                    {error}
                  </div>
                )}

                <div className="story-preview">
                  <div className="story-title">{storyTitle || `${character.name}的冒险之旅`}</div>
                  <div className="story-content">{story}</div>
                </div>

                <div className="story-actions">
                  <button className="story-btn" disabled>✏️ 编辑</button>
                  <button className="story-btn" disabled>💡 AI建议</button>
                  <button className="story-btn" disabled>🔊 朗读</button>
                </div>

                <div className="action-buttons">
                  <button className="btn btn-secondary" onClick={handleReset}>
                    重新创作
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? '保存中...' : '保存故事'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
