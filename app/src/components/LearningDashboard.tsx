import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './LearningDashboard.css'

interface DashboardData {
  today: {
    total_learning_time: number
    points_earned: number
    questions_answered: number
    questions_correct: number
    learning_sessions: number
  }
  weeklyTrend: Array<{
    stat_date: string
    total_learning_time: number
    points_earned: number
  }>
  streakDays: number
  points: {
    points: number
    level: number
    level_name: string
    required_points: number
    next_level_points: number | null
  }
  rank: {
    rank: number | null
    total_time: number
  }
  tasks: {
    total_tasks: number
    completed_tasks: number
  }
  recentAchievements: Array<{
    name: string
    icon: string
    rarity: string
    unlocked_at: string
  }>
}

export default function LearningDashboard() {
  const navigate = useNavigate()
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/learning-analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      if (result.success) {
        setDashboardData(result.data)
      }
    } catch (error) {
      console.error('获取学习仪表盘数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 格式化学习时长(分钟转小时分钟)
  const formatLearningTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  // 计算任务完成百分比
  const getTaskProgress = () => {
    if (!dashboardData || dashboardData.tasks.total_tasks === 0) return 0
    return Math.round((dashboardData.tasks.completed_tasks / dashboardData.tasks.total_tasks) * 100)
  }

  // 计算等级进度百分比
  const getLevelProgress = () => {
    if (!dashboardData || !dashboardData.points.next_level_points) return 100
    const current = dashboardData.points.points - dashboardData.points.required_points
    const total = dashboardData.points.next_level_points - dashboardData.points.required_points
    return Math.round((current / total) * 100)
  }

  // 获取当前时间段问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '深夜好'
    if (hour < 12) return '早上好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  // 获取稀有度颜色
  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'common': '#95a5a6',
      'rare': '#3498db',
      'epic': '#9b59b6',
      'legendary': '#f39c12'
    }
    return colors[rarity] || '#95a5a6'
  }

  if (loading) {
    return (
      <div className="welcome-card-new loading-state">
        <div className="loading-content">
          <div className="loading-spinner">⏳</div>
          <div className="loading-text">正在加载学习数据...</div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="welcome-card-new error-state">
        <div className="error-content">
          <div className="error-icon">🔒</div>
          <div className="error-title">需要登录查看</div>
          <div className="error-description">登录后即可查看你的学习数据和进度</div>
          <button
            className="error-login-btn"
            onClick={() => navigate('/login')}
          >
            立即登录
          </button>
        </div>
      </div>
    )
  }

  const taskProgress = getTaskProgress()
  const levelProgress = getLevelProgress()

  return (
    <div className="learning-dashboard">
      {/* 个性化欢迎卡片 */}
      <div className="welcome-card-new">
        <div className="welcome-header-row">
          <div className="welcome-user-info">
            <div className="welcome-avatar-new">{userProfile.avatar || '👤'}</div>
            <div className="welcome-text">
              <div className="welcome-greeting-new">{getGreeting()}，{userProfile.name || '小朋友'}！</div>
              <div className="welcome-subtitle-new">继续你的学习之旅</div>
            </div>
          </div>
          {dashboardData.rank.rank && (
            <div className="rank-badge">
              <div className="rank-icon">🏆</div>
              <div className="rank-text">
                <div className="rank-label">本周排名</div>
                <div className="rank-value">第{dashboardData.rank.rank}名</div>
              </div>
            </div>
          )}
        </div>

        {/* 核心数据卡片 */}
        <div className="learning-stats-row">
          <div className="stat-chip" onClick={() => navigate('/coins-detail')}>
            <span className="stat-chip-icon">⭐</span>
            <span className="stat-chip-label">学习积分</span>
            <span className="stat-chip-value">{dashboardData.points.points}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-icon">🔥</span>
            <span className="stat-chip-label">连续签到</span>
            <span className="stat-chip-value">{dashboardData.streakDays}天</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-icon">⏱️</span>
            <span className="stat-chip-label">今日学习</span>
            <span className="stat-chip-value">{formatLearningTime(dashboardData.today.total_learning_time || 0)}</span>
          </div>
        </div>

        {/* 等级进度 */}
        <div className="level-section">
          <div className="level-header">
            <span className="level-badge">Lv.{dashboardData.points.level} {dashboardData.points.level_name}</span>
            {dashboardData.points.next_level_points && (
              <span className="level-progress-text">
                {dashboardData.points.points} / {dashboardData.points.next_level_points}
              </span>
            )}
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill level-progress"
              style={{ width: `${levelProgress}%` }}
            ></div>
          </div>
        </div>

        {/* 今日任务进度 */}
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">
              今日任务进度 ({dashboardData.tasks.completed_tasks}/{dashboardData.tasks.total_tasks})
            </span>
            <span className="progress-percentage">{taskProgress}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${taskProgress}%` }}
            ></div>
          </div>
        </div>

        {/* 今日学习数据 */}
        {dashboardData.today.learning_sessions > 0 && (
          <div className="today-stats-grid">
            <div className="today-stat-item">
              <div className="today-stat-icon">📚</div>
              <div className="today-stat-value">{dashboardData.today.learning_sessions}</div>
              <div className="today-stat-label">学习次数</div>
            </div>
            <div className="today-stat-item">
              <div className="today-stat-icon">✍️</div>
              <div className="today-stat-value">{dashboardData.today.questions_answered}</div>
              <div className="today-stat-label">答题数</div>
            </div>
            <div className="today-stat-item">
              <div className="today-stat-icon">✅</div>
              <div className="today-stat-value">
                {dashboardData.today.questions_answered > 0
                  ? Math.round((dashboardData.today.questions_correct / dashboardData.today.questions_answered) * 100)
                  : 0}%
              </div>
              <div className="today-stat-label">正确率</div>
            </div>
            <div className="today-stat-item">
              <div className="today-stat-icon">🎁</div>
              <div className="today-stat-value">+{dashboardData.today.points_earned}</div>
              <div className="today-stat-label">今日积分</div>
            </div>
          </div>
        )}

        {/* 最近成就 */}
        {dashboardData.recentAchievements.length > 0 && (
          <div className="recent-achievements">
            <div className="achievements-header">
              <span className="achievements-title">🏆 最近成就</span>
              <span
                className="achievements-more"
                onClick={() => navigate('/daily-tasks')}
              >
                查看全部 →
              </span>
            </div>
            <div className="achievements-list">
              {dashboardData.recentAchievements.map((achievement, idx) => (
                <div
                  key={idx}
                  className="achievement-badge"
                  style={{ borderColor: getRarityColor(achievement.rarity) }}
                >
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-name">{achievement.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 快捷操作按钮 */}
        <div className="quick-task-buttons">
          <button
            className="task-btn task-btn-primary"
            onClick={() => navigate('/learning-map')}
          >
            📖 继续学习
          </button>
          <button
            className="task-btn task-btn-secondary"
            onClick={() => navigate('/daily-tasks')}
          >
            🎯 每日任务
          </button>
        </div>
      </div>
    </div>
  )
}
