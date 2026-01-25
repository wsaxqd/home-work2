import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import { useToast } from '../components/Toast'
import './LevelDetail.css'

interface Question {
  id: number
  question_text: string
  question_type: string
  options?: string[]
  correct_answer: string
  explanation: string
  points: number
}

interface LevelData {
  id: number
  stage_number: number
  stage_name: string
  stage_type: string
  description: string
  difficulty_stars: number
  estimated_time: number
  learning_points: string[]
  questions: Question[]
  user_best_score?: number
  user_stars?: number
}

export default function LevelDetail() {
  const toast = useToast()
  const navigate = useNavigate()
  const { stageId } = useParams<{ stageId: string }>()
  const [level, setLevel] = useState<LevelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isStarted, setIsStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [earnedStars, setEarnedStars] = useState(0)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  useEffect(() => {
    loadLevel()
    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.end()
      }
    }
  }, [stageId])

  const loadLevel = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/learning-path/stages/${stageId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setLevel(data.data)
      }
    } catch (error) {
      console.error('加载关卡失败:', error)
      toast.error('加载关卡失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleStartLevel = () => {
    setIsStarted(true)
    usageTrackerRef.current = new UsageTracker('学习', `关卡-${level?.stage_name}`, {
      stageId: level?.id,
      stageName: level?.stage_name,
      difficulty: level?.difficulty_stars
    })
    usageTrackerRef.current.start()
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNextQuestion = () => {
    if (!level || !selectedAnswer) {
      toast.info('请选择答案')
      return
    }

    // 保存答案
    const newAnswers = { ...answers, [currentQuestionIndex]: selectedAnswer }
    setAnswers(newAnswers)

    // 检查是否是最后一题
    if (currentQuestionIndex < level.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(newAnswers[currentQuestionIndex + 1] || '')
    } else {
      // 完成关卡，计算得分
      calculateScore(newAnswers)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setSelectedAnswer(answers[currentQuestionIndex - 1] || '')
    }
  }

  const calculateScore = async (finalAnswers: { [key: number]: string }) => {
    if (!level) return

    let correctCount = 0
    let totalPoints = 0

    level.questions.forEach((question, index) => {
      if (finalAnswers[index] === question.correct_answer) {
        correctCount++
        totalPoints += question.points
      }
    })

    const percentage = (correctCount / level.questions.length) * 100
    let stars = 0
    if (percentage >= 90) stars = 3
    else if (percentage >= 70) stars = 2
    else if (percentage >= 60) stars = 1

    setScore(totalPoints)
    setEarnedStars(stars)
    setShowResult(true)

    // 提交成绩
    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:3000/api/learning-path/stages/${stageId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: totalPoints,
          stars: stars,
          answers: finalAnswers,
          completed_at: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('提交成绩失败:', error)
    }

    // 记录学习数据
    if (usageTrackerRef.current) {
      usageTrackerRef.current.end(undefined, {
        score: totalPoints,
        stars: stars,
        correctCount: correctCount,
        totalQuestions: level.questions.length,
        completed: true
      })
      usageTrackerRef.current = null
    }
  }

  const handleRetry = () => {
    setIsStarted(false)
    setCurrentQuestionIndex(0)
    setSelectedAnswer('')
    setAnswers({})
    setShowResult(false)
    setScore(0)
    setEarnedStars(0)
  }

  const handleBackToMap = () => {
    navigate('/learning-map')
  }

  if (loading) {
    return (
      <Layout>
        <Header title="加载中..." gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" onBack={handleBackToMap} />
        <div className="main-content">
          <div className="loading-spinner">加载中...</div>
        </div>
      </Layout>
    )
  }

  if (!level) {
    return (
      <Layout>
        <Header title="关卡未找到" gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" onBack={handleBackToMap} />
        <div className="main-content">
          <div className="error-message">关卡不存在或已被删除</div>
        </div>
      </Layout>
    )
  }

  const currentQuestion = level.questions[currentQuestionIndex]

  return (
    <Layout>
      <Header
        title={level.stage_name}
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        onBack={handleBackToMap}
      />

      <div className="main-content level-detail-container">
        {!isStarted ? (
          /* 关卡介绍 */
          <div className="level-intro">
            <div className="level-info-card">
              <div className="level-icon">
                {level.stage_type === 'lesson' && '📖'}
                {level.stage_type === 'quiz' && '📝'}
                {level.stage_type === 'practice' && '✍️'}
                {level.stage_type === 'challenge' && '🎯'}
                {level.stage_type === 'boss' && '👑'}
              </div>
              <h2>第{level.stage_number}关</h2>
              <h3>{level.stage_name}</h3>
              <div className="level-difficulty">
                {'⭐'.repeat(level.difficulty_stars)}
              </div>
              <p className="level-description">{level.description}</p>

              <div className="level-meta">
                <div className="meta-item">
                  <span className="meta-icon">⏱️</span>
                  <span>预计时间: {level.estimated_time}分钟</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📝</span>
                  <span>题目数量: {level.questions.length}题</span>
                </div>
                {level.user_best_score !== undefined && (
                  <div className="meta-item">
                    <span className="meta-icon">🏆</span>
                    <span>最高分: {level.user_best_score}</span>
                  </div>
                )}
              </div>

              <div className="learning-points">
                <h4>学习要点</h4>
                <ul>
                  {level.learning_points?.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>

              <button className="btn-start" onClick={handleStartLevel}>
                开始闯关 →
              </button>
            </div>
          </div>
        ) : showResult ? (
          /* 结果页面 */
          <div className="result-container">
            <div className="result-card">
              <div className="result-icon">
                {earnedStars >= 3 ? '🎉' : earnedStars >= 2 ? '👍' : earnedStars >= 1 ? '💪' : '😢'}
              </div>
              <h2>
                {earnedStars >= 3 ? '完美通关！' : earnedStars >= 2 ? '干得好！' : earnedStars >= 1 ? '继续努力！' : '再试一次吧！'}
              </h2>
              <div className="result-stars">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <span key={idx} className={idx < earnedStars ? 'star-filled' : 'star-empty'}>
                    ⭐
                  </span>
                ))}
              </div>
              <div className="result-score">
                <div className="score-item">
                  <span className="score-label">得分</span>
                  <span className="score-value">{score}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">正确率</span>
                  <span className="score-value">
                    {Math.round((Object.values(answers).filter((ans, idx) => ans === level.questions[idx].correct_answer).length / level.questions.length) * 100)}%
                  </span>
                </div>
              </div>

              <div className="result-actions">
                <button className="btn-secondary" onClick={handleRetry}>
                  重新挑战
                </button>
                <button className="btn-primary" onClick={handleBackToMap}>
                  返回地图
                </button>
              </div>
            </div>

            {/* 题目解析 */}
            <div className="question-review">
              <h3>题目解析</h3>
              {level.questions.map((question, idx) => (
                <div key={idx} className={`review-item ${answers[idx] === question.correct_answer ? 'correct' : 'wrong'}`}>
                  <div className="review-header">
                    <span className="review-num">第{idx + 1}题</span>
                    <span className={`review-status ${answers[idx] === question.correct_answer ? 'status-correct' : 'status-wrong'}`}>
                      {answers[idx] === question.correct_answer ? '✓ 正确' : '✗ 错误'}
                    </span>
                  </div>
                  <div className="review-question">{question.question_text}</div>
                  <div className="review-answer">
                    <span className="answer-label">你的答案:</span>
                    <span className={answers[idx] === question.correct_answer ? 'answer-correct' : 'answer-wrong'}>
                      {answers[idx]}
                    </span>
                  </div>
                  {answers[idx] !== question.correct_answer && (
                    <div className="review-correct">
                      <span className="answer-label">正确答案:</span>
                      <span className="answer-correct">{question.correct_answer}</span>
                    </div>
                  )}
                  <div className="review-explanation">
                    <strong>解析：</strong>{question.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 答题界面 */
          <div className="question-container">
            <div className="question-progress">
              <div className="progress-text">
                第 {currentQuestionIndex + 1} / {level.questions.length} 题
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${((currentQuestionIndex + 1) / level.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="question-card">
              <div className="question-header">
                <span className="question-type">{currentQuestion.question_type}</span>
                <span className="question-points">+{currentQuestion.points}分</span>
              </div>
              <div className="question-text">{currentQuestion.question_text}</div>

              <div className="options-list">
                {currentQuestion.options?.map((option, idx) => (
                  <div
                    key={idx}
                    className={`option-item ${selectedAnswer === option ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(option)}
                  >
                    <div className="option-radio">
                      {selectedAnswer === option ? '◉' : '◯'}
                    </div>
                    <div className="option-text">{option}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="question-actions">
              <button
                className="btn-nav prev"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                ← 上一题
              </button>
              <button
                className="btn-nav next"
                onClick={handleNextQuestion}
                disabled={!selectedAnswer}
              >
                {currentQuestionIndex === level.questions.length - 1 ? '提交答案' : '下一题 →'}
              </button>
            </div>

            {/* 题目导航 */}
            <div className="question-nav">
              {level.questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`nav-dot ${idx === currentQuestionIndex ? 'active' : ''} ${answers[idx] ? 'answered' : ''}`}
                  onClick={() => {
                    setCurrentQuestionIndex(idx)
                    setSelectedAnswer(answers[idx] || '')
                  }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
