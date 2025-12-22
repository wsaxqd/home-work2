import { useState, useRef, useEffect } from 'react'
import './ChatBot.css'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const quickReplies = [
  '如何创作绘画？',
  '如何玩游戏？',
  '心灵花园是什么？',
  '如何查看我的作品？'
]

const botResponses: { [key: string]: string } = {
  '如何创作绘画？': '点击"AI创作"页面，选择"绘画创作"，然后输入你想画的内容描述，小助手会帮你生成美丽的画作！✨',
  '如何玩游戏？': '进入"AI游戏"页面，选择你喜欢的游戏类型。我们有表情识别、图像识别等有趣的游戏等着你！🎮',
  '心灵花园是什么？': '心灵花园是一个记录你情绪和成长的地方。在这里可以写日记、做情绪测评，还能看到你的成长轨迹！💝',
  '如何查看我的作品？': '点击底部导航的"我的"，然后选择"我的作品"，就能看到你所有的创作啦！📚',
  '默认': '你好！我是启蒙之光的智能小助手🤖，有什么可以帮助你的吗？你可以点击下方的快捷问题，或者直接输入你的问题！'
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 打开客服时显示欢迎消息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(botResponses['默认'])
    }
  }, [isOpen])

  const addBotMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender: 'bot',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])

    // 延迟回复，模拟思考
    setTimeout(() => {
      const response = botResponses[text] || '抱歉，我还在学习中。请尝试点击下方的快捷问题，或者换个方式问我！😊'
      addBotMessage(response)
    }, 500)
  }

  const handleQuickReply = (question: string) => {
    addUserMessage(question)
  }

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      addUserMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* 客服按钮 */}
      <button
        className={`chatbot-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="chatbot-icon">{isOpen ? '✕' : '🤖'}</span>
        {!isOpen && <span className="chatbot-badge">?</span>}
      </button>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="chatbot-window">
          {/* 头部 */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">🤖</div>
              <div className="chatbot-info">
                <div className="chatbot-name">智能小助手</div>
                <div className="chatbot-status">
                  <span className="status-dot"></span>
                  在线
                </div>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* 消息区域 */}
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender}`}
              >
                {message.sender === 'bot' && (
                  <div className="message-avatar">🤖</div>
                )}
                <div className="message-bubble">
                  {message.text}
                </div>
                {message.sender === 'user' && (
                  <div className="message-avatar">👤</div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷回复 */}
          {messages.length <= 1 && (
            <div className="chatbot-quick-replies">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  className="quick-reply-btn"
                  onClick={() => handleQuickReply(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* 输入区域 */}
          <div className="chatbot-input-area">
            <input
              type="text"
              className="chatbot-input"
              placeholder="输入你的问题..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="chatbot-send"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </>
  )
}
