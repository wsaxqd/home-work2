import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { useToast } from '../components/Toast'
import './LearningMap.css'

interface LearningMap {
  id: number
  subject: string
  map_name: string
  description: string
  total_stages: number
  user_current_stage: number
  user_stars: number
  user_completion_rate: number
}

interface Stage {
  id: number
  stage_number: number
  stage_name: string
  stage_type: string
  description: string
  difficulty_stars: number
  position_x: number
  position_y: number
  user_stars: number
  is_unlocked: boolean
  is_completed: boolean
  is_current: boolean
}

export default function LearningMap() {
  const toast = useToast()
  const navigate = useNavigate()
  const [maps, setMaps] = useState<LearningMap[]>([])
  const [selectedMap, setSelectedMap] = useState<LearningMap | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_completed: 0,
    total_stars: 0,
    perfect_count: 0,
    badges_count: 0
  })

  useEffect(() => {
    loadMaps()
    loadStats()
  }, [])

  useEffect(() => {
    if (selectedMap) {
      loadStages(selectedMap.id)
    }
  }, [selectedMap])

  const loadMaps = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/learning-path/maps', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setMaps(data.data)
        if (data.data.length > 0) {
          setSelectedMap(data.data[0])
        }
      }
    } catch (error) {
      console.error('加载地图失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStages = async (mapId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/learning-path/maps/${mapId}/stages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setStages(data.data.stages)
      }
    } catch (error) {
      console.error('加载关卡失败:', error)
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/learning-path/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  const handleStageClick = (stage: Stage) => {
    if (!stage.is_unlocked) {
      toast.info('请先完成前置关卡！')
      return
    }
    navigate(`/learning/stage/${stage.id}`)
  }

  const getStageIcon = (type: string) => {
    switch (type) {
      case 'lesson': return '📖'
      case 'quiz': return '📝'
      case 'practice': return '✍️'
      case 'challenge': return '🎯'
      case 'boss': return '👑'
      default: return '📌'
    }
  }

  return (
    <Layout>
      <Header
        title="学习地图"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      />

      <div className="learning-map-container">
        {/* 学习工具快捷入口 */}
        <div className="learning-tools">
          <div
            className="tool-card homework"
            onClick={() => navigate('/homework')}
          >
            <div className="tool-icon">📝</div>
            <div className="tool-info">
              <div className="tool-title">AI作业助手</div>
              <div className="tool-desc">拍照搜题·智能解答</div>
            </div>
            <div className="tool-arrow">→</div>
          </div>
          <div
            className="tool-card wrong-questions"
            onClick={() => navigate('/wrong-questions')}
          >
            <div className="tool-icon">📕</div>
            <div className="tool-info">
              <div className="tool-title">我的错题本</div>
              <div className="tool-desc">错题整理·薄弱分析</div>
            </div>
            <div className="tool-arrow">→</div>
          </div>
          <div
            className="tool-card weak-point"
            onClick={() => navigate('/weak-point-diagnosis')}
          >
            <div className="tool-icon">🎯</div>
            <div className="tool-info">
              <div className="tool-title">薄弱点诊断</div>
              <div className="tool-desc">AI分析·个性学习</div>
            </div>
            <div className="tool-arrow">→</div>
          </div>
        </div>

        {/* 学习游戏 */}
        <div className="section-header" style={{ marginTop: '24px' }}>
          <div className="section-left">
            <span className="section-icon">🎮</span>
            <span className="section-title">学习游戏</span>
          </div>
          <span className="section-right">寓教于乐</span>
        </div>
        <div className="learning-tools">
          <div
            className="tool-card"
            style={{ borderColor: '#667eea', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}
            onClick={() => navigate('/math-speed-game')}
          >
            <div className="tool-icon">🔢</div>
            <div className="tool-info">
              <div className="tool-title">数学速算挑战</div>
              <div className="tool-desc">60秒极速计算</div>
            </div>
            <div className="tool-arrow">→</div>
          </div>
          <div
            className="tool-card"
            style={{ borderColor: '#f093fb', background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.05) 0%, rgba(245, 87, 108, 0.05) 100%)' }}
            onClick={() => navigate('/idiom-chain-game')}
          >
            <div className="tool-icon">📚</div>
            <div className="tool-info">
              <div className="tool-title">成语接龙挑战</div>
              <div className="tool-desc">学习中华文化</div>
            </div>
            <div className="tool-arrow">→</div>
          </div>
          <div
            className="tool-card"
            style={{ borderColor: '#4facfe', background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%)' }}
            onClick={() => navigate('/english-spelling-game')}
          >
            <div className="tool-icon">📝</div>
            <div className="tool-info">
              <div className="tool-title">单词拼写大师</div>
              <div className="tool-desc">词汇积累</div>
            </div>
            <div className="tool-arrow">→</div>
          </div>
          <div
            className="tool-card"
            style={{ borderColor: '#a8edea', background: 'linear-gradient(135deg, rgba(168, 237, 234, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%)' }}
            onClick={() => navigate('/science-quiz-game')}
          >
            <div className="tool-icon">🔬</div>
            <div className="tool-info">
              <div className="tool-title">科学知识问答</div>
              <div className="tool-desc">探索科学世界</div>
            </div>
            <div className="tool-arrow">→</div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total_completed}</div>
              <div className="stat-label">已完成</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total_stars}</div>
              <div className="stat-label">总星星</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💯</div>
            <div className="stat-info">
              <div className="stat-value">{stats.perfect_count}</div>
              <div className="stat-label">完美通关</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎖️</div>
            <div className="stat-info">
              <div className="stat-value">{stats.badges_count}</div>
              <div className="stat-label">勋章</div>
            </div>
          </div>
        </div>

        {/* 地图选择 */}
        <div className="map-selector">
          {maps.map((map) => (
            <div
              key={map.id}
              className={`map-card ${selectedMap?.id === map.id ? 'active' : ''}`}
              onClick={() => setSelectedMap(map)}
            >
              <div className="map-header">
                <h3 className="map-name">{map.map_name}</h3>
                <div className="map-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${map.user_completion_rate}%` }}
                    />
                  </div>
                  <span className="progress-text">{map.user_completion_rate.toFixed(0)}%</span>
                </div>
              </div>
              <p className="map-desc">{map.description}</p>
              <div className="map-stats">
                <span className="map-stat">
                  📍 {map.user_current_stage}/{map.total_stages} 关
                </span>
                <span className="map-stat">
                  ⭐ {map.user_stars} 星
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 关卡地图 */}
        {selectedMap && (
          <div className="stages-map">
            <div className="map-title">
              <h2>{selectedMap.map_name}</h2>
              <p>{selectedMap.description}</p>
            </div>

            <div className="stages-container">
              <svg className="stage-connections" width="100%" height="600">
                {stages.map((stage, idx) => {
                  const nextStage = stages[idx + 1]
                  if (nextStage) {
                    return (
                      <line
                        key={`line-${stage.id}`}
                        x1={stage.position_x}
                        y1={stage.position_y}
                        x2={nextStage.position_x}
                        y2={nextStage.position_y}
                        stroke={stage.is_completed ? '#28c76f' : '#e2e8f0'}
                        strokeWidth="4"
                        strokeDasharray={stage.is_completed ? '0' : '8,4'}
                      />
                    )
                  }
                  return null
                })}
              </svg>

              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className={`stage-node ${stage.is_unlocked ? 'unlocked' : 'locked'} ${stage.is_completed ? 'completed' : ''} ${stage.is_current ? 'current' : ''}`}
                  style={{
                    left: `${stage.position_x}px`,
                    top: `${stage.position_y}px`
                  }}
                  onClick={() => handleStageClick(stage)}
                >
                  <div className="stage-icon">{getStageIcon(stage.stage_type)}</div>
                  <div className="stage-number">{stage.stage_number}</div>
                  <div className="stage-name">{stage.stage_name}</div>

                  {/* 难度星级 */}
                  <div className="stage-difficulty">
                    {[...Array(stage.difficulty_stars)].map((_, i) => (
                      <span key={i} className="difficulty-star">⭐</span>
                    ))}
                  </div>

                  {/* 用户星星 */}
                  {stage.user_stars > 0 && (
                    <div className="user-stars">
                      {[...Array(stage.user_stars)].map((_, i) => (
                        <span key={i} className="earned-star">⭐</span>
                      ))}
                    </div>
                  )}

                  {/* 当前关卡指示器 */}
                  {stage.is_current && (
                    <div className="current-indicator">
                      <span className="pulse-dot"></span>
                      当前
                    </div>
                  )}

                  {/* 锁定图标 */}
                  {!stage.is_unlocked && (
                    <div className="lock-icon">🔒</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部操作 */}
        <div className="map-actions">
          <button
            className="action-btn"
            onClick={() => navigate('/learning/badges')}
          >
            🎖️ 我的勋章
          </button>
          <button
            className="action-btn primary"
            onClick={() => {
              const currentStage = stages.find(s => s.is_current)
              if (currentStage) {
                handleStageClick(currentStage)
              }
            }}
            disabled={!stages.some(s => s.is_current)}
          >
            ▶️ 继续学习
          </button>
        </div>
      </div>
    </Layout>
  )
}
