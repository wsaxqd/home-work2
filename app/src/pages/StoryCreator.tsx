import { useState } from 'react'
import { Layout, Header } from '../components/layout'
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
  const [step, setStep] = useState(1)
  const [selectedTheme, setSelectedTheme] = useState('')
  const [character, setCharacter] = useState({ name: '', personality: '', location: '' })
  const [isGenerating, setIsGenerating] = useState(false)
  const [story, setStory] = useState('')

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setStory(`在${character.location}，住着一个${character.personality}的孩子，名叫${character.name}。\n\n有一天，${character.name}发现了一个神秘的入口...`)
      setStep(3)
    }, 3000)
  }

  return (
    <Layout>
      <Header title="AI童话制造机" gradient="linear-gradient(135deg, #7e57c2 0%, #5c6bc0 100%)" />
      <div className="main-content">
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
            </div>

            <div className="control-buttons">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>上一步</button>
              <button
                className="btn btn-primary"
                disabled={!character.name || !character.personality || !character.location}
                onClick={handleGenerate}
              >
                生成故事 📖
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
                <div className="story-preview">
                  <div className="story-title">{character.name}的冒险之旅</div>
                  <div className="story-content">{story}</div>
                </div>

                <div className="story-actions">
                  <button className="story-btn">✏️ 编辑</button>
                  <button className="story-btn">💡 AI建议</button>
                  <button className="story-btn">🔊 朗读</button>
                </div>

                <div className="action-buttons">
                  <button className="btn btn-secondary" onClick={() => { setStep(1); setStory(''); }}>
                    重新创作
                  </button>
                  <button className="btn btn-primary">保存故事</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
