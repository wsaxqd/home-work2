import { useState, useEffect } from 'react'
import './PetCompanion.css'

interface Pet {
  id: number
  nickname: string
  pet_emoji: string
  pet_type_name: string
  level: number
  experience: number
  next_level_exp: number
  exp_progress: number
  hunger: number
  energy: number
  happiness: number
  total_study_time: number
}

interface PetCompanionProps {
  onInteraction?: (type: string) => void
}

export default function PetCompanion({ onInteraction }: PetCompanionProps) {
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [message, setMessage] = useState('')
  const [showFeedModal, setShowFeedModal] = useState(false)
  const [interacting, setInteracting] = useState(false)

  // 加载宠物数据
  useEffect(() => {
    loadPet()
  }, [])

  const loadPet = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pets/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setPet(data.data)
      }
    } catch (error) {
      console.error('加载宠物失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 互动
  const handleInteract = async (type: string) => {
    if (!pet || interacting) return

    // 如果是喂食，先检查是否有食物，简化流程直接喂食
    setInteracting(true)
    setShowMenu(false)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pets/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ interactionType: type })
      })

      const data = await response.json()
      if (data.success) {
        // 显示互动反馈消息
        const messages = {
          feed: `🍎 ${pet.nickname}开心地吃了起来！饥饿度+20`,
          play: `🎮 ${pet.nickname}玩得很开心！快乐度+15`,
          study: `📚 ${pet.nickname}认真学习中！经验值+20`
        }
        setMessage(messages[type as keyof typeof messages] || data.message)
        setTimeout(() => setMessage(''), 2500)

        // 重新加载宠物数据
        await loadPet()
        onInteraction?.(type)

        // 检查是否升级
        if (data.data.newLevel) {
          setTimeout(() => {
            showLevelUpAnimation(data.data.newLevel)
          }, 2600)
        }
      } else {
        setMessage(data.message || '互动失败')
        setTimeout(() => setMessage(''), 2000)
      }
    } catch (error) {
      console.error('互动失败:', error)
      setMessage('互动失败，请稍后重试')
      setTimeout(() => setMessage(''), 2000)
    } finally {
      setInteracting(false)
    }
  }

  const showLevelUpAnimation = (newLevel: number) => {
    setMessage(`🎉 恭喜！${pet?.nickname}升到了${newLevel}级！`)
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) {
    return (
      <div className="pet-companion loading">
        <div className="pet-loading">加载中...</div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="pet-companion empty">
        <div className="pet-empty-state">
          <div className="empty-icon">🐾</div>
          <p>还没有学习伙伴</p>
          <button className="adopt-btn" onClick={() => window.location.href = '/pet-adopt'}>
            领养一只
          </button>
        </div>
      </div>
    )
  }

  // 根据状态值确定宠物心情
  const getPetMood = () => {
    if (pet.happiness > 80) return 'happy'
    if (pet.happiness > 50) return 'normal'
    if (pet.energy < 30) return 'tired'
    if (pet.hunger < 30) return 'hungry'
    return 'sad'
  }

  const mood = getPetMood()

  return (
    <div className="pet-companion">
      {/* 消息提示 */}
      {message && (
        <div className="pet-message-toast">{message}</div>
      )}

      {/* 宠物卡片 */}
      <div className={`pet-card ${mood}`} onClick={() => setShowMenu(!showMenu)}>
        {/* 宠物角色 */}
        <div className="pet-character">
          <div className="pet-emoji-large">{pet.pet_emoji}</div>
          <div className="pet-level-badge">Lv.{pet.level}</div>

          {/* 状态气泡 */}
          {pet.hunger < 30 && (
            <div className="status-bubble hungry">🍎</div>
          )}
          {pet.energy < 30 && (
            <div className="status-bubble tired">💤</div>
          )}
        </div>

        {/* 宠物信息 */}
        <div className="pet-info">
          <div className="pet-name-section">
            <div className="pet-name">{pet.nickname}</div>
            <div className="pet-type">({pet.pet_type_name})</div>
          </div>

          {/* 经验值进度条 */}
          <div className="exp-bar-container">
            <div className="exp-bar-label">
              <span>EXP</span>
              <span>{pet.experience}/{pet.next_level_exp}</span>
            </div>
            <div className="exp-bar">
              <div
                className="exp-bar-fill"
                style={{ width: `${pet.exp_progress}%` }}
              />
            </div>
          </div>

          {/* 状态值 */}
          <div className="pet-stats-mini">
            <div className="stat-mini">
              <span className="stat-icon">💝</span>
              <div className="stat-bar-small">
                <div
                  className="stat-fill happiness"
                  style={{ width: `${pet.happiness}%` }}
                />
              </div>
              <span className="stat-value-small">{pet.happiness}</span>
            </div>

            <div className="stat-mini">
              <span className="stat-icon">🍖</span>
              <div className="stat-bar-small">
                <div
                  className="stat-fill hunger"
                  style={{ width: `${pet.hunger}%` }}
                />
              </div>
              <span className="stat-value-small">{pet.hunger}</span>
            </div>

            <div className="stat-mini">
              <span className="stat-icon">⚡</span>
              <div className="stat-bar-small">
                <div
                  className="stat-fill energy"
                  style={{ width: `${pet.energy}%` }}
                />
              </div>
              <span className="stat-value-small">{pet.energy}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 互动菜单 */}
      {showMenu && (
        <div className="pet-interaction-menu">
          <div
            className={`interaction-option ${interacting ? 'disabled' : ''}`}
            onClick={() => !interacting && handleInteract('feed')}
          >
            <span className="option-icon">🍎</span>
            <span className="option-label">喂食</span>
          </div>
          <div
            className={`interaction-option ${interacting ? 'disabled' : ''}`}
            onClick={() => !interacting && handleInteract('play')}
          >
            <span className="option-icon">🎮</span>
            <span className="option-label">玩耍</span>
          </div>
          <div
            className={`interaction-option ${interacting ? 'disabled' : ''}`}
            onClick={() => !interacting && handleInteract('study')}
          >
            <span className="option-icon">📚</span>
            <span className="option-label">学习</span>
          </div>
          <div className="interaction-option" onClick={() => window.location.href = '/pet-detail'}>
            <span className="option-icon">ℹ️</span>
            <span className="option-label">详情</span>
          </div>
        </div>
      )}
    </div>
  )
}
