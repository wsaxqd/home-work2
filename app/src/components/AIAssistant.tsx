import { useState } from 'react'
import './AIAssistant.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好呀！我是智能小助手，有什么可以帮你的吗？😊' }
  ])
  const [input, setInput] = useState('')

  const quickQuestions = [
    '怎么开始创作？',
    '怎么玩游戏？',
    '我的作品在哪里？',
    '忘记密码怎么办？'
  ]

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages([...messages, userMessage])

    // 简单的自动回复逻辑
    setTimeout(() => {
      let reply = ''
      const lowerInput = input.toLowerCase()

      if (lowerInput.includes('创作') || lowerInput.includes('画画') || lowerInput.includes('写诗')) {
        reply = '点击底部的"✨ AI创作"按钮，就可以看到4种创作工具啦！选择你喜欢的工具开始创作吧！🎨'
      } else if (lowerInput.includes('游戏')) {
        reply = '点击底部的"🎮 AI游戏"按钮，可以玩表情识别和图像认知游戏哦！既好玩又能学习！🎯'
      } else if (lowerInput.includes('作品') || lowerInput.includes('收藏')) {
        reply = '点击底部的"👤 我的"按钮，然后选择"我的作品"或"我的收藏"就能看到啦！📁'
      } else if (lowerInput.includes('密码') || lowerInput.includes('登录')) {
        reply = '如果忘记密码，可以点击右上角的退出按钮重新登录，或者联系老师帮忙重置哦！🔑'
      } else if (lowerInput.includes('心灵花园')) {
        reply = '心灵花园是记录心情的地方！点击底部的"💝 心灵花园"，可以写下今天的心情和想法！✍️'
      } else {
        reply = '抱歉，我还在学习中！你可以试试问我："怎么开始创作？"、"怎么玩游戏？"这类问题哦！如果还有疑问，可以找老师帮忙！😊'
      }

      const assistantMessage: Message = { role: 'assistant', content: reply }
      setMessages(prev => [...prev, assistantMessage])
    }, 500)

    setInput('')
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
    setTimeout(() => handleSend(), 100)
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <div
        className={`ai-assistant-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✖️' : '🤖'}
      </div>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="ai-assistant-window">
          <div className="assistant-header">
            <div className="header-avatar">🤖</div>
            <div className="header-info">
              <div className="header-title">智能小助手</div>
              <div className="header-status">在线中</div>
            </div>
          </div>

          <div className="assistant-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                {msg.role === 'assistant' && <div className="message-avatar">🤖</div>}
                <div className="message-bubble">
                  {msg.content}
                </div>
                {msg.role === 'user' && <div className="message-avatar">👤</div>}
              </div>
            ))}
          </div>

          {messages.length === 1 && (
            <div className="quick-questions">
              <div className="quick-label">快速提问：</div>
              {quickQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="quick-question"
                  onClick={() => handleQuickQuestion(q)}
                >
                  {q}
                </div>
              ))}
            </div>
          )}

          <div className="assistant-input">
            <input
              type="text"
              placeholder="输入你的问题..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={!input.trim()}>
              发送
            </button>
          </div>
        </div>
      )}
    </>
  )
}
