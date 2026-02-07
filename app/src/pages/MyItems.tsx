import { useState, useEffect } from 'react'
import { Layout, Header } from '../components/layout'
import { shopApi } from '../services/api/features'
import './MyItems.css'

interface MyItem {
  id: string
  name: string
  icon: string
  quantity: number
  category: string
  obtainedAt: string
}

export default function MyItems() {
  const [items, setItems] = useState<MyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = ['全部', '道具', '装饰', '工具']

  useEffect(() => {
    loadMyItems()
  }, [])

  const loadMyItems = async () => {
    setLoading(true)
    try {
      const response = await shopApi.getMyItems(activeCategory === 'all' ? undefined : activeCategory)
      setItems(response.data)
    } catch (error) {
      console.error('加载物品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item =>
    activeCategory === 'all' || item.category === activeCategory
  )

  return (
    <Layout>
      <Header title="我的物品" showBack={true} />
      <div className="main-content my-items-page">
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === (cat === '全部' ? 'all' : cat) ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat === '全部' ? 'all' : cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-text">暂无物品</div>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="item-card">
                <div className="item-icon">{item.icon}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-quantity">x{item.quantity}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
