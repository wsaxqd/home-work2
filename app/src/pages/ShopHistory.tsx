import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './ShopHistory.css'

interface ExchangeRecord {
  id: string
  item_name: string
  item_price: number
  quantity: number
  total_price: number
  status: 'completed' | 'used' | 'expired'
  created_at: string
  used_at: string | null
  icon: string
  type: string
}

export default function ShopHistory() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<ExchangeRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchExchangeHistory()
  }, [])

  const fetchExchangeHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/points/shop/exchanges', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRecords(data.data || [])
      }
    } catch (error) {
      console.error('获取兑换记录失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseItem = async (recordId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/points/shop/use/${recordId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        alert('使用成功!')
        fetchExchangeHistory()
      } else {
        const error = await response.json()
        alert(error.message || '使用失败')
      }
    } catch (error) {
      console.error('使用道具失败:', error)
      alert('使用失败,请稍后重试')
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'completed': '未使用',
      'used': '已使用',
      'expired': '已过期'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      'completed': 'status-available',
      'used': 'status-used',
      'expired': 'status-expired'
    }
    return classMap[status] || ''
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-')
  }

  return (
    <Layout>
      <Header
        title="兑换记录"
        gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        showBack={true}
      />
      <div className="main-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p className="empty-text">暂无兑换记录</p>
            <button className="goto-shop-btn" onClick={() => navigate('/shop-mall')}>
              去商城逛逛 →
            </button>
          </div>
        ) : (
          <div className="history-list">
            {records.map((record) => (
              <div key={record.id} className="history-item">
                <div className="item-header">
                  <div className="item-icon">{record.icon || '🎁'}</div>
                  <div className="item-info">
                    <div className="item-name">{record.item_name}</div>
                    <div className="item-meta">
                      <span className="item-quantity">x{record.quantity}</span>
                      <span className="item-separator">•</span>
                      <span className="item-time">{formatDate(record.created_at)}</span>
                    </div>
                  </div>
                  <div className={`item-status ${getStatusClass(record.status)}`}>
                    {getStatusText(record.status)}
                  </div>
                </div>
                <div className="item-footer">
                  <div className="item-price">
                    <span className="price-label">花费积分:</span>
                    <span className="price-value">
                      <span className="price-icon">💎</span>
                      {record.total_price}
                    </span>
                  </div>
                  {record.status === 'completed' && record.type === 'consumable' && (
                    <button
                      className="use-btn"
                      onClick={() => handleUseItem(record.id)}
                    >
                      立即使用
                    </button>
                  )}
                  {record.status === 'used' && record.used_at && (
                    <div className="used-info">
                      使用时间: {formatDate(record.used_at)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
