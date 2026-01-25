import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { useToast } from '../components/Toast'
import './PetAdopt.css'

interface PetType {
  id: number
  name: string
  emoji: string
  description: string
  rarity: string
}

// 主流宠物类型
const petTypes: PetType[] = [
  {
    id: 1,
    name: '小猫咪',
    emoji: '🐱',
    description: '温柔可爱的小猫，喜欢安静地陪伴你学习',
    rarity: 'common'
  },
  {
    id: 2,
    name: '小狗狗',
    emoji: '🐶',
    description: '忠诚活泼的小狗，会在你完成任务时兴奋地摇尾巴',
    rarity: 'common'
  },
  {
    id: 3,
    name: '小兔子',
    emoji: '🐰',
    description: '机灵可爱的小兔，和你一起蹦蹦跳跳学习',
    rarity: 'common'
  },
  {
    id: 4,
    name: '小熊猫',
    emoji: '🐼',
    description: '憨态可掬的熊猫宝宝，学习时超级认真',
    rarity: 'rare'
  },
  {
    id: 5,
    name: '小企鹅',
    emoji: '🐧',
    description: '萌萌的小企鹅，喜欢和你分享学习心得',
    rarity: 'common'
  },
  {
    id: 6,
    name: '小猴子',
    emoji: '🐵',
    description: '聪明伶俐的小猴，学习速度超快',
    rarity: 'rare'
  },
  {
    id: 7,
    name: '小狐狸',
    emoji: '🦊',
    description: '机智的小狐狸，能帮你解决学习难题',
    rarity: 'rare'
  },
  {
    id: 8,
    name: '机器小宝',
    emoji: '🤖',
    description: '超级可爱的AI机器人，会用科技魔法帮你学习',
    rarity: 'epic'
  },
  {
    id: 9,
    name: '小恐龙',
    emoji: '🦖',
    description: '勇敢的小恐龙，陪你克服学习挑战',
    rarity: 'epic'
  },
  {
    id: 10,
    name: '小独角兽',
    emoji: '🦄',
    description: '神奇的独角兽，能激发你的学习潜能',
    rarity: 'epic'
  },
  {
    id: 11,
    name: '小龙',
    emoji: '🐉',
    description: '传说中的小龙，拥有无穷的智慧',
    rarity: 'legendary'
  }
]

const rarityColors: Record<string, string> = {
  common: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800'
}

const rarityNames: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

export default function PetAdopt() {
  const toast = useToast()
  const navigate = useNavigate()
  const [selectedPet, setSelectedPet] = useState<PetType | null>(null)
  const [nickname, setNickname] = useState('')
  const [adopting, setAdopting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [adoptedPet, setAdoptedPet] = useState<{ emoji: string; nickname: string } | null>(null)

  const handleAdopt = async () => {
    if (!selectedPet || !nickname.trim()) {
      toast.warning('请选择宠物并输入昵称')
      return
    }

    setAdopting(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pets/adopt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          petTypeId: selectedPet.id,
          nickname: nickname.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        // 显示成功模态框
        setAdoptedPet({ emoji: selectedPet.emoji, nickname: nickname.trim() })
        setShowSuccessModal(true)
        toast.success(`🎉 成功领养了${nickname.trim()}！`)

        // 3秒后跳转到首页
        setTimeout(() => {
          navigate('/')
        }, 3000)
      } else {
        toast.error(data.message || '领养失败，请重试')
        setAdopting(false)
      }
    } catch (error) {
      console.error('领养失败:', error)
      toast.error('领养失败，请检查网络连接')
      setAdopting(false)
    }
  }

  return (
    <>
      {/* 领养成功模态框 */}
      {showSuccessModal && adoptedPet && (
        <div className="adopt-success-modal">
          <div className="success-modal-content">
            <div className="success-animation">
              <div className="success-icon-large">🎉</div>
              <div className="success-pet-emoji">{adoptedPet.emoji}</div>
            </div>
            <h2 className="success-title">领养成功!</h2>
            <p className="success-message">
              恭喜你获得了新伙伴 <strong>{adoptedPet.nickname}</strong>
            </p>
            <div className="success-tips">
              <div className="tip-item">✨ 它会陪伴你一起学习</div>
              <div className="tip-item">📚 完成任务可以获得经验</div>
              <div className="tip-item">💝 记得定期喂食和互动哦</div>
            </div>
            <div className="redirect-hint">3秒后自动跳转到首页...</div>
          </div>
        </div>
      )}

      <Layout>
        <Header title="领养学习伙伴" />
      <div className="pet-adopt-container">
        <div className="adopt-intro">
          <div className="intro-icon">✨</div>
          <h2>选择你的学习伙伴</h2>
          <p>它会陪伴你一起学习成长，快来选择一个喜欢的吧！</p>
        </div>

        <div className="pet-grid">
          {petTypes.map((pet) => (
            <div
              key={pet.id}
              className={`pet-card-adopt ${selectedPet?.id === pet.id ? 'selected' : ''}`}
              onClick={() => setSelectedPet(pet)}
              style={{
                borderColor: selectedPet?.id === pet.id ? rarityColors[pet.rarity] : 'transparent'
              }}
            >
              <div className="pet-emoji-adopt">{pet.emoji}</div>
              <div className="pet-name-adopt">{pet.name}</div>
              <div
                className="pet-rarity"
                style={{ color: rarityColors[pet.rarity] }}
              >
                {rarityNames[pet.rarity]}
              </div>
              <div className="pet-desc-adopt">{pet.description}</div>
              {selectedPet?.id === pet.id && (
                <div className="selected-badge">✓ 已选择</div>
              )}
            </div>
          ))}
        </div>

        {selectedPet && (
          <div className="nickname-section">
            <h3>给它起个昵称吧</h3>
            <div className="nickname-input-wrapper">
              <input
                type="text"
                className="nickname-input"
                placeholder={`我的${selectedPet.name}`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 10))}
                maxLength={10}
              />
              <span className="char-count">{nickname.length}/10</span>
            </div>
            <button
              className="adopt-confirm-btn"
              onClick={handleAdopt}
              disabled={adopting || !nickname.trim()}
            >
              {adopting ? '领养中...' : `领养 ${selectedPet.emoji}`}
            </button>
          </div>
        )}
      </div>
    </Layout>
    </>
  )
}
