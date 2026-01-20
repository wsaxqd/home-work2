import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './WrongQuestionBook.css'

interface WrongQuestion {
  id: number
  subject: string
  grade_level: string
  question_text: string
  question_image: string
  correct_answer: string
  user_answer: string
  error_type: string
  knowledge_points: string[]
  difficulty_level: string
  mistake_count: number
  is_mastered: boolean
  next_review_at: string
  created_at: string
}

interface WeaknessPoint {
  subject: string
  knowledge_point: string
  wrong_count: number
  total_count: number
  error_rate: number
}

export default function WrongQuestionBook() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<WrongQuestion[]>([])
  const [weakness, setWeakness] = useState<WeaknessPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [showMastered, setShowMastered] = useState(false)
  const [activeTab, setActiveTab] = useState<'questions' | 'weakness' | 'review'>('questions')

  const subjects = [
    { id: 'all', name: '全部', icon: '📚' },
    { id: 'math', name: '数学', icon: '🔢' },
    { id: 'chinese', name: '语文', icon: '📖' },
    { id: 'english', name: '英语', icon: '🔤' },
    { id: 'science', name: '科学', icon: '🔬' },
  ]

  useEffect(() => {
    loadData()
  }, [selectedSubject, showMastered, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      if (activeTab === 'questions') {
        const params = new URLSearchParams({
          ...(selectedSubject !== 'all' && { subject: selectedSubject }),
          masteredFilter: showMastered ? 'false' : 'true'
        })

        const response = await fetch(`http://localhost:3000/api/wrong-questions?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.success) {
          setQuestions(data.data.questions)
        }
      } else if (activeTab === 'weakness') {
        const params = new URLSearchParams({
          ...(selectedSubject !== 'all' && { subject: selectedSubject })
        })

        const response = await fetch(`http://localhost:3000/api/wrong-questions/weakness-analysis?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.success) {
          setWeakness(data.data)
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsMastered = async (questionId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/wrong-questions/${questionId}/master`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        loadData()
      }
    } catch (error) {
      console.error('标记失败:', error)
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return '#28c76f'
      case 'medium': return '#ff9f43'
      case 'hard': return '#ea5455'
      default: return '#667eea'
    }
  }

  return (
    <Layout>
      <Header
        title="我的错题本"
        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
      />

      <div className="wrong-question-container">
        {/* 标签页 */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            📝 错题集
          </button>
          <button
            className={`tab ${activeTab === 'weakness' ? 'active' : ''}`}
            onClick={() => setActiveTab('weakness')}
          >
            📊 薄弱分析
          </button>
          <button
            className={`tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            🔄 今日复习
          </button>
        </div>

        {/* 筛选器 */}
        <div className="filters">
          <div className="subject-filter">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                className={`filter-btn ${selectedSubject === subject.id ? 'active' : ''}`}
                onClick={() => setSelectedSubject(subject.id)}
              >
                <span className="filter-icon">{subject.icon}</span>
                <span className="filter-name">{subject.name}</span>
              </button>
            ))}
          </div>

          {activeTab === 'questions' && (
            <div className="mastered-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showMastered}
                  onChange={(e) => setShowMastered(e.target.checked)}
                />
                显示已掌握
              </label>
            </div>
          )}
        </div>

        {/* 内容区 */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        ) : activeTab === 'questions' ? (
          <div className="questions-list">
            {questions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <h3>暂无错题</h3>
                <p>继续加油，保持优秀！</p>
              </div>
            ) : (
              questions.map((question) => (
                <div key={question.id} className="question-card">
                  <div className="question-header">
                    <div className="question-meta">
                      <span className="subject-badge">{question.subject}</span>
                      <span
                        className="difficulty-badge"
                        style={{ background: getDifficultyColor(question.difficulty_level) }}
                      >
                        {question.difficulty_level}
                      </span>
                      {question.is_mastered && (
                        <span className="mastered-badge">✓ 已掌握</span>
                      )}
                    </div>
                    <div className="mistake-count">错误×{question.mistake_count}</div>
                  </div>

                  {question.question_image && (
                    <div className="question-image">
                      <img src={question.question_image} alt="题目" />
                    </div>
                  )}

                  <div className="question-content">
                    <div className="question-text">{question.question_text}</div>
                  </div>

                  <div className="question-answers">
                    <div className="answer-row wrong">
                      <span className="answer-label">我的答案:</span>
                      <span className="answer-value">{question.user_answer}</span>
                    </div>
                    <div className="answer-row correct">
                      <span className="answer-label">正确答案:</span>
                      <span className="answer-value">{question.correct_answer}</span>
                    </div>
                  </div>

                  {question.knowledge_points && question.knowledge_points.length > 0 && (
                    <div className="knowledge-points">
                      <span className="kp-label">知识点:</span>
                      {question.knowledge_points.map((kp, idx) => (
                        <span key={idx} className="kp-tag">{kp}</span>
                      ))}
                    </div>
                  )}

                  <div className="question-actions">
                    <button
                      className="action-btn review-btn"
                      onClick={() => navigate(`/homework/answer/${question.id}?mode=review`)}
                    >
                      📖 查看讲解
                    </button>
                    {!question.is_mastered && (
                      <button
                        className="action-btn master-btn"
                        onClick={() => markAsMastered(question.id)}
                      >
                        ✓ 标记掌握
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'weakness' ? (
          <div className="weakness-analysis">
            {weakness.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💪</div>
                <h3>暂无薄弱点</h3>
                <p>你很棒哦！</p>
              </div>
            ) : (
              <div className="weakness-list">
                {weakness.map((item, idx) => (
                  <div key={idx} className="weakness-card">
                    <div className="weakness-rank">#{idx + 1}</div>
                    <div className="weakness-info">
                      <div className="weakness-title">{item.knowledge_point}</div>
                      <div className="weakness-subject">{item.subject}</div>
                    </div>
                    <div className="weakness-stats">
                      <div className="stat-item">
                        <span className="stat-label">错误率</span>
                        <span className="stat-value error">{item.error_rate.toFixed(1)}%</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">错题数</span>
                        <span className="stat-value">{item.wrong_count}/{item.total_count}</span>
                      </div>
                    </div>
                    <button
                      className="practice-btn"
                      onClick={() => navigate(`/practice/${item.subject}/${item.knowledge_point}`)}
                    >
                      强化练习
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
