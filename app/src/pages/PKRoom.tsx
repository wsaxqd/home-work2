import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './PKRoom.css'

interface Participant {
  id: number
  user_id: number
  player_slot: number
  is_ready: boolean
  score: number
  correct_count: number
  nickname: string
  avatar: string
}

interface Question {
  id: number
  question_number: number
  question_data: any
  correct_answer: string
}

interface RoomData {
  id: number
  room_code: string
  game_type: string
  subject: string
  difficulty: string
  question_count: number
  time_limit: number
  room_status: string
  created_at: string
}

export default function PKRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<RoomData | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(30) // 每题30秒
  const [isReady, setIsReady] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [answerFeedback, setAnswerFeedback] = useState<{ show: boolean; correct: boolean } | null>(null)

  const currentUserId = JSON.parse(localStorage.getItem('userProfile') || '{}').id

  // 加载房间信息
  useEffect(() => {
    loadRoomInfo()
    const interval = setInterval(loadRoomInfo, 2000) // 每2秒刷新房间状态
    return () => clearInterval(interval)
  }, [roomId])

  // 倒计时
  useEffect(() => {
    if (gameStarted && !gameFinished && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (gameStarted && timeLeft === 0) {
      // 时间到，自动提交空答案
      handleSubmitAnswer()
    }
  }, [timeLeft, gameStarted, gameFinished])

  const loadRoomInfo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/pk/rooms/${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setRoom(data.data.room)
        setParticipants(data.data.participants)

        // 检查游戏状态
        if (data.data.room.room_status === 'playing' && !gameStarted) {
          setGameStarted(true)
          loadQuestions()
        } else if (data.data.room.room_status === 'finished' && !gameFinished) {
          setGameFinished(true)
          loadResult()
        }
      }
    } catch (error) {
      console.error('加载房间信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/pk/rooms/${roomId}/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setQuestions(data.data)
      }
    } catch (error) {
      console.error('加载题目失败:', error)
    }
  }

  const handleReady = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/pk/rooms/${roomId}/ready`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      if (data.success) {
        setIsReady(true)
        if (data.data.status === 'playing') {
          setGameStarted(true)
          loadQuestions()
        }
      }
    } catch (error) {
      console.error('准备失败:', error)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!questions[currentQuestionIndex]) return

    const startTime = Date.now()

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/pk/rooms/${roomId}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionNumber: currentQuestionIndex + 1,
          userAnswer: userAnswer.trim(),
          timeSpent: 30000 - timeLeft * 1000 // 毫秒
        })
      })
      const data = await response.json()

      // 显示答题反馈
      setAnswerFeedback({
        show: true,
        correct: data.data.isCorrect
      })

      // 1秒后进入下一题
      setTimeout(() => {
        setAnswerFeedback(null)
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
          setUserAnswer('')
          setTimeLeft(30)
        } else {
          // 所有题目完成
          setGameFinished(true)
          loadResult()
        }
      }, 1500)

    } catch (error) {
      console.error('提交答案失败:', error)
    }
  }

  const loadResult = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/pk/rooms/${roomId}/result`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('加载结果失败:', error)
    }
  }

  const handleLeaveRoom = () => {
    navigate('/pk-battle')
  }

  const currentQuestion = questions[currentQuestionIndex]
  const myParticipant = participants.find(p => p.user_id === currentUserId)
  const opponentParticipant = participants.find(p => p.user_id !== currentUserId)

  if (loading) {
    return (
      <Layout>
        <Header title="PK对战" gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />
        <div className="pk-room-container">
          <div className="loading-state">加载中...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Header title="PK对战" gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />

      <div className="pk-room-container">
        {/* 房间信息 */}
        <div className="room-info-banner">
          <div className="room-code-display">
            <span className="code-label">房间码:</span>
            <span className="code-value">{room?.room_code}</span>
          </div>
          <div className="room-meta">
            <span className="meta-item">📚 {room?.subject}</span>
            <span className="meta-item">⭐ {room?.difficulty}</span>
            <span className="meta-item">📝 {room?.question_count}题</span>
          </div>
        </div>

        {/* 等待界面 */}
        {!gameStarted && !gameFinished && (
          <div className="waiting-area">
            <div className="vs-display">
              <div className="player-slot">
                <div className="player-avatar">{myParticipant?.avatar || '👤'}</div>
                <div className="player-name">{myParticipant?.nickname || '我'}</div>
                {myParticipant?.is_ready && <div className="ready-badge">✓ 已准备</div>}
              </div>

              <div className="vs-icon">VS</div>

              <div className="player-slot">
                {opponentParticipant ? (
                  <>
                    <div className="player-avatar">{opponentParticipant.avatar || '👤'}</div>
                    <div className="player-name">{opponentParticipant.nickname}</div>
                    {opponentParticipant.is_ready && <div className="ready-badge">✓ 已准备</div>}
                  </>
                ) : (
                  <div className="waiting-opponent">
                    <div className="loading-dots">等待对手加入...</div>
                  </div>
                )}
              </div>
            </div>

            {participants.length === 2 && !isReady && (
              <button className="ready-button" onClick={handleReady}>
                准备开始
              </button>
            )}

            {isReady && (
              <div className="ready-message">等待对手准备...</div>
            )}

            {participants.length < 2 && (
              <button className="leave-button" onClick={handleLeaveRoom}>
                离开房间
              </button>
            )}
          </div>
        )}

        {/* 对战界面 */}
        {gameStarted && !gameFinished && currentQuestion && (
          <div className="battle-area">
            {/* 分数显示 */}
            <div className="score-bar">
              <div className="player-score">
                <div className="score-avatar">{myParticipant?.avatar || '👤'}</div>
                <div className="score-info">
                  <div className="score-name">{myParticipant?.nickname || '我'}</div>
                  <div className="score-value">{myParticipant?.score || 0}分</div>
                </div>
              </div>

              <div className="score-divider">
                <div className="question-progress">
                  {currentQuestionIndex + 1} / {questions.length}
                </div>
              </div>

              <div className="player-score opponent">
                <div className="score-info">
                  <div className="score-name">{opponentParticipant?.nickname || '对手'}</div>
                  <div className="score-value">{opponentParticipant?.score || 0}分</div>
                </div>
                <div className="score-avatar">{opponentParticipant?.avatar || '👤'}</div>
              </div>
            </div>

            {/* 倒计时 */}
            <div className="timer-display">
              <div className={`timer-circle ${timeLeft <= 10 ? 'urgent' : ''}`}>
                <div className="timer-value">{timeLeft}</div>
                <div className="timer-label">秒</div>
              </div>
            </div>

            {/* 题目显示 */}
            <div className="question-card">
              <div className="question-number">第 {currentQuestionIndex + 1} 题</div>
              <div className="question-text">{currentQuestion.question_data.question || currentQuestion.question_data.text}</div>

              {currentQuestion.question_data.options && (
                <div className="question-options">
                  {currentQuestion.question_data.options.map((option: string, idx: number) => (
                    <div
                      key={idx}
                      className={`option-item ${userAnswer === option ? 'selected' : ''}`}
                      onClick={() => setUserAnswer(option)}
                    >
                      <div className="option-label">{String.fromCharCode(65 + idx)}</div>
                      <div className="option-text">{option}</div>
                    </div>
                  ))}
                </div>
              )}

              {!currentQuestion.question_data.options && (
                <div className="answer-input-area">
                  <input
                    type="text"
                    className="answer-input"
                    placeholder="输入答案..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                  />
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            <button
              className="submit-answer-button"
              onClick={handleSubmitAnswer}
              disabled={!userAnswer.trim() || answerFeedback !== null}
            >
              提交答案
            </button>

            {/* 答题反馈 */}
            {answerFeedback?.show && (
              <div className={`answer-feedback ${answerFeedback.correct ? 'correct' : 'incorrect'}`}>
                {answerFeedback.correct ? '✓ 回答正确！+10分' : '✗ 回答错误'}
              </div>
            )}
          </div>
        )}

        {/* 结果界面 */}
        {gameFinished && result && (
          <div className="result-area">
            <div className="result-header">
              {result.winner.user_id === currentUserId ? (
                <div className="result-title victory">🎉 胜利！</div>
              ) : (
                <div className="result-title defeat">加油！</div>
              )}
            </div>

            <div className="result-vs">
              <div className="result-player">
                <div className="result-avatar">{myParticipant?.avatar || '👤'}</div>
                <div className="result-name">{myParticipant?.nickname || '我'}</div>
                <div className="result-score">{myParticipant?.score}分</div>
                <div className="result-stats">
                  <div className="stat">答对 {myParticipant?.correct_count}题</div>
                  {result.winner.user_id === currentUserId && (
                    <div className="rank-change positive">+{result.winner.rankChange}分</div>
                  )}
                  {result.loser.user_id === currentUserId && (
                    <div className="rank-change negative">{result.loser.rankChange}分</div>
                  )}
                </div>
              </div>

              <div className="result-divider">VS</div>

              <div className="result-player">
                <div className="result-avatar">{opponentParticipant?.avatar || '👤'}</div>
                <div className="result-name">{opponentParticipant?.nickname || '对手'}</div>
                <div className="result-score">{opponentParticipant?.score}分</div>
                <div className="result-stats">
                  <div className="stat">答对 {opponentParticipant?.correct_count}题</div>
                  {result.winner.user_id !== currentUserId && (
                    <div className="rank-change positive">+{result.winner.rankChange}分</div>
                  )}
                  {result.loser.user_id !== currentUserId && (
                    <div className="rank-change negative">{result.loser.rankChange}分</div>
                  )}
                </div>
              </div>
            </div>

            <div className="result-actions">
              <button className="action-button secondary" onClick={handleLeaveRoom}>
                返回大厅
              </button>
              <button className="action-button primary" onClick={() => navigate('/pk-battle')}>
                再来一局
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
