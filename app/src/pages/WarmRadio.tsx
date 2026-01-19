import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './WarmRadio.css'

interface RadioContent {
  id: string
  type: 'daily' | 'story' | '励志' | 'music'
  title: string
  content: string
  duration?: string
  author?: string
}

const DAILY_QUOTES = [
  { text: '你是独一无二的，世界因你而美好', author: '温暖电台' },
  { text: '每一天都是新的开始，加油！', author: '温暖电台' },
  { text: '相信自己，你比想象中更强大', author: '温暖电台' },
  { text: '困难只是暂时的，坚持就会看到希望', author: '温暖电台' },
  { text: '你的笑容能照亮整个世界', author: '温暖电台' },
  { text: '慢慢来，一切都会好起来的', author: '温暖电台' },
  { text: '勇敢做自己，你就是最棒的', author: '温暖电台' }
]

const BEDTIME_STORIES = [
  {
    id: '1',
    title: '小星星找朋友',
    content: '从前，天上有一颗小星星，它总是独自闪烁。有一天，它决定去找朋友。它飞过云层，遇到了月亮姐姐。月亮姐姐说："我们都是你的朋友，只是你没有发现。"小星星这才明白，原来身边一直有很多朋友陪伴着它。',
    duration: '3分钟'
  },
  {
    id: '2',
    title: '勇敢的小蜗牛',
    content: '小蜗牛爬得很慢，其他动物都嘲笑它。但小蜗牛不放弃，每天坚持往前爬一点点。终于有一天，它爬到了山顶，看到了最美的风景。这个故事告诉我们：只要坚持，就一定能实现梦想。',
    duration: '3分钟'
  },
  {
    id: '3',
    title: '会魔法的小兔子',
    content: '小兔子有一个神奇的魔法，它能让不开心的人变开心。原来，它的魔法就是温暖的拥抱和真诚的微笑。小兔子用这个魔法帮助了很多朋友，大家都很喜欢它。',
    duration: '3分钟'
  }
]

const INSPIRATIONAL_STORIES = [
  {
    id: '1',
    title: '爱迪生的故事',
    content: '爱迪生发明电灯时，失败了上千次。有人问他："你失败了这么多次，为什么不放弃？"爱迪生说："我没有失败，我只是找到了一千种不行的方法。"最后，他成功了，给世界带来了光明。',
    duration: '5分钟'
  },
  {
    id: '2',
    title: '海伦·凯勒的奇迹',
    content: '海伦·凯勒从小又聋又盲，但她没有放弃。在老师的帮助下，她学会了说话、写字，还考上了大学。她用自己的经历告诉我们：只要不放弃，就能创造奇迹。',
    duration: '5分钟'
  }
]

export default function WarmRadio() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'daily' | 'story' | 'inspire'>('daily')
  const [todayQuote, setTodayQuote] = useState(DAILY_QUOTES[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStory, setCurrentStory] = useState<any>(null)

  // 每日一句（根据日期固定）
  useEffect(() => {
    const today = new Date().getDate()
    const quoteIndex = today % DAILY_QUOTES.length
    setTodayQuote(DAILY_QUOTES[quoteIndex])
  }, [])

  const handlePlayStory = (story: any) => {
    setCurrentStory(story)
    setIsPlaying(true)
    // 实际项目中这里会播放音频
    setTimeout(() => {
      setIsPlaying(false)
    }, 3000)
  }

  return (
    <Layout>
      <Header
        title="温暖电台"
        gradient="linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)"
      />
      <div className="warm-radio-container">
        {/* 标签切换 */}
        <div className="radio-tabs">
        <button
          className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          ✨ 每日一句
        </button>
        <button
          className={`tab-btn ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => setActiveTab('story')}
        >
          📖 睡前故事
        </button>
        <button
          className={`tab-btn ${activeTab === 'inspire' ? 'active' : ''}`}
          onClick={() => setActiveTab('inspire')}
        >
          💪 励志故事
        </button>
      </div>

      {/* 内容区域 */}
      <div className="radio-content">
        {/* 每日一句 */}
        {activeTab === 'daily' && (
          <div className="daily-section">
            <div className="quote-card">
              <div className="quote-icon">✨</div>
              <p className="quote-text">"{todayQuote.text}"</p>
              <p className="quote-author">— {todayQuote.author}</p>
              <div className="quote-date">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            <div className="all-quotes">
              <h3 className="section-title">更多鼓励</h3>
              <div className="quotes-list">
                {DAILY_QUOTES.map((quote, index) => (
                  <div key={index} className="quote-item">
                    <span className="quote-bullet">💫</span>
                    <span className="quote-item-text">{quote.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 睡前故事 */}
        {activeTab === 'story' && (
          <div className="story-section">
            <div className="stories-grid">
              {BEDTIME_STORIES.map((story) => (
                <div key={story.id} className="story-card">
                  <div className="story-header">
                    <h3 className="story-title">{story.title}</h3>
                    <span className="story-duration">{story.duration}</span>
                  </div>
                  <p className="story-preview">{story.content}</p>
                  <button
                    className="play-btn"
                    onClick={() => handlePlayStory(story)}
                  >
                    {isPlaying && currentStory?.id === story.id ? '⏸️ 暂停' : '▶️ 播放'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 励志故事 */}
        {activeTab === 'inspire' && (
          <div className="inspire-section">
            <div className="stories-grid">
              {INSPIRATIONAL_STORIES.map((story) => (
                <div key={story.id} className="story-card inspire">
                  <div className="story-header">
                    <h3 className="story-title">{story.title}</h3>
                    <span className="story-duration">{story.duration}</span>
                  </div>
                  <p className="story-preview">{story.content}</p>
                  <button
                    className="play-btn"
                    onClick={() => handlePlayStory(story)}
                  >
                    {isPlaying && currentStory?.id === story.id ? '⏸️ 暂停' : '▶️ 播放'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 播放提示 */}
      {isPlaying && currentStory && (
        <div className="playing-toast">
          正在播放：{currentStory.title} 🎵
        </div>
      )}
      </div>
    </Layout>
  )
}
