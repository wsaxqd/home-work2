import { useState, useEffect, useRef } from 'react'
import { Layout, Header } from '../components/layout'
import { favoritesApi } from '../services/api/favorites'
import { UsageTracker } from '../services/usageTracking'
import './Creator.css'
import './MusicCreator.css'
import { useToast } from '../components/Toast'

const genres = [
  { icon: '😊', name: '快乐旋律', value: 'happy' },
  { icon: '🌊', name: '宁静氛围', value: 'calm' },
  { icon: '🚀', name: '冒险之旅', value: 'adventure' },
  { icon: '✨', name: '梦幻世界', value: 'dream' },
  { icon: '⚡', name: '电子节奏', value: 'electronic' },
  { icon: '🌳', name: '自然之声', value: 'nature' },
]

const childrenSongs = [
  { id: 1, title: '小星星', icon: '⭐', duration: '2:15' },
  { id: 2, title: '两只老虎', icon: '🐯', duration: '1:45' },
  { id: 3, title: '小兔子乖乖', icon: '🐰', duration: '2:30' },
  { id: 4, title: '找朋友', icon: '👫', duration: '1:50' },
  { id: 5, title: '小燕子', icon: '🐦', duration: '2:20' },
  { id: 6, title: '数鸭子', icon: '🦆', duration: '2:10' },
  { id: 7, title: '蜗牛与黄鹂鸟', icon: '🐌', duration: '2:40' },
  { id: 8, title: '春天在哪里', icon: '🌸', duration: '2:25' },
  { id: 9, title: '小毛驴', icon: '🐴', duration: '1:55' },
  { id: 10, title: '拔萝卜', icon: '🥕', duration: '2:05' },
  { id: 11, title: '虫儿飞', icon: '🦋', duration: '2:35' },
  { id: 12, title: '外婆的澎湖湾', icon: '🌊', duration: '3:00' },
  { id: 13, title: '让我们荡起双桨', icon: '🚣', duration: '2:50' },
  { id: 14, title: '采蘑菇的小姑娘', icon: '🍄', duration: '2:15' },
  { id: 15, title: '卖报歌', icon: '📰', duration: '1:40' },
  { id: 16, title: '丢手绢', icon: '🧣', duration: '1:35' },
  { id: 17, title: '小螺号', icon: '🐚', duration: '2:20' },
  { id: 18, title: '听妈妈讲那过去的事情', icon: '👩', duration: '3:10' },
  { id: 19, title: '世上只有妈妈好', icon: '❤️', duration: '2:00' },
  { id: 20, title: '读书郎', icon: '📚', duration: '2:10' },
]

export default function MusicCreator() {
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [selectedGenre, setSelectedGenre] = useState('')
  const [tempo, setTempo] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingSongId, setPlayingSongId] = useState<number | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  const tempoLabels = ['非常慢', '缓慢', '中等', '快速', '非常快']

  // 启动使用追踪
  useEffect(() => {
    usageTrackerRef.current = new UsageTracker('创作', '音乐创作')
    usageTrackerRef.current.start()

    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.cancel()
      }
    }
  }, [])

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setStep(3)
    }, 3000)
  }

  const handleSongPlay = (songId: number) => {
    if (playingSongId === songId) {
      setPlayingSongId(null)
    } else {
      setPlayingSongId(songId)
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
          itemType: 'music',
          itemId: `music_${Date.now()}`,
          itemTitle: '我的AI音乐',
          itemContent: `${genres.find(g => g.value === selectedGenre)?.name || ''} - ${tempoLabels[tempo]}`,
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
                  <button className="btn btn-secondary" onClick={() => { setStep(1); setIsFavorited(false); }}>
                    重新创作
                  </button>
                  <button
                    className={`btn ${isFavorited ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleFavorite}
                    disabled={isFavoriting}
                    style={{ marginRight: '10px' }}
                  >
                    {isFavorited ? '❤️ 已收藏' : '🤍 收藏音乐'}
                  </button>
                  <button className="btn btn-primary" onClick={async () => {
                    if (usageTrackerRef.current) {
                      await usageTrackerRef.current.end(undefined, {
                        workName: '我的AI音乐',
                        genre: selectedGenre,
                        tempo: tempoLabels[tempo - 1],
                        saved: true
                      })
                    }
                    toast.success('音乐已保存')
                  }}>保存音乐</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 儿歌列表 */}
        <div className="children-songs-section">
          <div className="section-title">经典儿歌精选</div>
          <div className="songs-grid">
            {childrenSongs.map((song) => (
              <div key={song.id} className="song-card">
                <div className="song-icon">{song.icon}</div>
                <div className="song-info">
                  <div className="song-title">{song.title}</div>
                  <div className="song-duration">{song.duration}</div>
                </div>
                <button
                  className="song-play-btn"
                  onClick={() => handleSongPlay(song.id)}
                >
                  {playingSongId === song.id ? '⏸️' : '▶️'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
