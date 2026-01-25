import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { useToast } from '../components/Toast'
import './PetDetail.css'

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
  created_at: string
}

export default function PetDetail() {
  const toast = useToast()
  const navigate = useNavigate()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)

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

  const handleInteract = async (type: string) => {
    if (!pet) return

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
        // 显示互动反馈
        const messages = {
          feed: `🍎 ${pet.nickname}开心地吃了起来！`,
          play: `🎮 ${pet.nickname}玩得很开心！`,
          study: `📚 ${pet.nickname}认真学习中！`
        }
        toast.success(messages[type as keyof typeof messages] || '互动成功！')

        // 重新加载数据
        await loadPet()

        if (data.data.newLevel) {
          setTimeout(() => {
            toast.success(`🎉 恭喜！${pet.nickname}升到了${data.data.newLevel}级！`)
          }, 1000)
        }
      } else {
        toast.error(data.message || '互动失败')
      }
    } catch (error) {
      console.error('互动失败:', error)
      toast.error('互动失败，请稍后重试')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return `${days}天`
  }

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`
  }

  if (loading) {
    return (
      <Layout>
        <Header title="学习伙伴详情" />
        <div className="pet-detail-loading">加载中...</div>
      </Layout>
    )
  }

  if (!pet) {
    return (
      <Layout>
        <Header title="学习伙伴详情" />
        <div className="pet-detail-empty">
          <div className="empty-icon">🐾</div>
          <p>还没有学习伙伴</p>
          <button className="adopt-btn-detail" onClick={() => navigate('/pet-adopt')}>
            去领养
          </button>
        </div>
      </Layout>
    )
  }

  // 计算宠物状态
  const getStatusColor = (value: number) => {
    if (value >= 70) return '#4caf50'
    if (value >= 40) return '#ff9800'
    return '#f44336'
  }

  const getStatusText = (value: number) => {
    if (value >= 70) return '良好'
    if (value >= 40) return '一般'
    return '需要关注'
  }

  return (
    <Layout>
      <Header title="学习伙伴详情" />
      <div className="pet-detail-container">
        {/* 宠物头像和基本信息 */}
        <div className="pet-header-section">
          <div className="pet-avatar-large">{pet.pet_emoji}</div>
          <div className="pet-basic-info">
            <h1 className="pet-nickname">{pet.nickname}</h1>
            <div className="pet-type">{pet.pet_type_name}</div>
            <div className="pet-level-info">
              <span className="level-badge">Lv.{pet.level}</span>
              <span className="companion-days">陪伴 {formatDate(pet.created_at)}</span>
            </div>
          </div>
        </div>

        {/* 经验值 */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-icon">⭐</span>
            <span className="stat-title">经验值</span>
          </div>
          <div className="exp-bar-large">
            <div
              className="exp-bar-fill-large"
              style={{ width: `${pet.exp_progress}%` }}
            />
          </div>
          <div className="exp-text">
            {pet.experience} / {pet.next_level_exp} EXP
          </div>
        </div>

        {/* 状态值详情 */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-icon">💝</span>
              <span className="stat-title">快乐值</span>
            </div>
            <div className="stat-value-large" style={{ color: getStatusColor(pet.happiness) }}>
              {pet.happiness}
            </div>
            <div className="stat-status">{getStatusText(pet.happiness)}</div>
            <div className="stat-bar-detail">
              <div
                className="stat-fill-detail happiness"
                style={{ width: `${pet.happiness}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-icon">🍖</span>
              <span className="stat-title">饱食度</span>
            </div>
            <div className="stat-value-large" style={{ color: getStatusColor(pet.hunger) }}>
              {pet.hunger}
            </div>
            <div className="stat-status">{getStatusText(pet.hunger)}</div>
            <div className="stat-bar-detail">
              <div
                className="stat-fill-detail hunger"
                style={{ width: `${pet.hunger}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-icon">⚡</span>
              <span className="stat-title">精力值</span>
            </div>
            <div className="stat-value-large" style={{ color: getStatusColor(pet.energy) }}>
              {pet.energy}
            </div>
            <div className="stat-status">{getStatusText(pet.energy)}</div>
            <div className="stat-bar-detail">
              <div
                className="stat-fill-detail energy"
                style={{ width: `${pet.energy}%` }}
              />
            </div>
          </div>
        </div>

        {/* 学习统计 */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-icon">📚</span>
            <span className="stat-title">学习统计</span>
          </div>
          <div className="study-stats">
            <div className="study-stat-item">
              <div className="study-stat-label">总学习时长</div>
              <div className="study-stat-value">{formatStudyTime(pet.total_study_time)}</div>
            </div>
            <div className="study-stat-item">
              <div className="study-stat-label">当前等级</div>
              <div className="study-stat-value">Lv.{pet.level}</div>
            </div>
            <div className="study-stat-item">
              <div className="study-stat-label">陪伴天数</div>
              <div className="study-stat-value">{formatDate(pet.created_at)}</div>
            </div>
          </div>
        </div>

        {/* 互动按钮 */}
        <div className="interaction-buttons">
          <button className="interact-btn feed" onClick={() => handleInteract('feed')}>
            <span className="btn-icon">🍎</span>
            <span className="btn-text">喂食</span>
          </button>
          <button className="interact-btn play" onClick={() => handleInteract('play')}>
            <span className="btn-icon">🎮</span>
            <span className="btn-text">玩耍</span>
          </button>
          <button className="interact-btn study" onClick={() => handleInteract('study')}>
            <span className="btn-icon">📚</span>
            <span className="btn-text">学习</span>
          </button>
        </div>

        {/* 商店入口 */}
        <div className="shop-entry">
          <button className="shop-btn" onClick={() => toast.info('宠物商店即将开放...')}>
            <span className="shop-icon">🛍️</span>
            <span className="shop-text">宠物商店</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}
