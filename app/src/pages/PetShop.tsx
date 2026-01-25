import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { useToast } from '../components/Toast'
import type { PetItem, ShopData } from '../services/api/pets'
import './PetShop.css'

export default function PetShop() {
  const toast = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [shopData, setShopData] = useState<ShopData | null>(null)
  const [selectedTab, setSelectedTab] = useState<'food' | 'toy' | 'decoration'>('food')
  const [buyingItemId, setBuyingItemId] = useState<number | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PetItem | null>(null)
  const [buyQuantity, setBuyQuantity] = useState(1)

  useEffect(() => {
    loadShop()
  }, [])

  const loadShop = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pets/shop', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setShopData(data.data)
      } else {
        toast.error(data.message || '加载商店失败')
      }
    } catch (error) {
      console.error('加载商店失败:', error)
      toast.error('加载商店失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyClick = (item: PetItem) => {
    setSelectedItem(item)
    setBuyQuantity(1)
    setShowConfirmModal(true)
  }

  const handleConfirmBuy = async () => {
    if (!selectedItem) return

    setBuyingItemId(selectedItem.id)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pets/shop/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: selectedItem.id,
          quantity: buyQuantity
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`购买成功！花费${data.data.totalCost}积分`)
        await loadShop()
        setShowConfirmModal(false)
      } else {
        toast.error(data.message || '购买失败')
      }
    } catch (error) {
      console.error('购买失败:', error)
      toast.error('购买失败，请稍后重试')
    } finally {
      setBuyingItemId(null)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Header title="宠物商店" />
        <div className="shop-loading">加载中...</div>
      </Layout>
    )
  }

  if (!shopData) {
    return (
      <Layout>
        <Header title="宠物商店" />
        <div className="shop-error">加载失败，请刷新重试</div>
      </Layout>
    )
  }

  const filteredItems = shopData.items.filter(item => item.item_type === selectedTab)

  const getEffectIcon = (effectType: string) => {
    switch (effectType) {
      case 'hunger': return '🍖'
      case 'happiness': return '💝'
      case 'energy': return '⚡'
      case 'experience': return '⭐'
      default: return '✨'
    }
  }

  return (
    <Layout>
      <Header title="宠物商店" />
      <div className="pet-shop-container">
        <div className="user-points-card">
          <div className="points-icon">💎</div>
          <div className="points-info">
            <div className="points-label">我的积分</div>
            <div className="points-value">{shopData.userPoints}</div>
          </div>
          <button className="inventory-btn" onClick={() => navigate('/pet-inventory')}>
            <span>背包</span>
            <span className="icon">🎒</span>
          </button>
        </div>

        <div className="shop-tabs">
          <button
            className={`tab-btn ${selectedTab === 'food' ? 'active' : ''}`}
            onClick={() => setSelectedTab('food')}
          >
            <span className="tab-icon">🍎</span>
            <span className="tab-text">食物</span>
          </button>
          <button
            className={`tab-btn ${selectedTab === 'toy' ? 'active' : ''}`}
            onClick={() => setSelectedTab('toy')}
          >
            <span className="tab-icon">🎮</span>
            <span className="tab-text">玩具</span>
          </button>
          <button
            className={`tab-btn ${selectedTab === 'decoration' ? 'active' : ''}`}
            onClick={() => setSelectedTab('decoration')}
          >
            <span className="tab-icon">🎨</span>
            <span className="tab-text">装饰</span>
          </button>
        </div>

        <div className="shop-items-grid">
          {filteredItems.length === 0 ? (
            <div className="shop-empty">
              <div className="empty-icon">📦</div>
              <p>暂无该类型物品</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="shop-item-card">
                <div className="item-emoji">{item.emoji}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-description">{item.description}</div>
                <div className="item-effect">
                  <span className="effect-icon">{getEffectIcon(item.effect_type)}</span>
                  <span className="effect-text">+{item.effect_value}</span>
                </div>
                {item.owned_quantity > 0 && (
                  <div className="owned-badge">拥有 {item.owned_quantity}</div>
                )}
                <div className="item-footer">
                  <div className="item-price">
                    <span className="price-icon">💎</span>
                    <span className="price-value">{item.price}</span>
                  </div>
                  <button
                    className="buy-btn"
                    onClick={() => handleBuyClick(item)}
                    disabled={buyingItemId === item.id || shopData.userPoints < item.price}
                  >
                    {buyingItemId === item.id ? '购买中...' : '购买'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showConfirmModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>确认购买</h3>
                <button className="close-btn" onClick={() => setShowConfirmModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="item-preview">
                  <div className="preview-emoji">{selectedItem.emoji}</div>
                  <div className="preview-name">{selectedItem.name}</div>
                </div>
                <div className="quantity-selector">
                  <span className="quantity-label">购买数量:</span>
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                    >
                      -
                    </button>
                    <span className="quantity-value">{buyQuantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => setBuyQuantity(Math.min(99, buyQuantity + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="total-cost">
                  <span>总价:</span>
                  <span className="cost-value">
                    <span className="cost-icon">💎</span>
                    {selectedItem.price * buyQuantity}
                  </span>
                </div>
                {shopData.userPoints < selectedItem.price * buyQuantity && (
                  <div className="insufficient-notice">积分不足！</div>
                )}
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowConfirmModal(false)}>
                  取消
                </button>
                <button
                  className="confirm-btn"
                  onClick={handleConfirmBuy}
                  disabled={shopData.userPoints < selectedItem.price * buyQuantity || buyingItemId !== null}
                >
                  {buyingItemId !== null ? '购买中...' : '确认购买'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
