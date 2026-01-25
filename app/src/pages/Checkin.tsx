import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { useToast } from '../components/Toast'
import './Checkin.css'

interface CheckinStats {
  totalCheckins: number
  consecutiveDays: number
  maxConsecutiveDays: number
  currentMonthCheckins: number
  todayChecked: boolean
}

interface CheckinHistory {
  date: string
  reward: number
  consecutiveDays: number
}

export default function Checkin() {
  const navigate = useNavigate()
  const toast = useToast()
  const [stats, setStats] = useState<CheckinStats>({
    totalCheckins: 0,
    consecutiveDays: 0,
    maxConsecutiveDays: 0,
    currentMonthCheckins: 0,
    todayChecked: false
  })
  const [history, setHistory] = useState<CheckinHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [rewardPoints, setRewardPoints] = useState(0)
  const [currentMonth, setCurrentMonth] = useState('')
  const [calendarDays, setCalendarDays] = useState<Array<{ day: number, checked: boolean, isToday: boolean }>>([])

  useEffect(() => {
    loadCheckinData()
    generateCalendar()
  }, [])

  const loadCheckinData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      // 获取统计数据
      const statsResponse = await fetch('http://localhost:3000/api/checkin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = await statsResponse.json()

      // 获取今日状态
      const todayResponse = await fetch('http://localhost:3000/api/checkin/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const todayData = await todayResponse.json()

      // 获取本月历史
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      setCurrentMonth(`${year}年${month}月`)

      const historyResponse = await fetch(
        `http://localhost:3000/api/checkin/history?year=${year}&month=${month}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      const historyData = await historyResponse.json()

      if (statsData.success) {
        setStats({
          ...statsData.data,
          todayChecked: todayData.data?.checked || false
        })
      }

      if (historyData.success) {
        setHistory(historyData.data || [])
      }
    } catch (error) {
      console.error('加载签到数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCalendar = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const today = now.getDate()

    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        checked: false, // 会在加载历史后更新
        isToday: i === today
      })
    }

    setCalendarDays(days)
  }

  useEffect(() => {
    // 更新日历中的签到状态
    if (history.length > 0) {
      const checkedDays = new Set(
        history.map(h => new Date(h.date).getDate())
      )

      setCalendarDays(prev => prev.map(day => ({
        ...day,
        checked: checkedDays.has(day.day)
      })))
    }
  }, [history])

  const handleCheckin = async () => {
    if (stats.todayChecked || checking) return

    setChecking(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/checkin/checkin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setRewardPoints(data.data.reward)
        setShowSuccess(true)

        // 重新加载数据
        await loadCheckinData()

        // 3秒后隐藏成功提示
        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)
      } else {
        toast.error(data.message || '签到失败')
      }
    } catch (error) {
      console.error('签到失败:', error)
      toast.error('签到失败，请重试')
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Header
          title="每日签到"
          gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
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
        title="每日签到"
        gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        showBack={true}
      />

      <div className="main-content checkin-container">
        {/* 签到成功动画 */}
        {showSuccess && (
          <div className="checkin-success-modal">
            <div className="success-content">
              <div className="success-icon">🎉</div>
              <div className="success-title">签到成功!</div>
              <div className="success-reward">+{rewardPoints} 积分</div>
              <div className="success-streak">连续签到 {stats.consecutiveDays} 天</div>
            </div>
          </div>
        )}

        {/* 签到卡片 */}
        <div className="checkin-card">
          <div className="checkin-decoration">
            <span className="deco-star">⭐</span>
            <span className="deco-star">✨</span>
            <span className="deco-star">💫</span>
          </div>

          <div className="checkin-main">
            <div className="checkin-icon-big">
              {stats.todayChecked ? '✅' : '📅'}
            </div>
            <div className="checkin-title">
              {stats.todayChecked ? '今日已签到' : '签到领积分'}
            </div>
            <div className="checkin-subtitle">
              {stats.todayChecked
                ? '明天继续加油哦！'
                : '每日签到领取积分奖励'}
            </div>

            <button
              className={`checkin-button ${stats.todayChecked ? 'checked' : ''}`}
              onClick={handleCheckin}
              disabled={stats.todayChecked || checking}
            >
              {checking ? '签到中...' : stats.todayChecked ? '已签到' : '立即签到'}
            </button>
          </div>

          {/* 统计数据 */}
          <div className="checkin-stats-row">
            <div className="stat-item">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{stats.totalCheckins}</div>
              <div className="stat-label">累计签到</div>
            </div>
            <div className="stat-item highlight">
              <div className="stat-icon">🔥</div>
              <div className="stat-value">{stats.consecutiveDays}</div>
              <div className="stat-label">连续天数</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🏆</div>
              <div className="stat-value">{stats.maxConsecutiveDays}</div>
              <div className="stat-label">最高记录</div>
            </div>
          </div>
        </div>

        {/* 签到日历 */}
        <div className="checkin-calendar-section">
          <div className="section-header">
            <span className="section-icon">📅</span>
            <span className="section-title">{currentMonth} 签到记录</span>
            <span className="section-badge">{stats.currentMonthCheckins}天</span>
          </div>

          <div className="calendar-grid">
            <div className="calendar-weekdays">
              <div className="weekday">日</div>
              <div className="weekday">一</div>
              <div className="weekday">二</div>
              <div className="weekday">三</div>
              <div className="weekday">四</div>
              <div className="weekday">五</div>
              <div className="weekday">六</div>
            </div>

            <div className="calendar-days">
              {/* 计算第一天是星期几,添加空白占位 */}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty"></div>
              ))}

              {calendarDays.map(day => (
                <div
                  key={day.day}
                  className={`calendar-day ${day.checked ? 'checked' : ''} ${day.isToday ? 'today' : ''}`}
                >
                  <span className="day-number">{day.day}</span>
                  {day.checked && <span className="check-mark">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="checkin-quick-actions">
          <div
            className="quick-action-card"
            onClick={() => navigate('/habit-tracker')}
          >
            <div className="action-icon">📝</div>
            <div className="action-info">
              <div className="action-title">习惯养成</div>
              <div className="action-desc">培养好习惯</div>
            </div>
            <div className="action-arrow">→</div>
          </div>

          <div
            className="quick-action-card"
            onClick={() => navigate('/checkin-achievements')}
          >
            <div className="action-icon">🏆</div>
            <div className="action-info">
              <div className="action-title">成就徽章</div>
              <div className="action-desc">查看成就</div>
            </div>
            <div className="action-arrow">→</div>
          </div>
        </div>

        {/* 奖励说明 */}
        <div className="reward-rules">
          <div className="rules-title">📖 签到奖励规则</div>
          <div className="rules-list">
            <div className="rule-item">
              <span className="rule-icon">🎁</span>
              <span className="rule-text">每日签到奖励 10 积分</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🔥</span>
              <span className="rule-text">连续签到7天额外奖励 50 积分</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">💎</span>
              <span className="rule-text">连续签到30天额外奖励 200 积分</span>
            </div>
            <div className="rule-item">
              <span className="rule-icon">👑</span>
              <span className="rule-text">连续签到100天额外奖励 500 积分</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
