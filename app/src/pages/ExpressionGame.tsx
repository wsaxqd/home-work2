import { useState } from 'react'
import { Layout, Header } from '../components/layout'
import './Game.css'

const expressions = [
  { emoji: '😊', name: '开心', desc: '嘴角上扬，眼睛微弯' },
  { emoji: '😢', name: '悲伤', desc: '嘴角下垂，眉毛呈八字形' },
  { emoji: '😠', name: '生气', desc: '眉毛紧皱，眼睛瞪大' },
  { emoji: '😲', name: '惊讶', desc: '眼睛睁大，嘴巴张开' },
  { emoji: '😨', name: '害怕', desc: '眉毛上扬，嘴巴紧张' },
  { emoji: '🤢', name: '厌恶', desc: '鼻子皱起，上唇抬起' },
]

export default function ExpressionGame() {
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [currentExpression, setCurrentExpression] = useState(expressions[0])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const startCamera = () => {
    setResult({ success: false, message: '摄像头已开启！模仿目标表情吧。' })
  }

  const analyzeExpression = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      const success = Math.random() > 0.3
      if (success) {
        setScore(score + 10)
        setResult({ success: true, message: '太棒了！表情匹配成功！+10分' })
      } else {
        setResult({ success: false, message: '再试一次，你可以的！' })
      }
    }, 2000)
  }

  const nextChallenge = () => {
    const nextIndex = Math.floor(Math.random() * expressions.length)
    setCurrentExpression(expressions[nextIndex])
    setResult(null)
    setLevel(level + 1)
  }

  return (
    <Layout>
      <Header
        title="表情模仿秀"
        gradient="linear-gradient(135deg, #ffc107 0%, #ff5722 100%)"
        rightContent={<span className="score-badge">得分: {score}</span>}
      />
      <div className="main-content">
        <div className="game-progress">
          <div className="level-indicator">第 {level} 关</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(level / 8) * 100}%` }}></div>
          </div>
          <div className="progress-text">{level}/8</div>
        </div>

        <div className="section-title">目标表情</div>
        <div className="target-card">
          <div className="target-emoji">{currentExpression.emoji}</div>
          <div className="target-name">{currentExpression.name}</div>
          <div className="target-desc">{currentExpression.desc}</div>
        </div>

        <div className="section-title">摄像头区域</div>
        <div className="camera-area">
          <div className="camera-preview">
            <div className="camera-placeholder">📷</div>
          </div>
          <div className="camera-controls">
            <button className="control-btn" onClick={startCamera}>📹 开启</button>
            <button className="control-btn primary" onClick={analyzeExpression}>📸 拍照</button>
            <button className="control-btn" onClick={analyzeExpression}>🔍 分析</button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="analyzing-overlay">
            <div className="spinner"></div>
            <div className="analyzing-text">AI正在识别你的表情...</div>
          </div>
        )}

        {result && (
          <div className={`result-card ${result.success ? 'success' : ''}`}>
            <div className="result-icon">{result.success ? '🎉' : '💪'}</div>
            <div className="result-message">{result.message}</div>
            {result.success && (
              <button className="btn btn-primary" onClick={nextChallenge}>
                下一个表情
              </button>
            )}
          </div>
        )}

        <div className="section-title">表情学习</div>
        <div className="expressions-grid">
          {expressions.map((exp) => (
            <div
              key={exp.name}
              className="expression-item"
              onClick={() => setCurrentExpression(exp)}
            >
              <div className="exp-emoji">{exp.emoji}</div>
              <div className="exp-name">{exp.name}</div>
            </div>
          ))}
        </div>

        <div className="section-title">AI原理小知识</div>
        <div className="knowledge-card">
          <div className="knowledge-icon">🤖</div>
          <div className="knowledge-content">
            <p><strong>AI是怎么识别表情的？</strong></p>
            <p>AI通过分析人脸的关键特征（眼睛、眉毛、嘴巴）来识别表情，比较这些特征与已知模式判断情绪状态。</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
