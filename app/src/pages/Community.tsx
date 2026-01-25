import { useState, useEffect } from 'react'
import { Layout, Header } from '../components/layout'
import { communityApi } from '../services/api'
import { favoritesApi } from '../services/api/favorites'
import type { Post, Topic } from '../types'
import { useToast } from '../components/Toast'
import './Community.css'

export default function Community() {
  const toast = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [postsResponse, topicsResponse] = await Promise.all([
        communityApi.getPosts({ page: 1, limit: 10 }),
        communityApi.getTopics()
      ])

      if (postsResponse.success && postsResponse.data) {
        setPosts(postsResponse.data.data || [])
      }

      if (topicsResponse.success && topicsResponse.data) {
        setTopics(topicsResponse.data)
      }
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const response = await communityApi.likePost(postId)
      if (response.success) {
        loadData()
      }
    } catch (err) {
      console.error('点赞失败', err)
    }
  }

  const handleFavorite = async (post: Post) => {
    try {
      await favoritesApi.addFavorite({
        itemType: 'story',
        itemId: post.id,
        itemTitle: (post as any).title || '社区帖子',
        itemContent: post.content.substring(0, 200),
      })
      toast.success('收藏成功!')
    } catch (err: any) {
      console.error('收藏失败', err)
      toast.info(err.message || '收藏失败，请重试')
    }
  }
  if (loading) {
    return (
      <Layout>
        <Header title="创意社区" gradient="linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)" />
        <div className="main-content" style={{ textAlign: 'center', padding: '40px' }}>
          <div>加载中...</div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Header title="创意社区" gradient="linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)" />
        <div className="main-content" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>
          <button className="btn btn-primary" onClick={loadData}>重试</button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Header title="创意社区" gradient="linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)" />
      <div className="main-content">
        {topics.length > 0 && (
          <div className="topics-section">
            <div className="section-title">热门话题</div>
            <div className="topics-grid">
              {topics.map((topic) => (
                <div key={topic.id} className="topic-card">
                  <div className="topic-icon">{topic.icon}</div>
                  <div className="topic-title">{topic.title}</div>
                  <div className="topic-count">{topic.postCount}篇</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section-title">最新分享</div>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无动态，快来发布第一条吧！
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-avatar">{post.user?.avatar || '👤'}</div>
                  <div className="post-author">{post.user?.nickname || post.user?.username || '匿名用户'}</div>
                </div>
                <div className="post-content">{post.content}</div>
                {post.images && post.images.length > 0 && (
                  <div className="post-image">
                    {post.images.map((img, idx) => (
                      <img key={idx} src={img} alt="post" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }} />
                    ))}
                  </div>
                )}
                <div className="post-actions">
                  <span
                    className="action-item"
                    onClick={() => handleLike(post.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {post.isLiked ? '❤️' : '🤍'} {post.likeCount}
                  </span>
                  <span className="action-item">💬 {post.commentCount}</span>
                  <span className="action-item">🔗 分享</span>
                  <span
                    className="action-item"
                    onClick={() => handleFavorite(post)}
                    style={{ cursor: 'pointer' }}
                  >
                    ⭐ 收藏
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="create-post-btn">
          <span>✏️</span>
          发布作品
        </div>
      </div>
    </Layout>
  )
}
