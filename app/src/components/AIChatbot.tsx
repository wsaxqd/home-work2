import { useState, useRef, useEffect } from 'react'
import './AIChatbot.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是AI助手小光，很高兴为你服务。有什么我可以帮助你的吗？😊',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 打开聊天窗口时聚焦输入框
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // 发送消息到AI服务
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // 获取token
      const userProfile = localStorage.getItem('userProfile')
      const token = userProfile ? JSON.parse(userProfile).token : null

      // 构建消息历史
      const chatMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      chatMessages.push({ role: 'user', content: content.trim() })

      // 调用后端API
      const response = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: chatMessages,
          context: '启蒙之光应用客服'
        })
      })

      if (!response.ok) {
        throw new Error('API请求失败')
      }

      const data = await response.json()

      // 添加AI回复 - 后端使用 sendSuccess 包装，数据在 data.data 中
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data?.reply || data.reply || '抱歉，我现在有点忙，请稍后再试。',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('发送消息失败:', error)

      // 添加错误提示消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。不过你可以试试点击下方的快捷问题，或者浏览应用的各个功能哦！😊',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 处理发送
  const handleSend = () => {
    sendMessage(inputValue)
  }

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 快捷问题
  const quickQuestions = [
    '这个应用有哪些功能？',
    '如何开始使用？',
    '有什么游戏可以玩？',
    '如何创作作品？'
  ]

  const handleQuickQuestion = (question: string) => {
    sendMessage(question)
  }

  return (
    <>
      {/* 悬浮按钮 */}
      {!isOpen && (
        <button className="chatbot-fab" onClick={() => setIsOpen(true)}>
          <div className="fab-icon">🤖</div>
          <div className="fab-pulse"></div>
        </button>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="chatbot-window">
          {/* 窗口头部 */}
          <div className="chatbot-header">
            <div className="header-info">
              <div className="bot-avatar">🤖</div>
              <div className="bot-details">
                <div className="bot-name">AI助手小光</div>
                <div className="bot-status">
                  <span className="status-dot"></span>
                  <span className="status-text">在线</span>
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* 消息列表 */}
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* 加载指示器 */}
            {isLoading && (
              <div className="message message-assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题（仅在没有太多消息时显示） */}
          {messages.length <= 2 && (
            <div className="quick-questions">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {/* 输入区域 */}
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="输入消息..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
            >
              <span className="send-icon">📤</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
