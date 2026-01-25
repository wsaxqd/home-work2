import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { useToast } from '../components/Toast'
import './HabitTracker.css'

interface Habit {
  id: string
  habitType: string
  customName?: string
  targetValue: number
  unit: string
  frequency: string
  reminderTime?: string
  color: string
  icon: string
  consecutiveDays: number
  totalCheckins: number
  completionRate: number
  createdAt: string
}

interface HabitCheckin {
  id: string
  habitId: string
  completedValue: number
  mood: string
  note?: string
  checkinDate: string
}

const HABIT_TEMPLATES = [
  { type: 'reading', name: '阅读学习', icon: '📚', color: '#4facfe', unit: '分钟', defaultTarget: 30 },
  { type: 'exercise', name: '运动锻炼', icon: '🏃', color: '#28c76f', unit: '分钟', defaultTarget: 30 },
  { type: 'water', name: '喝水', icon: '💧', color: '#00cfe8', unit: '杯', defaultTarget: 8 },
  { type: 'sleep', name: '早睡早起', icon: '😴', color: '#7367f0', unit: '小时', defaultTarget: 8 },
  { type: 'homework', name: '完成作业', icon: '✏️', color: '#ff9f43', unit: '科目', defaultTarget: 3 },
  { type: 'practice', name: '乐器练习', icon: '🎹', color: '#ea5455', unit: '分钟', defaultTarget: 30 },
  { type: 'custom', name: '自定义', icon: '⭐', color: '#667eea', unit: '次', defaultTarget: 1 },
]

const MOOD_OPTIONS = [
  { value: 'great', label: '超棒', icon: '😄' },
  { value: 'good', label: '不错', icon: '🙂' },
  { value: 'normal', label: '一般', icon: '😐' },
  { value: 'tired', label: '累了', icon: '😫' },
]

