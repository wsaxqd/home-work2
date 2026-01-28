import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import * as learningPlanApi from '../services/api/learningPlan'
import './TodayTasks.css'

interface Task {
  id: string
  plan_id: string
  task_type: string
  subject?: string
  content_title: string
  scheduled_date: string
  scheduled_time?: string
  estimated_duration: number
  difficulty: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  actual_duration?: number
  score?: number
  accuracy?: number
}

export default function TodayTasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTodayTasks()
  }, [])

  const fetchTodayTasks = async () => {
    setIsLoading(true)
    try {
      const response = await learningPlanApi.getTodayTasks()
      setTasks(response.data || [])
    } catch (error) {
      console.error('获取今日任务失败:', error)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  const completeTask = async (taskId: string) => {
    try {
      await learningPlanApi.completeTask(taskId, {})
      fetchTodayTasks()
    } catch (error) {
      console.error('完成任务失败:', error)
    }
  }

  const getTaskTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      practice: '📝',
      reading: '📖',
      video: '🎬',
      game: '🎮',
      homework: '✏️',
      review: '🔄',
      test: '📊'
    }
    return iconMap[type] || '📌'
  }

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return '#4CAF50'
    if (level <= 3) return '#FFC107'
    return '#F44336'
  }

  const getDifficultyText = (level: number) => {
    if (level <= 2) return '简单'
    if (level <= 3) return '中等'
    return '困难'
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <Layout>
      <Header
        title="今日任务"
        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        showBack={true}
      />

      <div className="main-content">
        {/* 顶部进度卡片 */}
        <div className="today-progress-card">
          <div className="progress-circle-container">
            <svg className="progress-circle" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#f0f0f0"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={`${completionRate * 2.827} 282.7`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4facfe" />
                  <stop offset="100%" stopColor="#00f2fe" />
                </linearGradient>
              </defs>
            </svg>
            <div className="progress-text">
              <div className="progress-percentage">{completionRate}%</div>
              <div className="progress-label">完成度</div>
            </div>
          </div>

          <div className="today-stats">
            <div className="stat-item">
              <div className="stat-label">今日任务</div>
              <div className="stat-value">{totalTasks}</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-label">已完成</div>
              <div className="stat-value">{completedTasks}</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-label">剩余</div>
              <div className="stat-value">{totalTasks - completedTasks}</div>
            </div>
          </div>
        </div>

        {/* 任务列表 */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <p className="empty-text">今天还没有任务</p>
            <p className="empty-hint">去学习计划中添加任务吧!</p>
            <button
              className="goto-plans-btn"
              onClick={() => navigate('/learning-plan')}
            >
              查看学习计划
            </button>
          </div>
        ) : (
          <div className="tasks-list">
            <div className="list-header">
              <h3 className="list-title">任务清单</h3>
              <span className="list-count">{completedTasks}/{totalTasks}</span>
            </div>

            {tasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}
              >
                <div className="task-main">
                  <div className="task-icon-wrapper">
                    <div className="task-icon">{getTaskTypeIcon(task.task_type)}</div>
                  </div>

                  <div className="task-info">
                    <h4 className="task-title">{task.content_title}</h4>
                    <div className="task-meta">
                      {task.subject && (
                        <span className="meta-tag subject-tag">{task.subject}</span>
                      )}
                      <span className="meta-tag time-tag">
                        ⏱️ {task.estimated_duration}分钟
                      </span>
                      <span
                        className="meta-tag difficulty-tag"
                        style={{ color: getDifficultyColor(task.difficulty) }}
                      >
                        💪 {getDifficultyText(task.difficulty)}
                      </span>
                    </div>
                    {task.scheduled_time && (
                      <div className="task-time">
                        🕐 {task.scheduled_time}
                      </div>
                    )}
                  </div>
                </div>

                <div className="task-actions">
                  {task.status === 'completed' ? (
                    <button className="task-btn completed-btn" disabled>
                      <span className="btn-icon">✓</span>
                      <span className="btn-text">已完成</span>
                    </button>
                  ) : (
                    <button
                      className="task-btn start-btn"
                      onClick={() => completeTask(task.id)}
                    >
                      <span className="btn-icon">▶</span>
                      <span className="btn-text">开始</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部提示 */}
        {totalTasks > 0 && completedTasks === totalTasks && (
          <div className="completion-celebration">
            <div className="celebration-icon">🎊</div>
            <div className="celebration-text">太棒了!今天的任务全部完成!</div>
            <div className="celebration-reward">+50 积分</div>
          </div>
        )}
      </div>
    </Layout>
  )
}
