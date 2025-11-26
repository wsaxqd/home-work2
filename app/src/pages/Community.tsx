import { Layout, Header } from '../components/layout'
import './Community.css'

const posts = [
  { id: 1, avatar: '🦁', name: '小狮子', content: '看看我画的彩虹城堡！🌈🏰', image: '🖼️', likes: 28, comments: 5 },
  { id: 2, avatar: '🐰', name: '小白兔', content: '我创作了一首关于春天的诗！', image: '📜', likes: 42, comments: 8 },
  { id: 3, avatar: '🐼', name: '圆圆', content: '今天学会了用AI写故事，太棒了！', image: '📖', likes: 35, comments: 12 },
  { id: 4, avatar: '🦊', name: '小狐狸', content: '和AI一起创作的音乐🎵', image: '🎵', likes: 56, comments: 15 },
]

const topics = [
  { icon: '🎨', title: '绘画分享', count: 128 },
  { icon: '📖', title: '故事接龙', count: 89 },
  { icon: '🎵', title: '音乐创作', count: 67 },
  { icon: '✍️', title: '诗词学习', count: 45 },
]

export default function Community() {
  return (
    <Layout>
      <Header title="创意社区" gradient="linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)" />
      <div className="main-content">
        <div className="topics-section">
          <div className="section-title">热门话题</div>
          <div className="topics-grid">
            {topics.map((topic) => (
              <div key={topic.title} className="topic-card">
                <div className="topic-icon">{topic.icon}</div>
                <div className="topic-title">{topic.title}</div>
                <div className="topic-count">{topic.count}篇</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-title">最新分享</div>
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-avatar">{post.avatar}</div>
                <div className="post-author">{post.name}</div>
              </div>
              <div className="post-content">{post.content}</div>
              <div className="post-image">{post.image}</div>
              <div className="post-actions">
                <span className="action-item">❤️ {post.likes}</span>
                <span className="action-item">💬 {post.comments}</span>
                <span className="action-item">🔗 分享</span>
              </div>
            </div>
          ))}
        </div>

        <div className="create-post-btn">
          <span>✏️</span>
          发布作品
        </div>
      </div>
    </Layout>
  )
}
