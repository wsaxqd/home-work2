import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { favoritesApi } from '../services/api/favorites'
import './Favorites.css'

interface Favorite {
  id: string
  itemType: string
  itemId: string
  itemTitle: string
  itemContent?: string
  itemThumbnail?: string
  createdAt: string
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  story: '故事',
  poem: '诗歌',
  music: '音乐',
  art: '绘画',
  picture_book: '绘本'
}

export default function Favorites() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    loadFavorites()
  }, [selectedType])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const params = selectedType !== 'all' ? { itemType: selectedType } : {}
      const response = await favoritesApi.getFavorites(params)
      setFavorites(response.items)
    } catch (error) {
      console.error('加载收藏失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (favoriteId: string) => {
    if (!confirm('确定要取消收藏吗？')) return

    try {
      await favoritesApi.removeFavorite(favoriteId)
      setFavorites(favorites.filter(f => f.id !== favoriteId))
    } catch (error) {
      console.error('取消收藏失败:', error)
      alert('取消收藏失败，请稍后重试')
    }
  }

  return (
    <Layout>
      <Header title="我的收藏" gradient="linear-gradient(135deg, #fdcb6e 0%, #ffeaa7 100%)" />
      <div className="favorites-container">
        {/* 类型筛选 */}
        <div className="type-filter">
          <button
            className={`filter-btn ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            全部
          </button>
          {Object.entries(ITEM_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              className={`filter-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 收藏列表 */}
        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : favorites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">❤️</div>
            <h2 className="empty-title">还没有收藏</h2>
            <p className="empty-text">快去收藏你喜欢的作品吧！</p>
            <button className="back-btn" onClick={() => navigate('/home')}>
              返回首页
            </button>
          </div>
        ) : (
          <div className="favorites-grid">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="favorite-card">
                <div className="card-type">{ITEM_TYPE_LABELS[favorite.itemType]}</div>
                <h3 className="card-title">{favorite.itemTitle}</h3>
                {favorite.itemContent && (
                  <p className="card-content">{favorite.itemContent.substring(0, 100)}...</p>
                )}
                <div className="card-footer">
                  <span className="card-date">
                    {new Date(favorite.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveFavorite(favorite.id)}
                  >
                    取消收藏
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
