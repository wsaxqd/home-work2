import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { aiApi, type ChatMessage } from '../services/api/ai'
import './AICompanion.css'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  emotion?: 'happy' | 'sad' | 'angry' | 'worried' | 'excited'
}

const AI_COMPANIONS = [
  { id: 'sister', name: '小雨姐姐', avatar: '👧', desc: '温柔体贴的大姐姐' },
  { id: 'brother', name: '阳光哥哥', avatar: '👦', desc: '活泼开朗的大哥哥' },
  { id: 'grandma', name: '慈祥奶奶', avatar: '👵', desc: '和蔼可亲的奶奶' },
  { id: 'teacher', name: '智慧老师', avatar: '👨‍🏫', desc: '博学多才的老师' }
]

const QUICK_TOPICS = [
  { text: '今天发生了什么有趣的事', icon: '😊' },
  { text: '我有点不开心', icon: '😢' },
  { text: '给我讲个故事吧', icon: '📖' },
  { text: '我想聊聊学习', icon: '📚' },
  { text: '我有个小秘密', icon: '🤫' },
  { text: '我想念爸爸妈妈', icon: '🏠' }
]

export default function AICompanion() {
  const navigate = useNavigate()
  const [selectedCompanion, setSelectedCompanion] = useState(AI_COMPANIONS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showCompanionSelect, setShowCompanionSelect] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 初始欢迎消息
  useEffect(() => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `你好呀！我是${selectedCompanion.name}，很高兴认识你！有什么想和我聊的吗？😊`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [selectedCompanion])

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputText
    setInputText('')
    setIsTyping(true)
    setError('')

    try {
      // 构建对话历史
      const newHistory: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: currentInput }
      ]

      // 添加系统提示，让AI扮演选中的陪伴者角色
      const systemPrompt: ChatMessage = {
        role: 'system',
        content: `你是${selectedCompanion.name}，${selectedCompanion.desc}。你正在和一个留守儿童聊天，请用温暖、关怀、鼓励的语气回复。回复要简短、易懂、充满爱心。`
      }

      // 调用AI API
      const response = await aiApi.chat({
        messages: [systemPrompt, ...newHistory],
        context: { companionId: selectedCompanion.id }
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

      // 更新对话历史
      setConversationHistory([
        ...newHistory,
        { role: 'assistant', content: response.response }
      ])
    } catch (err: any) {
      console.error('AI对话失败:', err)
      setError('抱歉，我现在有点累了，请稍后再试试吧~')

      // 显示错误提示消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '抱歉，我现在有点累了，请稍后再试试吧~ 😔',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }


  // 快速话题点击
  const handleQuickTopic = (topic: string) => {
    setInputText(topic)
  }

  return (
    <Layout>
      <Header
        title={selectedCompanion.name}
        gradient="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
      />
      <div className="ai-companion-container">
        {/* 陪伴者信息栏 */}
        <div className="companion-info-bar" onClick={() => setShowCompanionSelect(true)}>
          <span className="companion-avatar">{selectedCompanion.avatar}</span>
          <div className="companion-details">
            <div className="companion-name">{selectedCompanion.name}</div>
            <div className="companion-status">在线 · 随时陪你聊天</div>
          </div>
          <span className="change-icon">切换</span>
        </div>

      {/* 聊天消息区域 */}
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            {message.type === 'ai' && (
              <div className="message-avatar">{selectedCompanion.avatar}</div>
            )}
            <div className="message-content">
              <div className="message-bubble">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            {message.type === 'user' && (
              <div className="message-avatar">👤</div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="message ai">
            <div className="message-avatar">{selectedCompanion.avatar}</div>
            <div className="message-content">
              <div className="message-bubble typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 快速话题 */}
      {messages.length <= 1 && (
        <div className="quick-topics">
          <div className="quick-topics-title">你可以和我聊：</div>
          <div className="quick-topics-grid">
            {QUICK_TOPICS.map((topic, index) => (
              <button
                key={index}
                className="quick-topic-btn"
                onClick={() => handleQuickTopic(topic.text)}
              >
                <span className="topic-icon">{topic.icon}</span>
                <span className="topic-text">{topic.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="input-container">
        <input
          type="text"
          className="message-input"
          placeholder="说说你的想法..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
        >
          发送
        </button>
      </div>

      {/* 陪伴者选择弹窗 */}
      {showCompanionSelect && (
        <div className="modal-overlay" onClick={() => setShowCompanionSelect(false)}>
          <div className="companion-select-modal" onClick={(e) => e.stopPropagation()}>
            <h3>选择你的AI小伙伴</h3>
            <div className="companions-grid">
              {AI_COMPANIONS.map((companion) => (
                <div
                  key={companion.id}
                  className={`companion-card ${selectedCompanion.id === companion.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCompanion(companion)
                    setShowCompanionSelect(false)
                  }}
                >
                  <div className="companion-card-avatar">{companion.avatar}</div>
                  <div className="companion-card-name">{companion.name}</div>
                  <div className="companion-card-desc">{companion.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}
