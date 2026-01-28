import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Messages.css'

interface Message {
  id: string
  type: 'system' | 'achievement' | 'social' | 'reminder'
  title: string
  content: string
  isRead: boolean
  createdAt: string
  icon?: string
  actionUrl?: string
}

export default function Messages() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [isLoading, setIsLoading] = useState(true)

  // 消息类型配置
  const messageTypeConfig = {
    system: { icon: '📢', color: '#667eea', label: '系统消息' },
    achievement: { icon: '🏆', color: '#fdcb6e', label: '成就通知' },
    social: { icon: '👥', color: '#fd79a8', label: '社交消息' },
    reminder: { icon: '⏰', color: '#00b894', label: '提醒' }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/messages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.data || [])
      }
    } catch (error) {
      console.error('获取消息失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`http://localhost:3000/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      setMessages(messages.map(msg =>
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ))
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('http://localhost:3000/api/messages/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      setMessages(messages.map(msg => ({ ...msg, isRead: true })))
    } catch (error) {
      console.error('全部标记已读失败:', error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      await fetch(`http://localhost:3000/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      setMessages(messages.filter(msg => msg.id !== messageId))
    } catch (error) {
      console.error('删除消息失败:', error)
    }
  }

  const handleMessageClick = (message: Message) => {
    if (!message.isRead) {
      markAsRead(message.id)
    }

    if (message.actionUrl) {
      navigate(message.actionUrl)
    }
  }

  const filteredMessages = activeTab === 'unread'
    ? messages.filter(msg => !msg.isRead)
    : messages

  const unreadCount = messages.filter(msg => !msg.isRead).length

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`

    return date.toLocaleDateString('zh-CN')
  }

  return (
    <Layout>
      <Header
        title="消息中心"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        showBack={true}
      />
      <div className="main-content">
        {/* 标签页切换 */}
        <div className="message-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            全部消息
            {messages.length > 0 && (
              <span className="tab-count">{messages.length}</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            未读消息
            {unreadCount > 0 && (
              <span className="tab-count unread">{unreadCount}</span>
            )}
          </button>
        </div>

        {/* 操作按钮 */}
        {unreadCount > 0 && (
          <div className="message-actions">
            <button className="action-btn" onClick={markAllAsRead}>
              <span className="action-icon">✓</span>
              全部标记已读
            </button>
          </div>
        )}

        {/* 消息列表 */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p className="empty-text">
              {activeTab === 'unread' ? '暂无未读消息' : '暂无消息'}
            </p>
          </div>
        ) : (
          <div className="messages-list">
            {filteredMessages.map((message) => {
              const config = messageTypeConfig[message.type]
              return (
                <div
                  key={message.id}
                  className={`message-item ${!message.isRead ? 'unread' : ''}`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="message-icon" style={{ background: config.color }}>
                    {message.icon || config.icon}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-type">{config.label}</span>
                      <span className="message-time">{formatTime(message.createdAt)}</span>
                    </div>
                    <h3 className="message-title">{message.title}</h3>
                    <p className="message-text">{message.content}</p>
                  </div>
                  {!message.isRead && <div className="unread-dot"></div>}
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMessage(message.id)
                    }}
                  >
                    🗑️
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
