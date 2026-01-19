import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './Explore.css'

interface RecommendedWork {
  id: number
  title: string
  author: string
  type: string
  thumbnail?: string
  likes: number
}

interface Challenge {
  id: number
  title: string
  icon: string
  reward: number
  badge: string
  path: string
}

const categories = [
  { icon: '🎮', title: 'AI游戏', items: [
    { icon: '😊', name: '表情模仿秀', path: '/expression-game' },
    { icon: '🔍', name: '猜猜我是谁', path: '/image-recognition-game' },
    { icon: '🍎', name: '水果连连看', path: '/fruit-match' },
    { icon: '🧩', name: '拼图游戏', path: '/jigsaw-puzzle' },
  ]},
  { icon: '🎨', title: '创意工坊', items: [
    { icon: '🖼️', name: 'AI绘画', path: '/art-creator' },
    { icon: '🎵', name: 'AI音乐', path: '/music-creator' },
    { icon: '📖', name: 'AI故事', path: '/story-creator' },
    { icon: '✍️', name: 'AI诗词', path: '/poem-creator' },
  ]},
  { icon: '📚', title: '阅读天地', items: [
    { icon: '📕', name: '故事图书馆', path: '/story-library' },
    { icon: '📘', name: '绘本阅读', path: '/picture-book' },
    { icon: '📗', name: '四大名著', path: '/four-classics' },
    { icon: '🎶', name: '儿歌童谣', path: '/children-songs' },
  ]},
  { icon: '💝', title: '情感成长', items: [
    { icon: '🌸', name: '心灵花园', path: '/mind-garden' },
    { icon: '📊', name: '能力评估', path: '/assessment' },
    { icon: '🏠', name: '温暖小屋', path: '/warm-house' },
  ]},
]

export default function Explore() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [recommendedWorks, setRecommendedWorks] = useState<RecommendedWork[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: 1, title: '表情大挑战', icon: '🎯', reward: 50, badge: '每日挑战', path: '/expression-game' },
    { id: 2, title: '画出你的梦想', icon: '🎨', reward: 30, badge: '创意任务', path: '/art-creator' },
    { id: 3, title: '诗词小达人', icon: '✍️', reward: 40, badge: '学习任务', path: '/poem-creator' },
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      // 从API获取推荐内容
      const response = await fetch('/api/recommendations/explore', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRecommendedWorks(data.works || [])
        if (data.challenges) {
          setChallenges(data.challenges)
        }
      }
    } catch (error) {
      console.error('加载推荐内容失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleWorkClick = (workId: number) => {
    navigate(`/works/${workId}`)
  }

  return (
    <Layout>
      <Header title="探索发现" gradient="linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)" />
      <div className="main-content">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索你感兴趣的内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* 分类导航 */}
        {categories.map((category) => (
          <div key={category.title} className="explore-category">
            <div className="category-header">
              <span className="category-icon">{category.icon}</span>
              <span className="category-title">{category.title}</span>
            </div>
            <div className="category-items">
              {category.items.map((item) => (
                <div
                  key={item.path}
                  className="explore-item"
                  onClick={() => navigate(item.path)}
                >
                  <div className="item-icon">{item.icon}</div>
                  <div className="item-name">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 推荐作品 */}
        {recommendedWorks.length > 0 && (
          <>
            <div className="section-title">热门作品</div>
            <div className="recommended-works">
              {recommendedWorks.map((work) => (
                <div
                  key={work.id}
                  className="work-card"
                  onClick={() => handleWorkClick(work.id)}
                >
                  <div className="work-thumbnail">
                    {work.thumbnail ? (
                      <img src={work.thumbnail} alt={work.title} />
                    ) : (
                      <div className="work-placeholder">
                        {work.type === 'story' && '📖'}
                        {work.type === 'art' && '🎨'}
                        {work.type === 'music' && '🎵'}
                        {work.type === 'poem' && '✍️'}
                      </div>
                    )}
                  </div>
                  <div className="work-info">
                    <div className="work-title">{work.title}</div>
                    <div className="work-meta">
                      <span>👤 {work.author}</span>
                      <span>❤️ {work.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 推荐挑战 */}
        <div className="section-title">推荐挑战</div>
        <div className="challenge-cards">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="challenge-card"
              onClick={() => navigate(challenge.path)}
            >
              <div className="challenge-badge">{challenge.badge}</div>
              <div className="challenge-icon">{challenge.icon}</div>
              <div className="challenge-title">{challenge.title}</div>
              <div className="challenge-reward">完成获得 +{challenge.reward} 积分</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
