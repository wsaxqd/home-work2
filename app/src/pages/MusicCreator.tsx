import { useState } from 'react'
import { Layout, Header } from '../components/layout'
import './Creator.css'
import './MusicCreator.css'

const genres = [
  { icon: '😊', name: '快乐旋律', value: 'happy' },
  { icon: '🌊', name: '宁静氛围', value: 'calm' },
  { icon: '🚀', name: '冒险之旅', value: 'adventure' },
  { icon: '✨', name: '梦幻世界', value: 'dream' },
  { icon: '⚡', name: '电子节奏', value: 'electronic' },
  { icon: '🌳', name: '自然之声', value: 'nature' },
]

export default function MusicCreator() {
  const [step, setStep] = useState(1)
  const [selectedGenre, setSelectedGenre] = useState('')
  const [tempo, setTempo] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const tempoLabels = ['非常慢', '缓慢', '中等', '快速', '非常快']

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setStep(3)
    }, 3000)
  }

  return (
    <Layout>
      <Header title="AI音乐画布" gradient="linear-gradient(135deg, #ff9800 0%, #4caf50 100%)" />
      <div className="main-content">
        <div className="wizard-steps">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`wizard-step ${step >= s ? 'active' : ''}`}>
              <div className="step-circle">{s}</div>
              <div className="step-label">{s === 1 ? '选择风格' : s === 2 ? '设置节奏' : '生成音乐'}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="step-content">
            <div className="section-title">选择音乐风格</div>
            <div className="genre-grid">
              {genres.map((genre) => (
                <div
                  key={genre.value}
                  className={`genre-card ${selectedGenre === genre.value ? 'selected' : ''}`}
                  onClick={() => setSelectedGenre(genre.value)}
                >
                  <div className="genre-icon">{genre.icon}</div>
                  <div className="genre-name">{genre.name}</div>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary next-btn"
              disabled={!selectedGenre}
              onClick={() => setStep(2)}
            >
              下一步
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="section-title">设置节奏和情绪</div>
            <div className="tempo-controls">
              <div className="control-group">
                <div className="control-label">
                  <span>节奏速度</span>
                  <span className="control-value">{tempoLabels[tempo - 1]}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={tempo}
                  onChange={(e) => setTempo(parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>缓慢</span>
                  <span>中等</span>
                  <span>快速</span>
                </div>
              </div>
            </div>

            <div className="melody-section">
              <div className="section-title">绘制你的旋律</div>
              <div className="melody-canvas">
                <div className="canvas-placeholder">
                  🎵 在这里绘制旋律线条
                </div>
              </div>
              <div className="melody-controls">
                <button className="melody-btn">✏️ 绘制</button>
                <button className="melody-btn">🗑️ 清除</button>
                <button className="melody-btn">🎲 随机</button>
              </div>
            </div>

            <div className="control-buttons">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>上一步</button>
              <button className="btn btn-primary" onClick={handleGenerate}>
                生成音乐 🎵
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            {isGenerating ? (
              <div className="loading-animation">
                <div className="spinner"></div>
                <div className="loading-text">AI正在创作你的音乐...</div>
              </div>
            ) : (
              <div className="result-section">
                <div className="music-player">
                  <div className="player-artwork">🎵</div>
                  <div className="player-info">
                    <div className="player-title">我的AI音乐</div>
                    <div className="player-genre">
                      {genres.find(g => g.value === selectedGenre)?.name}
                    </div>
                  </div>
                  <div className="player-controls">
                    <button className="player-btn">⏮️</button>
                    <button
                      className="player-btn play"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <button className="player-btn">⏭️</button>
                  </div>
                  <div className="player-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '30%' }}></div>
                    </div>
                    <div className="progress-time">
                      <span>0:09</span>
                      <span>0:30</span>
                    </div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="btn btn-secondary" onClick={() => { setStep(1); }}>
                    重新创作
                  </button>
                  <button className="btn btn-primary">保存音乐</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
