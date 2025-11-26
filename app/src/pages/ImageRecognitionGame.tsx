import { useState } from 'react'
import { Layout, Header } from '../components/layout'
import './Game.css'

const categories = [
  { icon: '🐾', name: '动物识别', value: 'animal' },
  { icon: '🍎', name: '水果识别', value: 'fruit' },
  { icon: '🚗', name: '交通工具', value: 'vehicle' },
  { icon: '⌚', name: '日常物品', value: 'object' },
]

const challengeTargets = [
  { icon: '🐱', name: '猫', found: false },
  { icon: '🍎', name: '苹果', found: false },
  { icon: '📱', name: '手机', found: false },
  { icon: '📚', name: '书本', found: false },
]

export default function ImageRecognitionGame() {
  const [score, setScore] = useState(0)
  const [level] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<{ name: string; confidence: number } | null>(null)
  const [targets, setTargets] = useState(challengeTargets)

  const takePhoto = () => {
    setResult(null)
  }

  const analyzeImage = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      const items = ['猫', '狗', '苹果', '香蕉', '汽车', '手机', '书本']
      const randomItem = items[Math.floor(Math.random() * items.length)]
      const confidence = Math.floor(Math.random() * 30) + 70

      setResult({ name: randomItem, confidence })
      setScore(score + Math.floor(confidence / 10))

      // Check if item matches any target
      const targetIndex = targets.findIndex(t => t.name === randomItem)
      if (targetIndex !== -1 && !targets[targetIndex].found) {
        const newTargets = [...targets]
        newTargets[targetIndex].found = true
        setTargets(newTargets)
      }
    }, 2000)
  }

  return (
    <Layout>
      <Header
        title="猜猜我是谁"
        gradient="linear-gradient(135deg, #00bcd4 0%, #7e57c2 100%)"
        rightContent={<span className="score-badge">得分: {score}</span>}
      />
      <div className="main-content">
        <div className="game-progress">
          <div className="level-indicator">第 {level} 关</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(level / 10) * 100}%` }}></div>
          </div>
          <div className="progress-text">{level}/10</div>
        </div>

        <div className="section-title">AI图像识别</div>
        <div className="camera-area">
          <div className="camera-preview">
            <div className="camera-placeholder">📷</div>
          </div>
          <div className="camera-controls">
            <button className="control-btn" onClick={takePhoto}>📸 拍照</button>
            <button className="control-btn" onClick={takePhoto}>📁 上传</button>
            <button className="control-btn primary" onClick={analyzeImage}>🔍 分析</button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="analyzing-overlay">
            <div className="spinner"></div>
            <div className="analyzing-text">AI正在识别图片内容...</div>
          </div>
        )}

        {result && (
          <div className="result-card success">
            <div className="result-icon">🎯</div>
            <div className="result-message">
              识别结果：<strong>{result.name}</strong>
            </div>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${result.confidence}%` }}></div>
            </div>
            <div className="confidence-text">置信度：{result.confidence}%</div>
          </div>
        )}

        <div className="section-title">学习卡片</div>
        <div className="learning-cards">
          {categories.map((cat) => (
            <div
              key={cat.value}
              className={`learning-card ${selectedCategory === cat.value ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              <div className="card-icon">{cat.icon}</div>
              <div className="card-name">{cat.name}</div>
            </div>
          ))}
        </div>

        <div className="section-title">今日挑战</div>
        <div className="challenge-area">
          <div className="challenge-header">
            <div className="challenge-icon">🎯</div>
            <div className="challenge-title">找到这些物品</div>
          </div>
          <div className="challenge-targets">
            {targets.map((target, index) => (
              <div key={index} className="target-item">
                <div className="target-icon">{target.icon}</div>
                <div className="target-name">{target.name}</div>
                <div className={`target-status ${target.found ? 'status-found' : 'status-missing'}`}>
                  {target.found ? '已找到' : '未找到'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-title">AI原理小知识</div>
        <div className="knowledge-card">
          <div className="knowledge-icon">🤖</div>
          <div className="knowledge-content">
            <p><strong>AI是怎么认出图片的？</strong></p>
            <p>AI通过"神经网络"系统识别图像，分析成千上万张图片学习特征，当你给AI新图片时，它根据学到的知识猜测是什么！</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
