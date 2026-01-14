import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import parentAPI from '../services/parentAPI'
import './ParentDashboard.css'

interface ChildInfo {
  id: number
  user_id: string
  nickname: string
  age: number
  gender: string
  avatar: string
}

interface UsageStats {
  todayLearning: number
  todayGaming: number
  weeklyLearning: number
  totalWorks: number
}

export default function ParentDashboard() {
  const navigate = useNavigate()
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null)
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [stats, setStats] = useState<UsageStats>({
    todayLearning: 0,
    todayGaming: 0,
    weeklyLearning: 0,
    totalWorks: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载孩子列表
  useEffect(() => {
    loadChildren()
  }, [])

  // 当选中的孩子变化时,加载该孩子的使用数据
  useEffect(() => {
    if (selectedChild) {
      loadUsageStats(selectedChild.user_id)
    }
  }, [selectedChild])

  const loadChildren = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const childrenData = await parentAPI.getChildren()

      if (childrenData && childrenData.length > 0) {
        setChildren(childrenData)
        setSelectedChild(childrenData[0])
      } else {
        setChildren([])
        setSelectedChild(null)
      }
    } catch (err: any) {
      console.error('加载孩子列表失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsageStats = async (userId: string) => {
    try {
      // 获取今日使用数据
      const todayData = await parentAPI.getTodayUsage(parseInt(userId))

      // 获取本周统计
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const weeklyData = await parentAPI.getUsageStats(parseInt(userId), startDate, endDate)

      setStats({
        todayLearning: todayData?.learningMinutes || 0,
        todayGaming: todayData?.gamingMinutes || 0,
        weeklyLearning: weeklyData?.totalLearningMinutes || 0,
        totalWorks: weeklyData?.totalWorks || 0
      })
    } catch (err: any) {
      console.error('加载使用数据失败:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="parent-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="parent-dashboard">
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <button className="retry-btn" onClick={loadChildren}>重试</button>
        </div>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="parent-dashboard">
        <div className="empty-state">
          <div className="empty-icon">👶</div>
          <h3>还没有绑定孩子账号</h3>
          <p>请先添加孩子账号,才能查看学习数据</p>
          <button
            className="add-child-btn"
            onClick={() => navigate('/parent/children')}
          >
            添加孩子账号
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="parent-dashboard">
      {/* 页面标题 */}
      <div className="dashboard-header">
        <h2>控制台</h2>
        <p>查看孩子的学习情况和使用数据</p>
      </div>

      {/* 孩子选择器 */}
      <div className="child-selector">
        {children.map(child => (
          <button
            key={child.id}
            className={`child-card ${selectedChild?.id === child.id ? 'active' : ''}`}
            onClick={() => setSelectedChild(child)}
          >
            <span className="child-avatar">{child.avatar || (child.gender === '男' ? '👦' : '👧')}</span>
            <div className="child-info">
              <span className="child-name">{child.nickname}</span>
              <span className="child-age">{child.age}岁</span>
            </div>
          </button>
        ))}
        <button
          className="child-card add-child"
          onClick={() => navigate('/parent/children')}
        >
          <span className="child-avatar">➕</span>
          <div className="child-info">
            <span className="child-name">添加孩子</span>
          </div>
        </button>
      </div>

      {/* 数据统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <span className="stat-label">今日学习</span>
            <span className="stat-value">{stats.todayLearning}分钟</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-info">
            <span className="stat-label">今日游戏</span>
            <span className="stat-value">{stats.todayGaming}分钟</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-label">本周学习</span>
            <span className="stat-value">{stats.weeklyLearning}分钟</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎨</div>
          <div className="stat-info">
            <span className="stat-label">创作作品</span>
            <span className="stat-value">{stats.totalWorks}个</span>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="quick-actions">
        <h3>快捷操作</h3>
        <div className="action-buttons">
          <button
            className="action-btn"
            onClick={() => navigate('/parent/usage-control')}
          >
            <span className="action-icon">⏰</span>
            <span className="action-text">设置使用时间</span>
          </button>
          <button
            className="action-btn"
            onClick={() => navigate('/parent/learning-data')}
          >
            <span className="action-icon">📈</span>
            <span className="action-text">查看详细数据</span>
          </button>
          <button
            className="action-btn"
            onClick={() => navigate('/parent/growth-report')}
          >
            <span className="action-icon">📝</span>
            <span className="action-text">生成成长报告</span>
          </button>
          <button
            className="action-btn"
            onClick={() => navigate('/parent/usage-control')}
          >
            <span className="action-icon">🔒</span>
            <span className="action-text">内容访问控制</span>
          </button>
        </div>
      </div>
    </div>
  )
}
