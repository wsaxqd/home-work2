import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import VoiceInput from '../components/VoiceInput'
import LearningDashboard from '../components/LearningDashboard'
import './Home.css'

// 学习功能区 - 按重要性和使用频率排序
const learningFeatures = [
  // 第一优先级：AI核心学习功能（最重要）
  { icon: '🗺️', title: '学习地图', desc: '闯关学习·勋章收集', path: '/learning-map', color: '#5f27cd', bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', emoji: '🎮' },
  { icon: '💡', title: 'AI小百科', desc: '探索世界的奥秘', path: '/ai-encyclopedia', color: '#9b59b6', bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', emoji: '🌟' },

  // 第二优先级：阅读与文化学习
  { icon: '📖', title: '绘本阅读', desc: '92本经典绘本', path: '/picture-book', color: '#3498db', bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', emoji: '📚' },

  // 第三优先级：知识拓展与趣味学习
  { icon: '🎵', title: '儿歌大全', desc: '经典儿歌欢乐唱', path: '/children-songs', color: '#1abc9c', bgColor: 'linear-gradient(135deg, #81fbb8 0%, #28c76f 100%)', emoji: '🎶' },
]

// 快捷功能
const quickActions = [
  { icon: '📅', title: '每日签到', path: '/checkin', color: '#fa709a' },
  { icon: '📚', title: '我的作品', path: '/my-works', color: '#a29bfe' },
  { icon: '🏆', title: '成就中心', path: '/checkin-achievements', color: '#fdcb6e' },
  { icon: '💝', title: '心灵花园', path: '/mind-garden', color: '#fd79a8' },
]

export default function Home() {
  const navigate = useNavigate()
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
  const [aiQuestion, setAiQuestion] = useState('')
  const [showFullChat, setShowFullChat] = useState(false)
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { role: 'assistant', content: '你好！我是AI助手启启，有什么问题我可以帮你解答吗？' }
  ])
  const [isThinking, setIsThinking] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  // 常见问题快捷标签
  const commonQuestions = ['数学', '语文', '英语', '科学']

  // 处理语音识别结果
  const handleVoiceTranscript = (text: string) => {
    setAiQuestion(text)
    setVoiceError(null)
    // 自动发送语音识别的问题
    handleAskQuestion(text)
  }

  // 处理语音识别错误
  const handleVoiceError = (error: string) => {
    setVoiceError(error)
    setTimeout(() => setVoiceError(null), 3000) // 3秒后自动清除错误提示
  }

  const handleAskQuestion = async (question?: string) => {
    const questionText = question || aiQuestion.trim()
    if (!questionText) return

    const newMessages = [...aiMessages, { role: 'user' as const, content: questionText }]
    setAiMessages(newMessages)
    setAiQuestion('')
    setIsThinking(true)
    setShowFullChat(true) // 发送问题后展开完整对话

    try {
      // 调用后端API
      const response = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-10) // 保留最近10条对话
        })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setAiMessages([...newMessages, { role: 'assistant', content: data.data.reply || data.data.content || '抱歉，我现在无法回答，请稍后再试。' }])
      } else {
        setAiMessages([...newMessages, { role: 'assistant', content: data.message || '抱歉，我现在无法回答，请稍后再试。' }])
      }
    } catch (error) {
      console.error('AI对话错误:', error)
      setAiMessages([...newMessages, { role: 'assistant', content: '网络连接失败，请检查后重试。' }])
    } finally {
      setIsThinking(false)
    }
  }

  // 获取当前时间段问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '深夜好'
    if (hour < 12) return '早上好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  return (
    <Layout>
      <Header
        title="启蒙之光"
        subtitle="让每个孩子都能拥抱智能时代"
        showBack={false}
      />
      <div className="main-content">
        {/* 学习仪表盘 */}
        <LearningDashboard />

        {/* 全局搜索入口 */}
        <div className="search-entry" onClick={() => navigate('/search')}>
          <span className="search-entry-icon">🔍</span>
          <span className="search-entry-text">搜索游戏、故事、创作工具...</span>
        </div>

        {/* 今日推荐模块 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">⭐</span>
            今日推荐
          </div>
          <div className="section-subtitle">基于你的学习进度</div>
        </div>

        <div className="hero-card" onClick={() => navigate('/learning-map')}>
          <div className="hero-card-bg">🗺️</div>
          <div className="hero-card-content">
            <div className="hero-card-badge">继续闯关</div>
            <div className="hero-card-title">学习地图</div>
            <div className="hero-card-desc">数学王国 - 第3关正在等你！</div>
            <button className="hero-card-cta">开始闯关 →</button>
          </div>
        </div>

        {/* 快速入口网格 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">📚</span>
            快速入口
          </div>
        </div>

        <div className="quick-entry-grid">
          <div className="quick-entry-card" onClick={() => navigate('/homework')}>
            <div className="quick-entry-icon">📝</div>
            <div className="quick-entry-title">作业助手</div>
          </div>
          <div className="quick-entry-card" onClick={() => navigate('/ai-encyclopedia')}>
            <div className="quick-entry-icon">💡</div>
            <div className="quick-entry-title">AI百科</div>
          </div>
          <div className="quick-entry-card" onClick={() => navigate('/picture-book')}>
            <div className="quick-entry-icon">📖</div>
            <div className="quick-entry-title">绘本阅读</div>
          </div>
          <div className="quick-entry-card" onClick={() => navigate('/children-songs')}>
            <div className="quick-entry-icon">🎵</div>
            <div className="quick-entry-title">儿歌大全</div>
          </div>
          <div className="quick-entry-card" onClick={() => navigate('/wrong-questions')}>
            <div className="quick-entry-icon">📕</div>
            <div className="quick-entry-title">错题本</div>
          </div>
        </div>

        {/* AI助手快捷咨询（紧凑型） */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🤖</span>
            AI助手快捷咨询
          </div>
        </div>

        <div className="ai-quick-chat">
          {voiceError && (
            <div className="voice-error-message">
              ⚠️ {voiceError}
            </div>
          )}
          <div className="ai-input-row">
            <input
              type="text"
              className="ai-input-compact"
              placeholder="问我任何学习问题..."
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
            />
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              onError={handleVoiceError}
              placeholder="点击麦克风开始语音输入"
            />
            <button
              className="ai-send-btn-compact"
              onClick={() => handleAskQuestion()}
              disabled={isThinking}
            >
              {isThinking ? '⏳' : '📤'}
            </button>
          </div>
          <div className="common-questions">
            {commonQuestions.map((q) => (
              <button
                key={q}
                className="question-tag"
                onClick={() => handleAskQuestion(`帮我学习${q}`)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 完整对话窗口（可展开） */}
        {showFullChat && (
          <div className="full-chat-modal">
            <div className="chat-modal-overlay" onClick={() => setShowFullChat(false)}></div>
            <div className="chat-modal-content">
              <div className="chat-modal-header">
                <div className="chat-title">
                  <span className="chat-icon">🤖</span>
                  <span>AI智能助手</span>
                </div>
                <button className="chat-close-btn" onClick={() => setShowFullChat(false)}>✕</button>
              </div>

              <div className="chat-messages">
                {aiMessages.map((msg, idx) => (
                  <div key={idx} className={`chat-message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'user' ? (userProfile.avatar || '👤') : '🤖'}
                    </div>
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))}
                {isThinking && (
                  <div className="chat-message assistant">
                    <div className="message-avatar">🤖</div>
                    <div className="message-content typing">正在思考...</div>
                  </div>
                )}
              </div>

              <div className="chat-input-area">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="问我任何问题..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                />
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  onError={handleVoiceError}
                  placeholder="语音输入"
                />
                <button className="chat-send-btn" onClick={() => handleAskQuestion()} disabled={isThinking}>
                  {isThinking ? '⏳' : '📤'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
