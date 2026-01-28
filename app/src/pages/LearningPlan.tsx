import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import * as learningPlanApi from '../services/api/learningPlan'
import './LearningPlan.css'

interface LearningPlan {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'paused' | 'expired'
  target_subjects: string[]
  daily_learning_time: number
  difficulty_level: number
  completion_rate: number
  is_ai_generated: boolean
  created_at: string
}

export default function LearningPlan() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<LearningPlan[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [activeTab])

  const fetchPlans = async () => {
    setIsLoading(true)
    try {
      const status = activeTab === 'active' ? 'active' : undefined
      const response = await learningPlanApi.getMyPlans(status)
      setPlans(response.data || [])
    } catch (error) {
      console.error('获取学习计划失败:', error)
      setPlans([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '进行中',
      completed: '已完成',
      paused: '已暂停',
      expired: '已过期'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      active: '#4CAF50',
      completed: '#2196F3',
      paused: '#FF9800',
      expired: '#9E9E9E'
    }
    return colorMap[status] || '#9E9E9E'
  }

  const getDifficultyStars = (level: number) => {
    return '⭐'.repeat(Math.min(level, 5))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  return (
    <Layout>
      <Header
        title="学习计划"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        showBack={true}
        action={
          <button className="header-add-btn" onClick={() => setShowCreateDialog(true)}>
            ➕ 新建
          </button>
        }
      />

      <div className="main-content">
        {/* 顶部统计卡片 */}
        <div className="plan-stats-banner">
          <div className="stat-box">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{plans.filter(p => p.status === 'active').length}</div>
              <div className="stat-label">进行中</div>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{plans.filter(p => p.status === 'completed').length}</div>
              <div className="stat-label">已完成</div>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <div className="stat-value">
                {plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.completion_rate, 0) / plans.length) : 0}%
              </div>
              <div className="stat-label">平均完成度</div>
            </div>
          </div>
        </div>

        {/* 标签页切换 */}
        <div className="plan-tabs">
          <button
            className={`plan-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <span className="tab-icon">🔥</span>
            <span className="tab-label">进行中</span>
          </button>
          <button
            className={`plan-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span className="tab-icon">📚</span>
            <span className="tab-label">全部计划</span>
          </button>
        </div>

        {/* 计划列表 */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">还没有学习计划</p>
            <p className="empty-hint">点击右上角创建你的第一个计划吧!</p>
            <button className="create-first-btn" onClick={() => setShowCreateDialog(true)}>
              ✨ 创建计划
            </button>
          </div>
        ) : (
          <div className="plans-list">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="plan-card"
                onClick={() => navigate(`/learning-plan/${plan.id}`)}
              >
                {/* 头部 */}
                <div className="plan-card-header">
                  <div className="plan-title-row">
                    <h3 className="plan-title">{plan.title}</h3>
                    {plan.is_ai_generated && (
                      <span className="ai-badge">🤖 AI</span>
                    )}
                  </div>
                  <div
                    className="plan-status-badge"
                    style={{ backgroundColor: getStatusColor(plan.status) }}
                  >
                    {getStatusText(plan.status)}
                  </div>
                </div>

                {/* 描述 */}
                {plan.description && (
                  <p className="plan-description">{plan.description}</p>
                )}

                {/* 学科标签 */}
                <div className="plan-subjects">
                  {plan.target_subjects.map((subject, index) => (
                    <span key={index} className="subject-tag">
                      {subject}
                    </span>
                  ))}
                </div>

                {/* 进度条 */}
                <div className="plan-progress-section">
                  <div className="progress-header">
                    <span className="progress-label">完成度</span>
                    <span className="progress-percentage">{plan.completion_rate}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${plan.completion_rate}%` }}
                    ></div>
                  </div>
                </div>

                {/* 底部信息 */}
                <div className="plan-footer">
                  <div className="plan-info-item">
                    <span className="info-icon">📅</span>
                    <span className="info-text">
                      {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                    </span>
                  </div>
                  <div className="plan-info-item">
                    <span className="info-icon">⏱️</span>
                    <span className="info-text">{plan.daily_learning_time}分钟/天</span>
                  </div>
                  <div className="plan-info-item">
                    <span className="info-icon">💪</span>
                    <span className="info-text">{getDifficultyStars(plan.difficulty_level)}</span>
                  </div>
                  {plan.status === 'active' && (
                    <div className="plan-info-item highlight">
                      <span className="info-icon">⏳</span>
                      <span className="info-text">剩余{calculateDaysRemaining(plan.end_date)}天</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 快捷入口 */}
        <div className="quick-actions">
          <button
            className="quick-action-card"
            onClick={() => navigate('/learning-plan/today-tasks')}
          >
            <div className="action-icon">📝</div>
            <div className="action-label">今日任务</div>
            <div className="action-arrow">→</div>
          </button>
          <button
            className="quick-action-card"
            onClick={() => navigate('/learning-plan/ability')}
          >
            <div className="action-icon">📊</div>
            <div className="action-label">能力评估</div>
            <div className="action-arrow">→</div>
          </button>
        </div>
      </div>

      {/* 创建计划对话框 */}
      {showCreateDialog && (
        <div className="dialog-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">创建学习计划</h3>
            <div className="dialog-options">
              <button
                className="option-card ai-option"
                onClick={() => {
                  setShowCreateDialog(false)
                  navigate('/learning-plan/create-ai')
                }}
              >
                <div className="option-icon">🤖</div>
                <div className="option-info">
                  <div className="option-title">AI智能生成</div>
                  <div className="option-desc">根据你的情况智能规划</div>
                </div>
              </button>
              <button
                className="option-card manual-option"
                onClick={() => {
                  setShowCreateDialog(false)
                  navigate('/learning-plan/create-manual')
                }}
              >
                <div className="option-icon">✏️</div>
                <div className="option-info">
                  <div className="option-title">手动创建</div>
                  <div className="option-desc">自己规划学习内容</div>
                </div>
              </button>
            </div>
            <button className="dialog-close-btn" onClick={() => setShowCreateDialog(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