export default function HabitTracker() {
  const navigate = useNavigate()
  const toast = useToast()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)

  // 创建习惯表单
  const [createForm, setCreateForm] = useState({
    habitType: 'reading',
    customName: '',
    targetValue: 30,
    unit: '分钟',
    frequency: 'daily',
    reminderTime: '09:00',
    color: '#4facfe',
    icon: '📚'
  })

  // 打卡表单
  const [checkinForm, setCheckinForm] = useState({
    completedValue: 0,
    mood: 'good',
    note: ''
  })

  useEffect(() => {
    loadHabits()
  }, [])

  const loadHabits = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/checkin/habits', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setHabits(data.data || [])
      }
    } catch (error) {
      console.error('加载习惯列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: typeof HABIT_TEMPLATES[0]) => {
    setCreateForm({
      habitType: template.type,
      customName: template.type === 'custom' ? '' : template.name,
      targetValue: template.defaultTarget,
      unit: template.unit,
      frequency: 'daily',
      reminderTime: '09:00',
      color: template.color,
      icon: template.icon
    })
  }

  const handleCreateHabit = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/checkin/habits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      })

      const data = await response.json()
      if (data.success) {
        setShowCreateModal(false)
        await loadHabits()
        // 重置表单
        setCreateForm({
          habitType: 'reading',
          customName: '',
          targetValue: 30,
          unit: '分钟',
          frequency: 'daily',
          reminderTime: '09:00',
          color: '#4facfe',
          icon: '📚'
        })
      } else {
        toast.error(data.message || '创建失败')
      }
    } catch (error) {
      console.error('创建习惯失败:', error)
      toast.error('创建失败，请重试')
    }
  }

  const handleCheckin = async () => {
    if (!selectedHabit) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:3000/api/checkin/habits/${selectedHabit.id}/checkin`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(checkinForm)
        }
      )

      const data = await response.json()
      if (data.success) {
        setShowCheckinModal(false)
        setSelectedHabit(null)
        await loadHabits()
        // 重置表单
        setCheckinForm({
          completedValue: 0,
          mood: 'good',
          note: ''
        })
      } else {
        toast.error(data.message || '打卡失败')
      }
    } catch (error) {
      console.error('打卡失败:', error)
      toast.error('打卡失败，请重试')
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('确定要删除这个习惯吗？')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:3000/api/checkin/habits/${habitId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      const data = await response.json()
      if (data.success) {
        await loadHabits()
      }
    } catch (error) {
      console.error('删除习惯失败:', error)
    }
  }

  const openCheckinModal = (habit: Habit) => {
    setSelectedHabit(habit)
    setCheckinForm({
      completedValue: habit.targetValue,
      mood: 'good',
      note: ''
    })
    setShowCheckinModal(true)
  }

  if (loading) {
    return (
      <Layout>
        <Header
          title="习惯养成"
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
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
        title="习惯养成"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        showBack={true}
      />

      <div className="main-content habit-container">
        {/* 统计卡片 */}
        <div className="habit-stats-card">
          <div className="stats-item">
            <div className="stats-value">{habits.length}</div>
            <div className="stats-label">进行中</div>
          </div>
          <div className="stats-item">
            <div className="stats-value">
              {habits.reduce((sum, h) => sum + h.totalCheckins, 0)}
            </div>
            <div className="stats-label">总打卡</div>
          </div>
          <div className="stats-item">
            <div className="stats-value">
              {habits.length > 0
                ? Math.round(
                    habits.reduce((sum, h) => sum + h.completionRate, 0) / habits.length
                  )
                : 0}
              %
            </div>
            <div className="stats-label">完成率</div>
          </div>
        </div>

        {/* 习惯列表 */}
        {habits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">还没有习惯哦</div>
            <div className="empty-desc">点击下方按钮创建你的第一个习惯吧！</div>
          </div>
        ) : (
          <div className="habits-list">
            {habits.map(habit => (
              <div
                key={habit.id}
                className="habit-card"
                style={{ borderLeft: `4px solid ${habit.color}` }}
              >
                <div className="habit-header">
                  <div className="habit-icon">{habit.icon}</div>
                  <div className="habit-info">
                    <div className="habit-name">
                      {habit.customName || habit.habitType}
                    </div>
                    <div className="habit-target">
                      目标: {habit.targetValue} {habit.unit} / 天
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteHabit(habit.id)}
                  >
                    🗑️
                  </button>
                </div>

                <div className="habit-stats-row">
                  <div className="mini-stat">
                    <span className="mini-stat-icon">🔥</span>
                    <span className="mini-stat-text">连续{habit.consecutiveDays}天</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-icon">✓</span>
                    <span className="mini-stat-text">共{habit.totalCheckins}次</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-stat-icon">📈</span>
                    <span className="mini-stat-text">{habit.completionRate}%</span>
                  </div>
                </div>

                <button
                  className="checkin-action-btn"
                  style={{ background: habit.color }}
                  onClick={() => openCheckinModal(habit)}
                >
                  今日打卡
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 创建按钮 */}
        <button className="fab-button" onClick={() => setShowCreateModal(true)}>
          <span className="fab-icon">+</span>
        </button>

        {/* 创建习惯模态框 */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>创建新习惯</h3>
                <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>选择习惯类型</label>
                  <div className="template-grid">
                    {HABIT_TEMPLATES.map(template => (
                      <div
                        key={template.type}
                        className={`template-item ${
                          createForm.habitType === template.type ? 'active' : ''
                        }`}
                        style={{
                          borderColor:
                            createForm.habitType === template.type
                              ? template.color
                              : '#e0e0e0'
                        }}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="template-icon">{template.icon}</div>
                        <div className="template-name">{template.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {createForm.habitType === 'custom' && (
                  <div className="form-group">
                    <label>习惯名称</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="输入自定义习惯名称"
                      value={createForm.customName}
                      onChange={e =>
                        setCreateForm({ ...createForm, customName: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>目标值</label>
                    <input
                      type="number"
                      className="form-input"
                      value={createForm.targetValue}
                      onChange={e =>
                        setCreateForm({
                          ...createForm,
                          targetValue: Number(e.target.value)
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>单位</label>
                    <input
                      type="text"
                      className="form-input"
                      value={createForm.unit}
                      onChange={e =>
                        setCreateForm({ ...createForm, unit: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>提醒时间</label>
                  <input
                    type="time"
                    className="form-input"
                    value={createForm.reminderTime}
                    onChange={e =>
                      setCreateForm({ ...createForm, reminderTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleCreateHabit}>
                  创建习惯
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 打卡模态框 */}
        {showCheckinModal && selectedHabit && (
          <div className="modal-overlay" onClick={() => setShowCheckinModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {selectedHabit.icon} {selectedHabit.customName || selectedHabit.habitType}
                </h3>
                <button className="close-btn" onClick={() => setShowCheckinModal(false)}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>完成量</label>
                  <input
                    type="number"
                    className="form-input"
                    value={checkinForm.completedValue}
                    onChange={e =>
                      setCheckinForm({
                        ...checkinForm,
                        completedValue: Number(e.target.value)
                      })
                    }
                  />
                  <div className="input-hint">
                    目标: {selectedHabit.targetValue} {selectedHabit.unit}
                  </div>
                </div>

                <div className="form-group">
                  <label>今天的心情</label>
                  <div className="mood-selector">
                    {MOOD_OPTIONS.map(mood => (
                      <div
                        key={mood.value}
                        className={`mood-item ${
                          checkinForm.mood === mood.value ? 'active' : ''
                        }`}
                        onClick={() =>
                          setCheckinForm({ ...checkinForm, mood: mood.value })
                        }
                      >
                        <div className="mood-icon">{mood.icon}</div>
                        <div className="mood-label">{mood.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>今日小结 (可选)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="记录一下今天的感受..."
                    value={checkinForm.note}
                    onChange={e =>
                      setCheckinForm({ ...checkinForm, note: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCheckinModal(false)}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: selectedHabit.color }}
                  onClick={handleCheckin}
                >
                  完成打卡
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
