import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { useToast } from '../components/Toast'
import type { PetItem } from '../services/api/pets'
import './PetInventory.css'

export default function PetInventory() {
  const toast = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<PetItem[]>([])
  const [selectedItem, setSelectedItem] = useState<PetItem | null>(null)
  const [useQuantity, setUseQuantity] = useState(1)
  const [usingItemId, setUsingItemId] = useState<number | null>(null)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pets/shop', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        const ownedItems = data.data.items.filter((item: PetItem) => item.owned_quantity > 0)
        setInventory(ownedItems)
      } else {
        toast.error(data.message || '加载库存失败')
      }
    } catch (error) {
      console.error('加载库存失败:', error)
      toast.error('加载库存失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleUseItem = async (item: PetItem) => {
    setUsingItemId(item.id)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/pets/use-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: item.id,
          quantity: 1
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`使用${item.name}成功！${data.message || ''}`)
        await loadInventory()
        setSelectedItem(null)
      } else {
        toast.error(data.message || '使用失败')
      }
    } catch (error) {
      console.error('使用物品失败:', error)
      toast.error('使用失败，请稍后重试')
    } finally {
      setUsingItemId(null)
    }
  }

  const getEffectIcon = (effectType: string) => {
    switch (effectType) {
      case 'hunger': return '🍖'
      case 'happiness': return '💝'
      case 'energy': return '⚡'
      case 'experience': return '⭐'
      default: return '✨'
    }
  }

  if (loading) {
    return (
      <Layout>
        <Header title="我的背包" />
        <div className="inventory-loading">加载中...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Header title="我的背包" />
      <div className="pet-inventory-container">
        <div className="inventory-actions">
          <button className="back-shop-btn" onClick={() => navigate('/pet-shop')}>
            <span className="icon">🛍️</span>
            <span>返回商店</span>
          </button>
        </div>

        {inventory.length === 0 ? (
          <div className="inventory-empty">
            <div className="empty-icon">🎒</div>
            <p>背包空空如也</p>
            <button className="go-shop-btn" onClick={() => navigate('/pet-shop')}>
              去商店逛逛
            </button>
          </div>
        ) : (
          <div className="inventory-grid">
            {inventory.map(item => (
              <div key={item.id} className="inventory-item-card">
                <div className="item-quantity-badge">{item.owned_quantity}</div>
                <div className="item-emoji">{item.emoji}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-description">{item.description}</div>
                <div className="item-effect">
                  <span className="effect-icon">{getEffectIcon(item.effect_type)}</span>
                  <span className="effect-text">+{item.effect_value}</span>
                </div>
                <button
                  className="use-btn"
                  onClick={() => handleUseItem(item)}
                  disabled={usingItemId === item.id}
                >
                  {usingItemId === item.id ? '使用中...' : '使用'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
