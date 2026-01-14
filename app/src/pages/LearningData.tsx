import { useState, useEffect } from 'react'
import parentAPI from '../services/parentAPI'
import './LearningData.css'

interface ChildInfo {
  id: number
  user_id: string
  nickname: string
  age: number
  gender: string
  avatar: string
}

interface LearningRecord {
  id: string
  date: string
  type: '阅读' | '游戏' | '创作' | '学习'
  title: string
  duration: number
  score?: number
}

interface WeeklyData {
  day: string
  learning: number
  gaming: number
}

export default function LearningData() {
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')
  const [records, setRecords] = useState<LearningRecord[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalLearning: 0,
    totalGaming: 0,
    avgDaily: 0,
    recordCount: 0
  })

  // 加载孩子列表
  useEffect(() => {
    loadChildren()
  }, [])

  // 当选中的孩子或时间范围变化时,加载数据
  useEffect(() => {
    if (selectedChild) {
      loadLearningData(selectedChild.user_id)
    }
  }, [selectedChild, timeRange])

  const loadChildren = async () => {
    try {
      setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  const loadLearningData = async (userId: string) => {
    try {
      // 计算日期范围
      const endDate = new Date().toISOString().split('T')[0]
      const daysBack = timeRange === 'week' ? 7 : 30
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      // 获取使用统计数据
      const statsData = await parentAPI.getUsageStats(parseInt(userId), startDate, endDate)

      if (statsData) {
        // 更新统计数据
        setStats({
          totalLearning: statsData.totalLearningMinutes || 0,
          totalGaming: statsData.totalGamingMinutes || 0,
          avgDaily: Math.round((statsData.totalLearningMinutes || 0) / daysBack),
          recordCount: statsData.totalWorks || 0
        })

        // 处理每日数据为图表数据
        if (statsData.dailyData && Array.isArray(statsData.dailyData)) {
          const chartData = statsData.dailyData.map((day: any) => ({
            day: timeRange === 'week' ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(day.date).getDay()] : day.date,
            learning: day.learningMinutes || 0,
            gaming: day.gamingMinutes || 0
          }))
          setWeeklyData(chartData)
        }

        // 处理学习记录
        if (statsData.records && Array.isArray(statsData.records)) {
          setRecords(statsData.records)
        }
      }
    } catch (err: any) {
      console.error('加载学习数据失败:', err)
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      '阅读': '#4CAF50',
      '游戏': '#FF9800',
      '创作': '#9C27B0',
      '学习': '#2196F3'
    }
    return colors[type as keyof typeof colors] || '#666'
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="learning-data">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  // 空状态
  if (!selectedChild || children.length === 0) {
    return (
      <div className="learning-data">
        <div className="empty-state">
          <div className="empty-icon">👶</div>
          <h3>还没有绑定孩子账号</h3>
          <p>请先添加孩子账号,才能查看学习数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="learning-data">
      {/* 页面头部 */}
      <div className="page-header">
        <div>
          <h2>学习数据</h2>
          <p>查看 {selectedChild.nickname} 的详细学习数据</p>
        </div>
        <div className="time-range-selector">
          <button
            className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            本周
          </button>
          <button
            className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            本月
          </button>
        </div>
      </div>

      {/* 孩子选择器 */}
      {children.length > 1 && (
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
        </div>
      )}

      {/* 数据概览 */}
      <div className="data-overview">
        <div className="overview-card">
          <div className="overview-icon">📚</div>
          <div className="overview-info">
            <span className="overview-label">总学习时长</span>
            <span className="overview-value">{stats.totalLearning}分钟</span>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">🎮</div>
          <div className="overview-info">
            <span className="overview-label">总游戏时长</span>
            <span className="overview-value">{stats.totalGaming}分钟</span>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">📊</div>
          <div className="overview-info">
            <span className="overview-label">日均学习</span>
            <span className="overview-value">{stats.avgDaily}分钟</span>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">🎯</div>
          <div className="overview-info">
            <span className="overview-label">完成记录</span>
            <span className="overview-value">{stats.recordCount}条</span>
          </div>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="chart-section">
        <h3>学习趋势</h3>
        <div className="simple-chart">
          {weeklyData.map((day, index) => {
            const maxValue = Math.max(...weeklyData.map(d => d.learning + d.gaming))
            const learningHeight = (day.learning / maxValue) * 100
            const gamingHeight = (day.gaming / maxValue) * 100

            return (
              <div key={index} className="chart-bar-group">
                <div className="chart-bars">
                  <div
                    className="chart-bar learning"
                    style={{ height: `${learningHeight}%` }}
                    title={`学习: ${day.learning}分钟`}
                  />
                  <div
                    className="chart-bar gaming"
                    style={{ height: `${gamingHeight}%` }}
                    title={`游戏: ${day.gaming}分钟`}
                  />
                </div>
                <span className="chart-label">{day.day}</span>
              </div>
            )
          })}
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-color learning"></span>
            学习时长
          </span>
          <span className="legend-item">
            <span className="legend-color gaming"></span>
            游戏时长
          </span>
        </div>
      </div>

      {/* 学习记录列表 */}
      <div className="records-section">
        <h3>学习记录</h3>
        <div className="records-list">
          {records.map(record => (
            <div key={record.id} className="record-item">
              <div className="record-date">{record.date}</div>
              <div className="record-content">
                <div className="record-header">
                  <span
                    className="record-type"
                    style={{ backgroundColor: getTypeColor(record.type) }}
                  >
                    {record.type}
                  </span>
                  <span className="record-title">{record.title}</span>
                </div>
                <div className="record-meta">
                  <span className="record-duration">⏱️ {record.duration}分钟</span>
                  {record.score && (
                    <span className="record-score">⭐ {record.score}分</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
