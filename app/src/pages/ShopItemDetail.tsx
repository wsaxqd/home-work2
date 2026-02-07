import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './ShopItemDetail.css'

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  image: string
  tags: string[]
}

export default function ShopItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<ShopItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    loadItemDetail()
  }, [id])

  const loadItemDetail = async () => {
    setLoading(true)
    try {
      // TODO: 调用API获取商品详情
      // const response = await shopApi.getItemDetail(id)

      // 模拟数据
      const mockItem: ShopItem = {
        id: id || '1',
        name: '学习加速卡',
        description: '使用后可获得2倍学习经验加成,持续24小时。适合想要快速提升等级的学习者使用。',
        price: 500,
        stock: 99,
        category: '道具',
        image: '🎴',
        tags: ['热门', '限时']
      }

      setItem(mockItem)
    } catch (error) {
      console.error('加载商品详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!item) return

    setPurchasing(true)
    try {
      // TODO: 调用购买API
      // await shopApi.purchaseItem(item.id)

      alert('购买成功!')
      navigate('/shop-mall')
    } catch (error) {
      alert('购买失败,请重试')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Header title="商品详情" showBack={true} />
        <div className="main-content" style={{ textAlign: 'center', padding: '40px' }}>
          <div>加载中...</div>
        </div>
      </Layout>
    )
  }

  if (!item) {
    return (
      <Layout>
        <Header title="商品详情" showBack={true} />
        <div className="main-content" style={{ textAlign: 'center', padding: '40px' }}>
          <div>商品不存在</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Header title="商品详情" showBack={true} />

      <div className="main-content shop-item-detail-page">
        <div className="item-image-section">
          <div className="item-image">{item.image}</div>
          {item.tags.length > 0 && (
            <div className="item-tags">
              {item.tags.map((tag, index) => (
                <span key={index} className="item-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="item-info-section">
          <h1 className="item-name">{item.name}</h1>
          <div className="item-category">{item.category}</div>

          <div className="item-price-box">
            <div className="price-label">价格</div>
            <div className="price-value">
              <span className="price-icon">💰</span>
              <span className="price-amount">{item.price}</span>
              <span className="price-unit">积分</span>
            </div>
          </div>

          <div className="item-stock">
            库存: <span className={item.stock > 0 ? 'in-stock' : 'out-of-stock'}>
              {item.stock > 0 ? `${item.stock}件` : '已售罄'}
            </span>
          </div>
        </div>

        <div className="item-description-section">
          <h3 className="section-title">商品介绍</h3>
          <p className="item-description">{item.description}</p>
        </div>

        <div className="purchase-section">
          <button
            className="purchase-button"
            onClick={handlePurchase}
            disabled={purchasing || item.stock === 0}
          >
            {purchasing ? '购买中...' : item.stock === 0 ? '已售罄' : '立即购买'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
