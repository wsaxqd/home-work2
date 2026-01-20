import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import AIChatbot from '../components/AIChatbot'
import PetCompanion from '../components/PetCompanion'
import './Home.css'

// 学习功能区
const learningFeatures = [
  { icon: '📝', title: 'AI作业助手', desc: '拍照搜题·智能解答', path: '/homework', color: '#ff6b6b', bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', emoji: '🎓' },
  { icon: '📕', title: '我的错题本', desc: '错题整理·薄弱分析', path: '/wrong-questions', color: '#ea5455', bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', emoji: '📖' },
  { icon: '🗺️', title: '学习地图', desc: '闯关学习·勋章收集', path: '/learning-map', color: '#5f27cd', bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', emoji: '🎮' },
  { icon: '💡', title: 'AI小百科', desc: '探索世界的奥秘', path: '/ai-encyclopedia', color: '#9b59b6', bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', emoji: '🌟' },
  { icon: '📖', title: '绘本阅读', desc: '92本经典绘本', path: '/picture-book', color: '#3498db', bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', emoji: '📚' },
  { icon: '📜', title: '国学经典', desc: '唐诗宋词·论语三字经', path: '/chinese-classics', color: '#c0392b', bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', emoji: '🏮' },
  { icon: '📚', title: '四大名著', desc: '西游·三国·水浒·红楼', path: '/four-classics', color: '#d35400', bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', emoji: '🎭' },
  { icon: '🌍', title: '英语绘本', desc: '快乐学英语', path: '/english-book', color: '#e74c3c', bgColor: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)', emoji: '🎈' },
  { icon: '❓', title: '十万个为什么', desc: '解答你的好奇心', path: '/why-questions', color: '#f39c12', bgColor: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)', emoji: '🤔' },
  { icon: '🎵', title: '儿歌大全', desc: '经典儿歌欢乐唱', path: '/children-songs', color: '#1abc9c', bgColor: 'linear-gradient(135deg, #81fbb8 0%, #28c76f 100%)', emoji: '🎶' },
]

// 快捷功能
const quickActions = [
  { icon: '📚', title: '我的作品', path: '/my-works', color: '#a29bfe' },
  { icon: '🏆', title: '成就中心', path: '/achievements', color: '#fdcb6e' },
  { icon: '💝', title: '心灵花园', path: '/mind-garden', color: '#fd79a8' },
  { icon: '⚙️', title: '设置', path: '/settings', color: '#74b9ff' },
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
          message: aiQuestion,
          history: newMessages.slice(-10) // 保留最近10条对话
        })
      })

      const data = await response.json()
      setAiMessages([...newMessages, { role: 'assistant', content: data.reply || '抱歉，我现在无法回答，请稍后再试。' }])
    } catch (error) {
      setAiMessages([...newMessages, { role: 'assistant', content: '网络连接失败，请检查后重试。' }])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <Layout>
      <Header title="启蒙之光" showBack={false} />
      <div className="main-content">
        {/* 全局搜索入口 */}
        <div className="search-entry" onClick={() => navigate('/search')}>
          <span className="search-entry-icon">🔍</span>
          <span className="search-entry-text">搜索游戏、故事、创作工具...</span>
        </div>

        {/* 欢迎横幅 - 升级版 */}
        <div className="welcome-banner-v2">
          <div className="welcome-bg-particles">
            <span className="particle">✨</span>
            <span className="particle">⭐</span>
            <span className="particle">💫</span>
            <span className="particle">🌟</span>
            <span className="particle">✨</span>
          </div>
          <div className="welcome-content-wrapper">
            <div className="welcome-avatar-wrapper">
              <div className="avatar-ring"></div>
              <div className="avatar-ring-2"></div>
              <div className="welcome-avatar-large">{userProfile.avatar || '🌟'}</div>
            </div>
            <div className="welcome-info-v2">
              <div className="welcome-time-badge">
                {new Date().getHours() < 12 ? '🌅 早上好' :
                 new Date().getHours() < 18 ? '☀️ 下午好' : '🌙 晚上好'}
              </div>
              <h1 className="welcome-greeting-v2">
                {userProfile.nickname || '小朋友'}
              </h1>
              <p className="welcome-subtitle-v2">开始今天的学习之旅吧！</p>
            </div>
          </div>
          <div className="welcome-stats-mini">
            <div className="mini-stat">
              <span className="mini-stat-icon">🔥</span>
              <span className="mini-stat-value">0天</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-icon">⭐</span>
              <span className="mini-stat-value">0分</span>
            </div>
          </div>
        </div>

        {/* AI学习伙伴 - 虚拟宠物 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🐾</span>
            我的学习伙伴
          </div>
          <div className="section-subtitle">陪伴你成长的小伙伴</div>
        </div>

        <PetCompanion onInteraction={(type) => {
          console.log('宠物互动:', type)
          // 可以在这里触发积分增加等逻辑
        }} />

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

        {/* 快捷功能 */}
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">⚡</span>
            快捷入口
          </div>
          <div className="section-subtitle">快速访问常用功能</div>
        </div>

        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <div
              key={action.path}
              className="quick-action-card"
              onClick={() => navigate(action.path)}
            >
              <div className="quick-action-icon" style={{ color: action.color }}>{action.icon}</div>
              <div className="quick-action-title">{action.title}</div>
            </div>
          ))}
        </div>

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
