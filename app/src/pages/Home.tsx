import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import AIChatbot from '../components/AIChatbot'
import PetCompanion from '../components/PetCompanion'
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
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { role: 'assistant', content: '你好！我是AI助手启启，有什么问题我可以帮你解答吗？' }
  ])
  const [isThinking, setIsThinking] = useState(false)

  const handleAskQuestion = async () => {
    if (!aiQuestion.trim()) return

    const newMessages = [...aiMessages, { role: 'user' as const, content: aiQuestion }]
    setAiMessages(newMessages)
    setAiQuestion('')
    setIsThinking(true)

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

  return (
    <Layout>
      <Header
        title="启蒙之光"
        subtitle="普及贫困地区AI教育 · 让每个孩子都能拥抱智能时代"
        showBack={false}
      />
      <div className="main-content">
        {/* AI对话窗口 - DeepSeek风格 */}
        <div className="ai-chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <span className="chat-icon">🤖</span>
              <span>AI智能助手</span>
            </div>
            <div className="chat-status">在线</div>
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
            <button className="chat-send-btn" onClick={handleAskQuestion} disabled={isThinking}>
              {isThinking ? '⏳' : '📤'}
            </button>
          </div>
        </div>

        {/* 学习功能区 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">📚</span>
            趣味学习
          </div>
          <div className="section-subtitle">在玩中学，在学中玩</div>
        </div>

        <div className="learning-grid">
          {learningFeatures.map((feature) => (
            <div
              key={feature.path}
              className="learning-card-v2"
              style={{ background: feature.bgColor }}
              onClick={() => navigate(feature.path)}
            >
              <div className="learning-card-emoji">{feature.emoji}</div>
              <div className="learning-card-icon">{feature.icon}</div>
              <div className="learning-card-content">
                <div className="learning-card-title">{feature.title}</div>
                <div className="learning-card-desc">{feature.desc}</div>
              </div>
              <div className="learning-card-action">
                <span className="action-text">开始学习</span>
                <span className="action-arrow">→</span>
              </div>
            </div>
          ))}
        </div>

        {/* 全局搜索入口 */}
        <div className="search-entry" onClick={() => navigate('/search')}>
          <span className="search-entry-icon">🔍</span>
          <span className="search-entry-text">搜索游戏、故事、创作工具...</span>
        </div>

        {/* 学习伙伴 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🐾</span>
            学习伙伴
          </div>
          <div className="section-subtitle">陪你一起成长</div>
        </div>
        <PetCompanion onInteraction={(type) => {
          console.log('宠物互动:', type)
        }} />

        {/* 数据统计卡片 */}
        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-icon">📈</span>
            <span className="stats-title">我的成长数据</span>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">创作作品</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">游戏次数</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">连续天数</div>
            </div>
          </div>
        </div>

        {/* AI客服机器人 */}
        <AIChatbot />
      </div>
    </Layout>
  )
}
