import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { wishesApi } from '../services/api/wishes'
import './WishTree.css'

interface Wish {
  id: string
  content: string
  category: 'study' | 'toy' | 'family' | 'friend' | 'other'
  date: Date
  status: 'pending' | 'fulfilled'
  fulfilledDate?: Date
}

const WISH_CATEGORIES = [
  { id: 'study', label: '学习愿望', icon: '📚', color: '#667eea' },
  { id: 'toy', label: '玩具愿望', icon: '🎁', color: '#f093fb' },
  { id: 'family', label: '家人愿望', icon: '❤️', color: '#fa709a' },
  { id: 'friend', label: '朋友愿望', icon: '🤝', color: '#43e97b' },
  { id: 'other', label: '其他愿望', icon: '✨', color: '#ffd93d' }
]

export default function WishTree() {
  const navigate = useNavigate()
  const [wishes, setWishes] = useState<Wish[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newWish, setNewWish] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  // 加载心愿
  useEffect(() => {
    loadWishes()
  }, [])

  const loadWishes = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await wishesApi.getWishes()
      const wishList: Wish[] = (response.data?.items || []).map((wish: any) => ({
        id: wish.id,
        content: wish.content,
        category: wish.category,
        date: new Date(wish.createdAt),
        status: wish.status,
        fulfilledDate: wish.fulfilledAt ? new Date(wish.fulfilledAt) : undefined
      }))
      setWishes(wishList)
    } catch (err: any) {
      console.error('加载心愿失败:', err)
      setError('加载心愿失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 添加心愿
  const handleAddWish = async () => {
    if (!newWish.trim() || !selectedCategory) {
      alert('请填写心愿内容并选择类型')
      return
    }

    setSaving(true)
    setError('')

    try {
      const createdWish = await wishesApi.createWish({
        content: newWish.trim(),
        category: selectedCategory
      })

      const wish: Wish = {
        id: createdWish.data?.id || '',
        content: createdWish.data?.content || newWish.trim(),
        category: createdWish.data?.category as any,
        date: new Date(createdWish.data?.createdAt || new Date()),
        status: createdWish.data?.status as any,
        fulfilledDate: createdWish.data?.fulfilledAt ? new Date(createdWish.data.fulfilledAt) : undefined
      }

      setWishes([wish, ...wishes])
      setNewWish('')
      setSelectedCategory('')
      setShowAddModal(false)
    } catch (err: any) {
      console.error('添加心愿失败:', err)
      setError('添加心愿失败，请稍后重试')
      alert('添加心愿失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  // 实现心愿
  const handleFulfillWish = async (wishId: string) => {
    try {
      await wishesApi.fulfillWish(wishId)

      const updatedWishes = wishes.map(w =>
        w.id === wishId
          ? { ...w, status: 'fulfilled' as const, fulfilledDate: new Date() }
          : w
      )
      setWishes(updatedWishes)
    } catch (err: any) {
      console.error('更新心愿失败:', err)
      alert('更新心愿失败，请稍后重试')
    }
  }

  const pendingWishes = wishes.filter(w => w.status === 'pending')
  const fulfilledWishes = wishes.filter(w => w.status === 'fulfilled')

  return (
    <Layout>
      <Header
        title="心愿树"
        gradient="linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)"
        rightContent={
          <button
            className="header-action-btn"
            onClick={() => setShowAddModal(true)}
          >
            + 许愿
          </button>
        }
      />
      <div className="wish-tree-container">
        {/* 心愿树插画 */}
        <div className="tree-illustration">
        <div className="tree-trunk">🌳</div>
        <div className="tree-text">在这里许下你的心愿吧</div>
        <div className="wish-count">
          {pendingWishes.length} 个心愿等待实现
        </div>
      </div>

      {/* 待实现的心愿 */}
      {pendingWishes.length > 0 && (
        <div className="wishes-section">
          <h3 className="section-title">🌟 我的心愿</h3>
          <div className="wishes-grid">
            {pendingWishes.map((wish) => {
              const category = WISH_CATEGORIES.find(c => c.id === wish.category)
              return (
                <div key={wish.id} className="wish-card pending">
                  <div className="wish-category" style={{ background: category?.color }}>
                    <span className="category-icon">{category?.icon}</span>
                    <span className="category-label">{category?.label}</span>
                  </div>
                  <div className="wish-content">{wish.content}</div>
                  <div className="wish-footer">
                    <span className="wish-date">
                      {wish.date.toLocaleDateString('zh-CN')}
                    </span>
                    <button
                      className="fulfill-btn"
                      onClick={() => handleFulfillWish(wish.id)}
                    >
                      ✓ 实现了
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 已实现的心愿 */}
      {fulfilledWishes.length > 0 && (
        <div className="wishes-section">
          <h3 className="section-title">🎉 已实现的心愿</h3>
          <div className="wishes-grid">
            {fulfilledWishes.map((wish) => {
              const category = WISH_CATEGORIES.find(c => c.id === wish.category)
              return (
                <div key={wish.id} className="wish-card fulfilled">
                  <div className="wish-category" style={{ background: category?.color }}>
                    <span className="category-icon">{category?.icon}</span>
                    <span className="category-label">{category?.label}</span>
                  </div>
                  <div className="wish-content">{wish.content}</div>
                  <div className="wish-footer">
                    <span className="wish-date fulfilled-date">
                      ✓ {wish.fulfilledDate?.toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {wishes.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🌟</div>
          <p className="empty-text">还没有心愿哦</p>
          <p className="empty-hint">点击右上角"许愿"按钮，写下你的心愿吧！</p>
        </div>
      )}

      {/* 添加心愿弹窗 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-wish-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">✨ 许下你的心愿</h3>

            <div className="modal-section">
              <label className="modal-label">选择类型</label>
              <div className="category-grid">
                {WISH_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={`category-btn ${selectedCategory === cat.id ? 'selected' : ''}`}
                    style={{
                      background: selectedCategory === cat.id ? cat.color : '#f7fafc',
                      color: selectedCategory === cat.id ? 'white' : '#333'
                    }}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-label">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-section">
              <label className="modal-label">写下你的心愿</label>
              <textarea
                className="wish-textarea"
                placeholder="例如：我想要一本新的故事书&#10;我希望爸爸妈妈早点回家&#10;我想学会画画..."
                value={newWish}
                onChange={(e) => setNewWish(e.target.value)}
                rows={4}
              />
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                取消
              </button>
              <button className="confirm-btn" onClick={handleAddWish}>
                许愿 🌟
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}
