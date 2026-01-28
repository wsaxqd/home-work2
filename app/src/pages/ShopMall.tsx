import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './ShopMall.css'

interface ShopItem {
  id: string
  name: string
  description: string
  icon: string
  price: number
  category: string
  type: string
  stock: number
  is_hot: boolean
  is_new: boolean
  sold_count: number
}

interface UserPoints {
  current_points: number
  total_earned: number
  level_name: string
  level: number
}

export default function ShopMall() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ShopItem[]>([])
  const [category, setCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [userPoints, setUserPoints] = useState<UserPoints>({
    current_points: 0,
    total_earned: 0,
    level_name: '启蒙新星',
    level: 1
  })
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)

  useEffect(() => {
    fetchUserPoints()
    fetchShopItems()
  }, [category])

  const fetchUserPoints = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/points/info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserPoints(data.data)
      }
    } catch (error) {
      console.error('获取用户积分失败:', error)
    }
  }

  const fetchShopItems = async () => {
    setIsLoading(true)
    try {
      const url = category === 'all'
        ? 'http://localhost:3000/api/points/shop/items'
        : `http://localhost:3000/api/points/shop/items?category=${category}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data.data || [])
      }
    } catch (error) {
      console.error('获取商城商品失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExchange = (item: ShopItem) => {
    if (userPoints.current_points < item.price) {
      alert('积分不足,无法兑换!')
      return
    }
    setSelectedItem(item)
    setShowExchangeModal(true)
  }

  const confirmExchange = async () => {
    if (!selectedItem) return

    try {
      const response = await fetch('http://localhost:3000/api/points/shop/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          itemId: selectedItem.id,
          quantity: 1
        })
      })

      if (response.ok) {
        alert('兑换成功!')
        setShowExchangeModal(false)
        setSelectedItem(null)
        // 刷新数据
        fetchUserPoints()
        fetchShopItems()
      } else {
        const error = await response.json()
        alert(error.message || '兑换失败')
      }
    } catch (error) {
      console.error('兑换商品失败:', error)
      alert('兑换失败,请稍后重试')
    }
  }

  return (
    <Layout>
      <Header
        title="积分商城"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        showBack={true}
      />
      <div className="main-content">
        {/* 用户积分卡片 */}
        <div className="user-points-card">
          <div className="points-header">
            <div className="points-main">
              <div className="points-icon">💎</div>
              <div className="points-info">
                <div className="points-label">我的积分</div>
                <div className="points-value">{userPoints.current_points}</div>
              </div>
            </div>
            <div className="level-badge">
              <span className="level-icon">🌟</span>
              <span className="level-text">{userPoints.level_name}</span>
            </div>
          </div>
          <div className="points-actions">
            <button className="action-btn" onClick={() => navigate('/coins-detail')}>
              <span>积分明细</span>
              <span className="action-arrow">→</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/shop-history')}>
              <span>兑换记录</span>
              <span className="action-arrow">→</span>
            </button>
          </div>
        </div>

        {/* 分类标签 */}
        <div className="category-tabs">
          <button
            className={`category-tab ${category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            <span className="tab-icon">🌈</span>
            <span>全部</span>
          </button>
          <button
            className={`category-tab ${category === 'virtual_item' ? 'active' : ''}`}
            onClick={() => setCategory('virtual_item')}
          >
            <span className="tab-icon">🎁</span>
            <span>虚拟物品</span>
          </button>
          <button
            className={`category-tab ${category === 'reward' ? 'active' : ''}`}
            onClick={() => setCategory('reward')}
          >
            <span className="tab-icon">🏆</span>
            <span>奖励</span>
          </button>
          <button
            className={`category-tab ${category === 'privilege' ? 'active' : ''}`}
            onClick={() => setCategory('privilege')}
          >
            <span className="tab-icon">👑</span>
            <span>特权</span>
          </button>
          <button
            className={`category-tab ${category === 'decoration' ? 'active' : ''}`}
            onClick={() => setCategory('decoration')}
          >
            <span className="tab-icon">✨</span>
            <span>装饰</span>
          </button>
        </div>

        {/* 商品列表 */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <p className="empty-text">暂无商品</p>
          </div>
        ) : (
          <div className="shop-items-grid">
            {items.map((item) => (
              <div key={item.id} className="shop-item-card">
                {item.is_hot && <div className="item-badge hot">🔥 热门</div>}
                {item.is_new && <div className="item-badge new">✨ 新品</div>}
                <div className="item-icon">{item.icon}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-description">{item.description}</div>
                <div className="item-footer">
                  <div className="item-price">
                    <span className="price-icon">💎</span>
                    <span className="price-value">{item.price}</span>
                  </div>
                  <button
                    className={`exchange-btn ${userPoints.current_points >= item.price ? 'can-exchange' : 'cannot-exchange'}`}
                    onClick={() => handleExchange(item)}
                  >
                    {userPoints.current_points >= item.price ? '兑换' : '积分不足'}
                  </button>
                </div>
                {item.stock > 0 && item.stock < 10 && (
                  <div className="item-stock-warning">仅剩 {item.stock} 件</div>
                )}
                <div className="item-sold">已兑换 {item.sold_count} 次</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 兑换确认弹窗 */}
      {showExchangeModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowExchangeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认兑换</h3>
              <button className="modal-close" onClick={() => setShowExchangeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="exchange-item-preview">
                <div className="preview-icon">{selectedItem.icon}</div>
                <div className="preview-name">{selectedItem.name}</div>
                <div className="preview-description">{selectedItem.description}</div>
              </div>
              <div className="exchange-info">
                <div className="info-row">
                  <span className="info-label">兑换价格:</span>
                  <span className="info-value">
                    <span className="price-icon">💎</span>
                    {selectedItem.price}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">当前积分:</span>
                  <span className="info-value">{userPoints.current_points}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">兑换后余额:</span>
                  <span className="info-value highlight">{userPoints.current_points - selectedItem.price}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowExchangeModal(false)}>取消</button>
              <button className="btn-confirm" onClick={confirmExchange}>确认兑换</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
