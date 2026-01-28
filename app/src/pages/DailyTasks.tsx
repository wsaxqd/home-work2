import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './DailyTasks.css'

interface Task {
  id: string
  name: string
  description: string
  reward_points: number
  progress: number
  target: number
  is_completed: boolean
  type: string
  icon: string
  completion_rate: number
}

interface TaskStats {
  total_tasks: number
  completed_tasks: number
  points_earned_today: number
  completion_rate: string
  streak: number
}

export default function DailyTasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [activeTab, setActiveTab] = useState<'daily' | 'achievement'>('daily')
  const [isLoading, setIsLoading] = useState(true)
  const [totalCoins, setTotalCoins] = useState(0)

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyTasks()
    } else {
      fetchAchievements()
    }
    fetchUserCoins()
  }, [activeTab])

  const fetchDailyTasks = async () => {
    setIsLoading(true)
    try {
      const [tasksResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:3000/api/rewards/daily-tasks', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('http://localhost:3000/api/rewards/daily-tasks/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ])

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        setTasks(tasksData.data || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('获取每日任务失败:', error)
      // 使用模拟数据
      setTasks(getMockDailyTasks())
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAchievements = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/rewards/achievements/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const achievements = data.data || []
        setTasks(achievements.map((a: any) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          reward_points: a.reward_points,
          progress: a.progress || 0,
          target: a.condition?.target || 0,
          is_completed: a.is_completed || false,
          type: a.type,
          icon: a.icon,
          completion_rate: a.condition?.target > 0 ? ((a.progress || 0) / a.condition.target * 100) : 0
        })))
      }
    } catch (error) {
      console.error('获取成就失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3000/api/tasks?type=${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(data.data || [])
      }
    } catch (error) {
      console.error('获取任务失败:', error)
      // 使用模拟数据
      setTasks(getMockTasks(activeTab))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserCoins = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/points/info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTotalCoins(data.data?.current_points || 0)
      }
    } catch (error) {
      console.error('获取积分失败:', error)
    }
  }

  const getMockDailyTasks = (): Task[] => {
    return [
      { id: '1', name: '每日签到', description: '完成今日签到', reward_points: 10, progress: 0, target: 1, is_completed: false, type: 'checkin', icon: '📅', completion_rate: 0 },
      { id: '2', name: '完成1个学习任务', description: '在学习地图中完成任意关卡', reward_points: 20, progress: 0, target: 1, is_completed: false, type: 'learning', icon: '📚', completion_rate: 0 },
      { id: '3', name: 'AI对话3次', description: '与AI助手进行3次对话', reward_points: 15, progress: 0, target: 3, is_completed: false, type: 'ai_chat', icon: '🤖', completion_rate: 0 },
      { id: '4', name: '完成1局游戏', description: '玩任意游戏并完成', reward_points: 10, progress: 0, target: 1, is_completed: false, type: 'game', icon: '🎮', completion_rate: 0 },
      { id: '5', name: '阅读1篇绘本', description: '完整阅读一本绘本', reward_points: 15, progress: 0, target: 1, is_completed: false, type: 'reading', icon: '📖', completion_rate: 0 }
    ]
  }

  const getMockTasks = (type: string): Task[] => {
    const dailyTasks = [
      { id: '1', name: '每日签到', description: '完成今日签到', reward_points: 10, progress: 0, target: 1, is_completed: false, type: 'checkin', icon: '📅', completion_rate: 0 },
      { id: '2', name: '完成1个学习任务', description: '在学习地图中完成任意关卡', reward_points: 20, progress: 0, target: 1, is_completed: false, type: 'learning', icon: '📚', completion_rate: 0 },
      { id: '3', name: 'AI对话3次', description: '与AI助手进行3次对话', reward_points: 15, progress: 0, target: 3, is_completed: false, type: 'ai_chat', icon: '🤖', completion_rate: 0 },
      { id: '4', name: '完成1局游戏', description: '玩任意游戏并完成', reward_points: 10, progress: 0, target: 1, is_completed: false, type: 'game', icon: '🎮', completion_rate: 0 },
      { id: '5', name: '阅读1篇绘本', description: '完整阅读一本绘本', reward_points: 15, progress: 0, target: 1, is_completed: false, type: 'reading', icon: '📖', completion_rate: 0 }
    ]

    const achievements = [
      { id: 'a1', name: '初出茅庐', description: '完成第一个学习任务', reward_points: 50, progress: 1, target: 1, is_completed: true, type: 'learning_count', icon: '🏆', completion_rate: 100 },
      { id: 'a2', name: '学习达人', description: '累计完成100个学习任务', reward_points: 500, progress: 45, target: 100, is_completed: false, type: 'learning_count', icon: '⭐', completion_rate: 45 },
      { id: 'a3', name: '阅读之星', description: '累计阅读50本绘本', reward_points: 300, progress: 18, target: 50, is_completed: false, type: 'reading_count', icon: '📚', completion_rate: 36 },
      { id: 'a4', name: '创作大师', description: '累计创作30件作品', reward_points: 400, progress: 12, target: 30, is_completed: false, type: 'creation_count', icon: '🎨', completion_rate: 40 }
    ]

    return type === 'daily' ? dailyTasks : achievements
  }

  const claimReward = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/tasks/${taskId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        fetchTasks()
        fetchUserCoins()
      }
    } catch (error) {
      console.error('领取奖励失败:', error)
    }
  }

  const completedTasks = tasks.filter(task => task.is_completed).length
  const totalTasks = tasks.length

  return (
    <Layout>
      <Header
        title="任务中心"
        gradient="linear-gradient(135deg, #fdcb6e 0%, #f39c12 100%)"
        showBack={true}
      />
      <div className="main-content">
        {/* 积分展示 */}
        <div className="coins-banner">
          <div className="coins-icon">⭐</div>
          <div className="coins-info">
            <div className="coins-label">我的积分</div>
            <div className="coins-value">{totalCoins}</div>
          </div>
          <button className="coins-detail-btn" onClick={() => navigate('/shop-mall')}>
            积分商城 →
          </button>
        </div>

        {/* 任务统计卡片 (仅每日任务显示) */}
        {activeTab === 'daily' && stats && (
          <div className="task-stats-card">
            <div className="stat-item">
              <div className="stat-value">{stats.completed_tasks}/{stats.total_tasks}</div>
              <div className="stat-label">今日完成</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">+{stats.points_earned_today}</div>
              <div className="stat-label">今日获得</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">{stats.streak}天</div>
              <div className="stat-label">连续完成</div>
            </div>
          </div>
        )}

        {/* 标签页切换 */}
        <div className="task-tabs">
          <button
            className={`task-tab ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            <span className="tab-icon">📅</span>
            <span className="tab-label">每日任务</span>
            {activeTab === 'daily' && (
              <span className="tab-count">{completedTasks}/{totalTasks}</span>
            )}
          </button>
          <button
            className={`task-tab ${activeTab === 'achievement' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievement')}
          >
            <span className="tab-icon">🏆</span>
            <span className="tab-label">成就系统</span>
            {activeTab === 'achievement' && (
              <span className="tab-count">{completedTasks}/{totalTasks}</span>
            )}
          </button>
        </div>

        {/* 任务列表 */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">暂无任务</p>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map((task) => (
              <div key={task.id} className={`task-card ${task.is_completed ? 'completed' : ''}`}>
                <div className="task-icon">{task.icon}</div>
                <div className="task-content">
                  <div className="task-header">
                    <h3 className="task-title">{task.name}</h3>
                    <div className="task-reward">
                      <span className="reward-icon">⭐</span>
                      <span className="reward-value">+{task.reward_points}</span>
                    </div>
                  </div>
                  <p className="task-description">{task.description}</p>
                  <div className="task-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${task.completion_rate}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {task.progress}/{task.target}
                    </div>
                  </div>
                </div>
                {task.is_completed ? (
                  <button className="task-btn completed-btn">
                    <span>✓</span>
                    <span>已完成</span>
                  </button>
                ) : task.progress >= task.target ? (
                  <button
                    className="task-btn claim-btn"
                    onClick={() => claimReward(task.id)}
                  >
                    <span>🎁</span>
                    <span>领取</span>
                  </button>
                ) : (
                  <button className="task-btn goto-btn" disabled>
                    <span>进行中</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
