import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { worksApi } from '../services/api/works'
import { communityApi } from '../services/api'
import type { Work } from '../types'
import './MyWorks.css'
import { useToast } from '../components/Toast'

const WORK_TYPES = [
  { value: 'all', label: '全部作品', icon: '📁', color: '#667eea' },
  { value: 'story', label: '故事', icon: '📖', color: '#f093fb' },
  { value: 'poem', label: '诗歌', icon: '✍️', color: '#764ba2' },
  { value: 'art', label: '绘画', icon: '🎨', color: '#ff6b6b' },
  { value: 'music', label: '音乐', icon: '🎵', color: '#4ecdc4' }
]

export default function MyWorks() {
  const toast = useToast()
  const navigate = useNavigate()
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showWorkDetail, setShowWorkDetail] = useState<Work | null>(null)

  useEffect(() => {
    loadWorks()
  }, [selectedType])

  const loadWorks = async () => {
    setLoading(true)
    setError('')

    try {
      const params = selectedType === 'all' ? {} : { type: selectedType }
      const response = await worksApi.getMyWorks(params)

      if (response.success && response.data) {
        setWorks(response.data.data || [])
      }
    } catch (err: any) {
      setError(err.message || '加载失败')
      console.error('加载作品失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (workId: string) => {
    try {
      const response = await worksApi.deleteWork(workId)
      if (response.success) {
        setWorks(works.filter(w => w.id !== workId))
        setShowDeleteConfirm(null)
        toast.success('删除成功!')
      }
    } catch (err: any) {
      console.error('删除失败:', err)
      toast.info(err.message || '删除失败，请重试')
    }
  }

  const handleShare = async (work: Work) => {
    try {
      // 如果作品未公开，先更新为公开
      if (!work.isPublic) {
        await worksApi.updateWork(work.id, { isPublic: true })
      }

      // 分享到社区(创建帖子)
      const postContent = `分享我的${getWorkTypeLabel(work.type)}: ${work.title}\n\n${work.content.substring(0, 200)}...`

      await communityApi.createPost(
        postContent,
        work.coverImage ? [work.coverImage] : undefined
      )

      toast.success('分享到社区成功!')
      loadWorks() // 重新加载以更新公开状态
    } catch (err: any) {
      console.error('分享失败:', err)
      toast.info(err.message || '分享失败，请重试')
    }
  }

  const handleEdit = (work: Work) => {
    // 跳转到对应的创作页面
    const editPaths: Record<string, string> = {
      story: '/story-creator',
      poem: '/poem-creator',
      art: '/art-creator',
      music: '/music-creator'
    }
    navigate(editPaths[work.type] || '/create', { state: { editWork: work } })
  }

  const getWorkTypeLabel = (type: string) => {
    return WORK_TYPES.find(t => t.value === type)?.label || '作品'
  }

  const getWorkTypeIcon = (type: string) => {
    return WORK_TYPES.find(t => t.value === type)?.icon || '📁'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  if (loading) {
    return (
      <Layout>
        <Header title="我的作品" gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />
        <div className="myworks-loading">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Header title="我的作品" gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />
        <div className="myworks-error">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <button className="retry-btn" onClick={loadWorks}>重试</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Header title="我的作品" gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />

      <div className="myworks-container">
        {/* 类型筛选 */}
        <div className="works-filters">
          {WORK_TYPES.map((type) => (
            <button
              key={type.value}
              className={`filter-btn ${selectedType === type.value ? 'active' : ''}`}
              onClick={() => setSelectedType(type.value)}
              style={{
                borderColor: selectedType === type.value ? type.color : undefined,
                background: selectedType === type.value
                  ? `linear-gradient(135deg, ${type.color}22 0%, ${type.color}11 100%)`
                  : undefined
              }}
            >
              <span className="filter-icon">{type.icon}</span>
              <span className="filter-label">{type.label}</span>
            </button>
          ))}
        </div>

        {/* 作品统计 */}
        <div className="works-stats">
          <div className="stat-item">
            <span className="stat-value">{works.length}</span>
            <span className="stat-label">作品总数</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{works.filter(w => w.isPublic).length}</span>
            <span className="stat-label">已发布</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{works.reduce((sum, w) => sum + w.likeCount, 0)}</span>
            <span className="stat-label">获赞总数</span>
          </div>
        </div>

        {/* 作品列表 */}
        {works.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>还没有作品</h3>
            <p>快去创作你的第一个作品吧!</p>
            <button className="create-btn" onClick={() => navigate('/create')}>
              <span className="btn-icon">✨</span>
              开始创作
            </button>
          </div>
        ) : (
          <div className="works-grid">
            {works.map((work) => (
              <div key={work.id} className="work-card">
                {/* 作品封面 */}
                <div
                  className="work-cover"
                  onClick={() => setShowWorkDetail(work)}
                  style={{
                    backgroundImage: work.coverImage ? `url(${work.coverImage})` : undefined
                  }}
                >
                  {!work.coverImage && (
                    <div className="work-type-icon">{getWorkTypeIcon(work.type)}</div>
                  )}
                  <div className="work-type-badge">{getWorkTypeLabel(work.type)}</div>
                  {!work.isPublic && (
                    <div className="draft-badge">草稿</div>
                  )}
                </div>

                {/* 作品信息 */}
                <div className="work-info">
                  <h3 className="work-title" onClick={() => setShowWorkDetail(work)}>
                    {work.title}
                  </h3>
                  <p className="work-content-preview">
                    {work.content.substring(0, 100)}
                    {work.content.length > 100 && '...'}
                  </p>

                  <div className="work-meta">
                    <span className="meta-item">
                      <span className="icon">📅</span>
                      {formatDate(work.createdAt)}
                    </span>
                    <span className="meta-item">
                      <span className="icon">❤️</span>
                      {work.likeCount}
                    </span>
                    <span className="meta-item">
                      <span className="icon">💬</span>
                      {work.commentCount}
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="work-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => setShowWorkDetail(work)}
                      title="查看详情"
                    >
                      <span className="icon">👁️</span>
                      查看
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEdit(work)}
                      title="编辑作品"
                    >
                      <span className="icon">✏️</span>
                      编辑
                    </button>
                    <button
                      className="action-btn share-btn"
                      onClick={() => handleShare(work)}
                      title="分享到社区"
                    >
                      <span className="icon">🔗</span>
                      分享
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => setShowDeleteConfirm(work.id)}
                      title="删除作品"
                    >
                      <span className="icon">🗑️</span>
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 浮动创作按钮 */}
        <button className="floating-create-btn" onClick={() => navigate('/create')}>
          <span className="icon">✨</span>
          创作新作品
        </button>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h3>确认删除</h3>
            <p>删除后无法恢复，确定要删除这个作品吗？</p>
            <div className="modal-actions">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                取消
              </button>
              <button
                className="modal-btn confirm-btn"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 作品详情对话框 */}
      {showWorkDetail && (
        <div className="modal-overlay" onClick={() => setShowWorkDetail(null)}>
          <div className="work-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowWorkDetail(null)}>×</button>

            <div className="detail-header">
              <span className="detail-type-badge">
                {getWorkTypeIcon(showWorkDetail.type)} {getWorkTypeLabel(showWorkDetail.type)}
              </span>
              {!showWorkDetail.isPublic && (
                <span className="detail-draft-badge">草稿</span>
              )}
            </div>

            <h2 className="detail-title">{showWorkDetail.title}</h2>

            {showWorkDetail.coverImage && (
              <img
                src={showWorkDetail.coverImage}
                alt={showWorkDetail.title}
                className="detail-cover"
              />
            )}

            <div className="detail-content">{showWorkDetail.content}</div>

            {showWorkDetail.tags && showWorkDetail.tags.length > 0 && (
              <div className="detail-tags">
                {showWorkDetail.tags.map((tag, index) => (
                  <span key={index} className="detail-tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="detail-meta">
              <span>创建时间: {formatDate(showWorkDetail.createdAt)}</span>
              <span>点赞: {showWorkDetail.likeCount}</span>
              <span>评论: {showWorkDetail.commentCount}</span>
              <span>浏览: {showWorkDetail.viewCount}</span>
            </div>

            <div className="detail-actions">
              <button className="detail-action-btn" onClick={() => handleEdit(showWorkDetail)}>
                ✏️ 编辑
              </button>
              <button className="detail-action-btn" onClick={() => handleShare(showWorkDetail)}>
                🔗 分享
              </button>
              <button
                className="detail-action-btn delete"
                onClick={() => {
                  setShowWorkDetail(null)
                  setShowDeleteConfirm(showWorkDetail.id)
                }}
              >
                🗑️ 删除
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
