import { useState, useEffect, useRef } from 'react'
import { Layout, Header } from '../components/layout'
import { favoritesApi } from '../services/api/favorites'
import { UsageTracker } from '../services/usageTracking'
import { imageGenerationService } from '../services/imageGeneration'
import './Creator.css'
import { useToast } from '../components/Toast'

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
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedArt, setGeneratedArt] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [artworkId, setArtworkId] = useState<number | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
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

  const handleGenerate = async () => {
    if (!prompt) {
      toast.info('请描述你想画的内容')
      return
    }

    setIsGenerating(true)
    setGenerationError('')

    try {
      // 调用AI图像生成服务
      const result = await imageGenerationService.generateImage({
        prompt: prompt,
        style: selectedStyle,
        size: '512x512'
      })

      if (result.success && result.imageUrl) {
        setGeneratedArt(result.imageUrl)

        // 保存作品到数据库
        const saveResult = await imageGenerationService.saveArtwork(result.imageUrl, {
          prompt: prompt,
          style: selectedStyle
        })

        if (saveResult.success && saveResult.artworkId) {
          setArtworkId(saveResult.artworkId)
        }

        setStep(3)

        // 记录成功生成
        if (usageTrackerRef.current) {
          usageTrackerRef.current.end(undefined, {
            success: true,
            style: selectedStyle,
            prompt: prompt
          })
          usageTrackerRef.current = null
        }
      } else {
        setGenerationError(result.error || '生成失败，请重试')
      }
    } catch (error) {
      console.error('生成图像失败:', error)
      setGenerationError('生成失败，请检查网络连接')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFavorite = async () => {
    if (isFavoriting) return

    setIsFavoriting(true)

    try {
      if (isFavorited) {
        setIsFavorited(false)
        toast.success('已取消收藏')
      } else {
        await favoritesApi.addFavorite({
          itemType: 'art',
          itemId: `art_${Date.now()}`,
          itemTitle: '我的AI画作',
          itemContent: prompt,
        })
        setIsFavorited(true)
        toast.success('收藏成功!')
      }
    } catch (err: any) {
      console.error('Favorite error:', err)
      toast.info(err.message || '操作失败，请重试')
    } finally {
      setIsFavoriting(false)
    }
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
                <div className="loading-hint">这可能需要10-30秒，请耐心等待</div>
              </div>
            ) : generationError ? (
              <div className="error-section">
                <div className="error-icon">😔</div>
                <div className="error-message">{generationError}</div>
                <div className="control-buttons">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>
                    返回修改
                  </button>
                  <button className="btn btn-primary" onClick={handleGenerate}>
                    重新生成
                  </button>
                </div>
              </div>
            ) : (
              <div className="result-section">
                <div className="artwork-preview">
                  {generatedArt.startsWith('http') ? (
                    <img
                      src={generatedArt}
                      alt="AI生成的画作"
                      className="artwork-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+'
                      }}
                    />
                  ) : (
                    <div className="artwork-display">{generatedArt}</div>
                  )}
                </div>
                <div className="artwork-info">
                  <div className="artwork-title">我的AI画作</div>
                  <div className="artwork-desc">"{prompt}"</div>
                  <div className="artwork-style">风格：{styles.find(s => s.value === selectedStyle)?.name}</div>
                </div>
                <div className="action-buttons">
                  <button className="btn btn-secondary" onClick={() => { setStep(1); setPrompt(''); setGeneratedArt(''); setGenerationError(''); setIsFavorited(false); }}>
                    重新创作
                  </button>
                  <button
                    className={`btn ${isFavorited ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleFavorite}
                    disabled={isFavoriting}
                    style={{ marginRight: '10px' }}
                  >
                    {isFavorited ? '❤️ 已收藏' : '🤍 收藏作品'}
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
                    toast.success('作品已保存')
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
