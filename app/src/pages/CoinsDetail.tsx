import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './CoinsDetail.css'

interface CoinRecord {
  id: string
  type: 'earn' | 'spend'
  amount: number
  reason: string
  source: string
  createdAt: string
  icon: string
}

export default function CoinsDetail() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<CoinRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [totalCoins, setTotalCoins] = useState(0)
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalSpent: 0,
    todayEarned: 0
  })

  useEffect(() => {
    fetchCoinsData()
  }, [filter])

  const fetchCoinsData = async () => {
    setIsLoading(true)
    try {
      // 获取积分信息
      const infoResponse = await fetch('http://localhost:3000/api/points/info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // 获取积分记录
      const recordsResponse = await fetch(`http://localhost:3000/api/points/records?filter=${filter === 'all' ? '' : filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (infoResponse.ok && recordsResponse.ok) {
        const infoData = await infoResponse.json()
        const recordsData = await recordsResponse.json()

        const pointsInfo = infoData.data
        const recordsList = recordsData.data || []

        setTotalCoins(pointsInfo?.current_points || 0)
        setRecords(recordsList.map((r: any) => ({
          id: r.id,
          type: r.change_amount > 0 ? 'earn' : 'spend',
          amount: r.change_amount,
          reason: r.reason,
          source: r.source,
          createdAt: new Date(r.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
          icon: getIconForSource(r.source)
        })))

        // 计算统计数据
        const totalEarned = recordsList.filter((r: any) => r.change_amount > 0).reduce((sum: number, r: any) => sum + r.change_amount, 0)
        const totalSpent = Math.abs(recordsList.filter((r: any) => r.change_amount < 0).reduce((sum: number, r: any) => sum + r.change_amount, 0))
        const today = new Date().toISOString().split('T')[0]
        const todayEarned = recordsList.filter((r: any) => r.change_amount > 0 && r.created_at.startsWith(today)).reduce((sum: number, r: any) => sum + r.change_amount, 0)

        setStats({ totalEarned, totalSpent, todayEarned })
      }
    } catch (error) {
      console.error('获取积分记录失败:', error)
      // 使用模拟数据
      setRecords(getMockRecords())
      setTotalCoins(1580)
      setStats({
        totalEarned: 2450,
        totalSpent: 870,
        todayEarned: 50
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getIconForSource = (source: string): string => {
    const iconMap: Record<string, string> = {
      '签到系统': '📅',
      '每日任务': '📋',
      '学习地图': '📚',
      'AI助手': '🤖',
      '积分商城': '🎁',
      '游戏中心': '🎮',
      '阅读中心': '📖',
      'PK系统': '⚔️',
      '成就系统': '🏆'
    }
    return iconMap[source] || '⭐'
  }

  const getMockRecords = (): CoinRecord[] => {
    return [
      { id: '1', type: 'earn', amount: 10, reason: '每日签到奖励', source: '签到系统', createdAt: '2026-01-27 09:00', icon: '📅' },
      { id: '2', type: 'earn', amount: 20, reason: '完成学习任务', source: '学习地图', createdAt: '2026-01-27 10:30', icon: '📚' },
      { id: '3', type: 'earn', amount: 15, reason: 'AI对话互动', source: 'AI助手', createdAt: '2026-01-27 11:15', icon: '🤖' },
      { id: '4', type: 'spend', amount: -30, reason: '兑换道具', source: '道具商城', createdAt: '2026-01-27 12:00', icon: '🎁' },
      { id: '5', type: 'earn', amount: 10, reason: '完成游戏', source: '游戏中心', createdAt: '2026-01-27 14:20', icon: '🎮' },
      { id: '6', type: 'earn', amount: 100, reason: '连续签到7天', source: '签到系统', createdAt: '2026-01-26 09:00', icon: '🔥' },
      { id: '7', type: 'earn', amount: 15, reason: '阅读绘本', source: '阅读中心', createdAt: '2026-01-26 15:30', icon: '📖' },
      { id: '8', type: 'spend', amount: -50, reason: '解锁新章节', source: '学习地图', createdAt: '2026-01-26 16:00', icon: '🔓' },
      { id: '9', type: 'earn', amount: 20, reason: 'PK对战胜利', source: 'PK系统', createdAt: '2026-01-25 10:00', icon: '⚔️' },
      { id: '10', type: 'earn', amount: 50, reason: '成就达成', source: '成就系统', createdAt: '2026-01-25 11:30', icon: '🏆' }
    ]
  }

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true
    return record.type === filter
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天 ' + dateStr.split(' ')[1]
    if (diffDays === 1) return '昨天 ' + dateStr.split(' ')[1]
    return dateStr
  }

  return (
    <Layout>
      <Header
        title="积分明细"
        gradient="linear-gradient(135deg, #fdcb6e 0%, #f39c12 100%)"
        showBack={true}
      />
      <div className="main-content">
        {/* 积分概览卡片 */}
        <div className="coins-overview-card">
          <div className="overview-main">
            <div className="overview-icon">⭐</div>
            <div className="overview-info">
              <div className="overview-label">当前积分</div>
              <div className="overview-value">{totalCoins}</div>
            </div>
          </div>
          <div className="overview-stats">
            <div className="stat-item">
              <div className="stat-label">累计获得</div>
              <div className="stat-value earn">+{stats.totalEarned}</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-label">累计消费</div>
              <div className="stat-value spend">{stats.totalSpent}</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-label">今日获得</div>
              <div className="stat-value today">+{stats.todayEarned}</div>
            </div>
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="tab-icon">📊</span>
            <span>全部记录</span>
          </button>
          <button
            className={`filter-tab ${filter === 'earn' ? 'active' : ''}`}
            onClick={() => setFilter('earn')}
          >
            <span className="tab-icon">📈</span>
            <span>收入</span>
          </button>
          <button
            className={`filter-tab ${filter === 'spend' ? 'active' : ''}`}
            onClick={() => setFilter('spend')}
          >
            <span className="tab-icon">📉</span>
            <span>支出</span>
          </button>
        </div>

        {/* 记录列表 */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">暂无记录</p>
          </div>
        ) : (
          <div className="records-list">
            {filteredRecords.map((record) => (
              <div key={record.id} className={`record-item ${record.type}`}>
                <div className="record-icon">{record.icon}</div>
                <div className="record-content">
                  <div className="record-header">
                    <div className="record-reason">{record.reason}</div>
                    <div className={`record-amount ${record.type}`}>
                      {record.type === 'earn' ? '+' : ''}{record.amount}
                    </div>
                  </div>
                  <div className="record-footer">
                    <div className="record-source">{record.source}</div>
                    <div className="record-time">{formatDate(record.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 赚取积分提示 */}
        <div className="earn-tips-card">
          <div className="tips-header">
            <span className="tips-icon">💡</span>
            <span className="tips-title">赚取积分小贴士</span>
          </div>
          <div className="tips-list">
            <div className="tip-item">
              <span className="tip-dot">•</span>
              <span>每日签到可获得10积分</span>
            </div>
            <div className="tip-item">
              <span className="tip-dot">•</span>
              <span>完成学习任务最高可获得50积分</span>
            </div>
            <div className="tip-item">
              <span className="tip-dot">•</span>
              <span>达成成就可获得丰厚奖励</span>
            </div>
            <div className="tip-item">
              <span className="tip-dot">•</span>
              <span>参与PK对战获胜可得积分</span>
            </div>
          </div>
          <button className="goto-tasks-btn" onClick={() => navigate('/daily-tasks')}>
            去做任务 →
          </button>
        </div>
      </div>
    </Layout>
  )
}
