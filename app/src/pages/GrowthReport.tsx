import { useState, useEffect } from 'react'
import parentAPI from '../services/parentAPI'
import { useToast } from '../components/Toast'
import './GrowthReport.css'

interface ChildInfo {
  id: number
  user_id: string
  nickname: string
  age: number
  gender: string
  avatar: string
}

interface ReportData {
  period: string
  totalLearning: number
  totalGaming: number
  totalCreation: number
  favoriteActivity: string
  improvement: number
  achievements: string[]
  suggestions: string[]
}

export default function GrowthReport() {
  const toast = useToast()
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null)
  const [reportType, setReportType] = useState<'week' | 'month'>('week')
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // 加载孩子列表
  useEffect(() => {
    loadChildren()
  }, [])

  // 当选中的孩子或报告类型变化时,加载报告
  useEffect(() => {
    if (selectedChild) {
      loadReport()
    }
  }, [selectedChild, reportType])

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

  const loadReport = async () => {
    if (!selectedChild) return

    try {
      const reportData = await parentAPI.getGrowthReport(
        parseInt(selectedChild.user_id),
        reportType
      )

      if (reportData) {
        setReport(reportData)
      }
    } catch (err: any) {
      console.error('加载成长报告失败:', err)
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedChild) {
      toast.info('请先选择孩子')
      return
    }

    setIsGenerating(true)
    try {
      // 重新加载报告数据
      await loadReport()
      toast.success('报告生成成功!')
    } catch (error: any) {
      toast.error(error.message || '报告生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportPDF = () => {
    toast.info('PDF导出功能开发中...')
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="growth-report">
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
      <div className="growth-report">
        <div className="empty-state">
          <div className="empty-icon">👶</div>
          <h3>还没有绑定孩子账号</h3>
          <p>请先添加孩子账号,才能查看成长报告</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="growth-report">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载报告中...</p>
        </div>
      </div>
    )
  }

  const learningRate = Math.round((report.totalLearning / (report.totalLearning + report.totalGaming)) * 100)
  const avgDaily = Math.round(report.totalLearning / (reportType === 'week' ? 7 : 30))

  return (
    <div className="growth-report">
      {/* 页面头部 */}
      <div className="page-header">
        <div>
          <h2>成长报告</h2>
          <p>{selectedChild.nickname} 的学习成长分析报告</p>
        </div>
        <div className="header-actions">
          <div className="report-type-selector">
            <button
              className={`type-btn ${reportType === 'week' ? 'active' : ''}`}
              onClick={() => setReportType('week')}
            >
              周报告
            </button>
            <button
              className={`type-btn ${reportType === 'month' ? 'active' : ''}`}
              onClick={() => setReportType('month')}
            >
              月报告
            </button>
          </div>
          <button className="export-btn" onClick={handleExportPDF}>
            📥 导出PDF
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

      {/* 报告概览卡片 */}
      <div className="report-overview">
        <div className="child-info-card">
          <div className="child-avatar-large">{selectedChild.avatar}</div>
          <div className="child-details">
            <h3>{selectedChild.nickname}</h3>
            <p className="child-age">{selectedChild.age}岁</p>
            <p className="report-period">{report.period}</p>
          </div>
        </div>

        <div className="stats-summary">
          <div className="summary-item">
            <span className="summary-icon">📚</span>
            <div className="summary-info">
              <span className="summary-label">学习时长</span>
              <span className="summary-value">{report.totalLearning}分钟</span>
            </div>
          </div>
          <div className="summary-item">
            <span className="summary-icon">🎨</span>
            <div className="summary-info">
              <span className="summary-label">创作时长</span>
              <span className="summary-value">{report.totalCreation}分钟</span>
            </div>
          </div>
          <div className="summary-item">
            <span className="summary-icon">🎮</span>
            <div className="summary-info">
              <span className="summary-label">游戏时长</span>
              <span className="summary-value">{report.totalGaming}分钟</span>
            </div>
          </div>
          <div className="summary-item">
            <span className="summary-icon">📊</span>
            <div className="summary-info">
              <span className="summary-label">日均学习</span>
              <span className="summary-value">{avgDaily}分钟</span>
            </div>
          </div>
        </div>
      </div>

      {/* 学习分析 */}
      <div className="report-section">
        <h3 className="section-title">📈 学习分析</h3>
        <div className="analysis-grid">
          <div className="analysis-card">
            <div className="analysis-header">
              <span className="analysis-label">学习占比</span>
              <span className="analysis-value">{learningRate}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${learningRate}%`, background: '#4CAF50' }}
              />
            </div>
            <p className="analysis-desc">
              {learningRate >= 70 ? '学习时间分配合理，保持良好习惯' : '建议增加学习时间，减少游戏时间'}
            </p>
          </div>

          <div className="analysis-card">
            <div className="analysis-header">
              <span className="analysis-label">最喜欢的活动</span>
            </div>
            <div className="favorite-activity">
              <span className="activity-icon">📖</span>
              <span className="activity-name">{report.favoriteActivity}</span>
            </div>
            <p className="analysis-desc">
              孩子对阅读表现出浓厚兴趣，建议继续培养
            </p>
          </div>

          <div className="analysis-card">
            <div className="analysis-header">
              <span className="analysis-label">进步指数</span>
              <span className="analysis-value improvement">+{report.improvement}%</span>
            </div>
            <div className="improvement-chart">
              <div className="chart-arrow">↗️</div>
              <div className="chart-text">较上{reportType === 'week' ? '周' : '月'}提升</div>
            </div>
            <p className="analysis-desc">
              学习表现持续进步，值得鼓励
            </p>
          </div>
        </div>
      </div>

      {/* 成就展示 */}
      <div className="report-section">
        <h3 className="section-title">🏆 本{reportType === 'week' ? '周' : '月'}成就</h3>
        <div className="achievements-list">
          {report.achievements.map((achievement, index) => (
            <div key={index} className="achievement-item">
              <span className="achievement-icon">⭐</span>
              <span className="achievement-text">{achievement}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI智能建议 */}
      <div className="report-section">
        <h3 className="section-title">🤖 AI智能建议</h3>
        <div className="suggestions-list">
          {report.suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              <span className="suggestion-number">{index + 1}</span>
              <span className="suggestion-text">{suggestion}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 生成新报告按钮 */}
      <div className="generate-section">
        <button
          className="generate-btn"
          onClick={handleGenerateReport}
          disabled={isGenerating}
        >
          {isGenerating ? '生成中...' : '🔄 重新生成报告'}
        </button>
      </div>
    </div>
  )
}
