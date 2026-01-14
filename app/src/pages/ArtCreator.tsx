import { useState, useEffect, useRef } from 'react'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import './Creator.css'

const styles = [
  { icon: '🖍️', name: '卡通风格', value: 'cartoon' },
  { icon: '🎨', name: '水彩风格', value: 'watercolor' },
  { icon: '✏️', name: '素描风格', value: 'sketch' },
  { icon: '🌈', name: '梦幻风格', value: 'fantasy' },
]

const templates = [
  { icon: '🏰', name: '城堡' },
  { icon: '🌲', name: '森林' },
  { icon: '🚀', name: '太空' },
  { icon: '🐾', name: '动物' },
  { icon: '🧚', name: '童话' },
  { icon: '🌊', name: '海洋' },
]

export default function ArtCreator() {
  const [step, setStep] = useState(1)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedArt, setGeneratedArt] = useState('')
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  // 启动使用追踪
  useEffect(() => {
    usageTrackerRef.current = new UsageTracker('创作', '绘画创作')
    usageTrackerRef.current.start()

    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.cancel()
      }
    }
  }, [])

  const handleGenerate = () => {
    if (!prompt) return
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setGeneratedArt('🖼️')
      setStep(3)
    }, 3000)
  }

  return (
    <Layout>
      <Header title="AI魔法画布" gradient="linear-gradient(135deg, #ff9800 0%, #ff5722 100%)" />
      <div className="main-content">
        <div className="wizard-steps">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`wizard-step ${step >= s ? 'active' : ''}`}>
              <div className="step-circle">{s}</div>
              <div className="step-label">{s === 1 ? '选择风格' : s === 2 ? '描述画面' : '生成作品'}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="step-content">
            <div className="section-title">选择绘画风格</div>
            <div className="style-grid">
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

            <div className="section-title">创作模板</div>
            <div className="template-grid">
              {templates.map((t) => (
                <div key={t.name} className="template-item" onClick={() => setPrompt(t.name)}>
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary next-btn"
              disabled={!selectedStyle}
              onClick={() => setStep(2)}
            >
              下一步
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="section-title">描述你想画的内容</div>
            <div className="prompt-input">
              <textarea
                placeholder="例如：一只可爱的小猫咪在彩虹桥上跳舞..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="prompt-suggestions">
              <span className="suggestion-label">参考词汇：</span>
              <div className="suggestions">
                {['可爱的', '神奇的', '闪闪发光', '彩虹色'].map((s) => (
                  <span key={s} className="suggestion-tag" onClick={() => setPrompt(prompt + s)}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="control-buttons">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>上一步</button>
              <button
                className="btn btn-primary"
                disabled={!prompt}
                onClick={handleGenerate}
              >
                开始创作 ✨
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            {isGenerating ? (
              <div className="loading-animation">
                <div className="spinner"></div>
                <div className="loading-text">AI正在创作你的画作...</div>
              </div>
            ) : (
              <div className="result-section">
                <div className="artwork-preview">
                  <div className="artwork-display">{generatedArt}</div>
                </div>
                <div className="artwork-info">
                  <div className="artwork-title">我的AI画作</div>
                  <div className="artwork-desc">"{prompt}"</div>
                </div>
                <div className="action-buttons">
                  <button className="btn btn-secondary" onClick={() => { setStep(1); setPrompt(''); }}>
                    重新创作
                  </button>
                  <button className="btn btn-primary" onClick={async () => {
                    if (usageTrackerRef.current) {
                      await usageTrackerRef.current.end(undefined, {
                        workName: '我的AI画作',
                        prompt: prompt,
                        style: selectedStyle,
                        saved: true
                      })
                    }
                    alert('作品已保存')
                  }}>保存作品</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
