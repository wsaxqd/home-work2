import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { useToast } from '../components/Toast'
import './CheckinAchievements.css'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  rewardPoints: number
  requirement: {
    type: string
    value: number
  }
  progress?: number
  unlocked: boolean
  unlockedAt?: string
}

const RARITY_CONFIG = {
  common: {
    label: '普通',
    color: '#95a5a6',
    bgColor: 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)'
  },
  rare: {
    label: '稀有',
    color: '#3498db',
    bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  epic: {
    label: '史诗',
    color: '#9b59b6',
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  legendary: {
    label: '传说',
    color: '#f39c12',
    bgColor: 'linear-gradient(135deg, #ffd89b 0%, #ff9a3d 100%)'
  }
}

export default function CheckinAchievements() {
  const navigate = useNavigate()
  const toast = useToast()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')
  const [totalPoints, setTotalPoints] = useState(0)
  const [unlockedCount, setUnlockedCount] = useState(0)

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/checkin/achievements', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        const achievementsList = data.data || []
        setAchievements(achievementsList)

        // 计算统计数据
        const unlocked = achievementsList.filter((a: Achievement) => a.unlocked)
        setUnlockedCount(unlocked.length)
        setTotalPoints(unlocked.reduce((sum: number, a: Achievement) => sum + a.rewardPoints, 0))
      }
    } catch (error) {
      console.error('加载成就列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimReward = async (achievementId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:3000/api/checkin/achievements/${achievementId}/claim`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      const data = await response.json()
      if (data.success) {
        toast.success('奖励已领取!')
        await loadAchievements()
      } else {
        toast.error(data.message || '领取失败')
      }
    } catch (error) {
      console.error('领取奖励失败:', error)
      toast.error('领取失败，请重试')
    }
  }

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked') return achievement.unlocked
    if (filter === 'locked') return !achievement.unlocked
    return true
  })

  const getProgressPercentage = (achievement: Achievement) => {
    if (achievement.unlocked) return 100
    if (!achievement.progress) return 0
    return Math.min(100, (achievement.progress / achievement.requirement.value) * 100)
  }

  if (loading) {
    return (
      <Layout>
        <Header
          title="成就徽章"
          gradient="linear-gradient(135deg, #ffd89b 0%, #ff9a3d 100%)"
          showBack={true}
        />
        <div className="main-content" style={{ textAlign: 'center', padding: '40px' }}>
          <div>加载中...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Header
        title="成就徽章"
        gradient="linear-gradient(135deg, #ffd89b 0%, #ff9a3d 100%)"
        showBack={true}
      />

      <div className="main-content achievements-container">
        {/* 成就总览 */}
        <div className="achievements-overview">
          <div className="overview-card">
            <div className="overview-icon">🏆</div>
            <div className="overview-info">
              <div className="overview-value">
                {unlockedCount} / {achievements.length}
              </div>
              <div className="overview-label">已解锁成就</div>
            </div>
          </div>

          <div className="overview-card">
            <div className="overview-icon">💰</div>
            <div className="overview-info">
              <div className="overview-value">{totalPoints}</div>
              <div className="overview-label">累计获得积分</div>
            </div>
          </div>

          <div className="overview-card">
            <div className="overview-icon">📊</div>
            <div className="overview-info">
              <div className="overview-value">
                {achievements.length > 0
                  ? Math.round((unlockedCount / achievements.length) * 100)
                  : 0}
                %
              </div>
              <div className="overview-label">完成度</div>
            </div>
          </div>
        </div>

        {/* 筛选按钮 */}
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 ({achievements.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unlocked' ? 'active' : ''}`}
            onClick={() => setFilter('unlocked')}
          >
            已解锁 ({unlockedCount})
          </button>
          <button
            className={`filter-btn ${filter === 'locked' ? 'active' : ''}`}
            onClick={() => setFilter('locked')}
          >
            未解锁 ({achievements.length - unlockedCount})
          </button>
        </div>

        {/* 成就列表 */}
        <div className="achievements-list">
          {filteredAchievements.map(achievement => {
            const rarityConfig = RARITY_CONFIG[achievement.rarity]
            const progress = getProgressPercentage(achievement)

            return (
              <div
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
              >
                {/* 稀有度标签 */}
                <div
                  className="rarity-badge"
                  style={{ background: rarityConfig.bgColor }}
                >
                  {rarityConfig.label}
                </div>

                {/* 成就图标 */}
                <div className="achievement-icon-wrapper">
                  <div
                    className="achievement-icon-bg"
                    style={{
                      background: achievement.unlocked ? rarityConfig.bgColor : '#e0e0e0'
                    }}
                  ></div>
                  <div className="achievement-icon">
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                </div>

                {/* 成就信息 */}
                <div className="achievement-info">
                  <div className="achievement-title">{achievement.title}</div>
                  <div className="achievement-desc">{achievement.description}</div>

                  {/* 进度条 */}
                  {!achievement.unlocked && (
                    <div className="achievement-progress">
                      <div className="progress-bar-wrapper">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${progress}%`,
                            background: rarityConfig.color
                          }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {achievement.progress || 0} / {achievement.requirement.value}
                      </div>
                    </div>
                  )}

                  {/* 奖励信息 */}
                  <div className="achievement-reward">
                    <span className="reward-icon">💰</span>
                    <span className="reward-text">+{achievement.rewardPoints} 积分</span>
                  </div>

                  {/* 解锁时间 */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="unlocked-date">
                      解锁于 {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* 领取按钮 */}
                {achievement.unlocked && (
                  <button
                    className="claim-btn"
                    style={{ background: rarityConfig.bgColor }}
                    onClick={() => handleClaimReward(achievement.id)}
                  >
                    已解锁 ✓
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="empty-achievements">
            <div className="empty-icon">🏆</div>
            <div className="empty-text">
              {filter === 'unlocked'
                ? '还没有解锁任何成就，继续努力吧！'
                : '暂无符合条件的成就'}
            </div>
          </div>
        )}

        {/* 成就说明 */}
        <div className="achievements-guide">
          <div className="guide-title">🎯 如何获得成就？</div>
          <div className="guide-list">
            <div className="guide-item">
              <div className="guide-icon">📅</div>
              <div className="guide-text">坚持每日签到，完成累计和连续签到任务</div>
            </div>
            <div className="guide-item">
              <div className="guide-icon">📝</div>
              <div className="guide-text">培养好习惯，坚持习惯打卡</div>
            </div>
            <div className="guide-item">
              <div className="guide-icon">🏆</div>
              <div className="guide-text">解锁成就后自动获得积分奖励</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
