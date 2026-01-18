import { useState, useRef, useEffect } from 'react'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import './ChildrenSongs.css'

interface Song {
  id: number
  title: string
  category: string
  lyrics: string[]
  melody: string
  ageGroup: string
  duration: string
  tags: string[]
}

const categories = [
  { id: 'all', name: '全部', icon: '🎵', color: '#667eea' },
  { id: 'classic', name: '经典儿歌', icon: '🎼', color: '#ff6b6b' },
  { id: 'nursery', name: '摇篮曲', icon: '🌙', color: '#a29bfe' },
  { id: 'dance', name: '律动歌曲', icon: '💃', color: '#fd79a8' },
  { id: 'learning', name: '学习歌曲', icon: '📚', color: '#4ecdc4' },
  { id: 'nature', name: '自然歌曲', icon: '🌸', color: '#55efc4' },
]

const songs: Song[] = [
  // 经典儿歌
  {
    id: 1,
    title: '小星星',
    category: 'classic',
    lyrics: [
      '一闪一闪亮晶晶',
      '满天都是小星星',
      '挂在天上放光明',
      '好像许多小眼睛',
      '一闪一闪亮晶晶',
      '满天都是小星星'
    ],
    melody: '简单优美',
    ageGroup: '2-6岁',
    duration: '1分30秒',
    tags: ['经典', '睡前', '简单']
  },
  {
    id: 2,
    title: '两只老虎',
    category: 'classic',
    lyrics: [
      '两只老虎，两只老虎',
      '跑得快，跑得快',
      '一只没有耳朵',
      '一只没有尾巴',
      '真奇怪，真奇怪'
    ],
    melody: '欢快活泼',
    ageGroup: '2-5岁',
    duration: '1分钟',
    tags: ['经典', '有趣', '简单']
  },
  {
    id: 3,
    title: '小兔子乖乖',
    category: 'classic',
    lyrics: [
      '小兔子乖乖，把门儿开开',
      '快点儿开开，我要进来',
      '不开不开我不开',
      '妈妈没回来，谁来也不开'
    ],
    melody: '温柔亲切',
    ageGroup: '2-5岁',
    duration: '1分20秒',
    tags: ['经典', '安全教育', '简单']
  },
  {
    id: 4,
    title: '数鸭子',
    category: 'learning',
    lyrics: [
      '门前大桥下，游过一群鸭',
      '快来快来数一数',
      '二四六七八',
      '嘎嘎嘎嘎，真呀真多呀'
    ],
    melody: '欢快节奏',
    ageGroup: '3-6岁',
    duration: '2分钟',
    tags: ['数数', '学习', '欢快']
  },
  {
    id: 5,
    title: '小燕子',
    category: 'nature',
    lyrics: [
      '小燕子，穿花衣',
      '年年春天来这里',
      '我问燕子你为啥来',
      '燕子说，这里的春天最美丽'
    ],
    melody: '优美抒情',
    ageGroup: '3-7岁',
    duration: '1分40秒',
    tags: ['春天', '自然', '优美']
  },
  {
    id: 6,
    title: '拔萝卜',
    category: 'dance',
    lyrics: [
      '拔萝卜，拔萝卜',
      '嘿哟嘿哟拔萝卜',
      '嘿哟嘿哟拔不动',
      '老太婆快快来，快来帮我们拔萝卜'
    ],
    melody: '节奏欢快',
    ageGroup: '2-6岁',
    duration: '2分钟',
    tags: ['律动', '合作', '欢快']
  },
  {
    id: 7,
    title: '摇篮曲',
    category: 'nursery',
    lyrics: [
      '睡吧睡吧，我亲爱的宝贝',
      '妈妈的双手轻轻摇着你',
      '摇篮摇你，快快安睡',
      '夜已安静，被里多温暖'
    ],
    melody: '温柔舒缓',
    ageGroup: '0-3岁',
    duration: '3分钟',
    tags: ['睡前', '温柔', '安静']
  },
  {
    id: 8,
    title: '找朋友',
    category: 'dance',
    lyrics: [
      '找呀找呀找朋友',
      '找到一个好朋友',
      '敬个礼呀握握手',
      '你是我的好朋友'
    ],
    melody: '活泼欢快',
    ageGroup: '3-6岁',
    duration: '1分30秒',
    tags: ['社交', '律动', '友谊']
  },
]

export default function ChildrenSongs() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  // 清理追踪器
  useEffect(() => {
    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.end()
        usageTrackerRef.current = null
      }
    }
  }, [])

  // 筛选歌曲
  const filteredSongs = songs.filter(s => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) {
      return false
    }
    return true
  })

  // 点击歌曲
  const handleSongClick = (song: Song) => {
    setSelectedSong(song)
    usageTrackerRef.current = new UsageTracker('阅读', `儿歌-${song.title}`, {
      songId: song.id,
      category: song.category
    })
    usageTrackerRef.current.start()
  }

  // 关闭详情
  const handleClose = () => {
    if (usageTrackerRef.current) {
      usageTrackerRef.current.end()
      usageTrackerRef.current = null
    }
    setSelectedSong(null)
  }

  return (
    <Layout>
      <Header title="儿歌大全" gradient="linear-gradient(135deg, #81fbb8 0%, #28c76f 100%)" />

      <div className="main-content">
        {/* 介绍横幅 */}
        <div className="songs-intro">
          <div className="intro-icon">🎶</div>
          <h2 className="intro-title">经典儿歌欢乐唱</h2>
          <p className="intro-desc">在歌声中快乐成长，培养音乐兴趣</p>
        </div>

        {/* 分类选择 */}
        <div className="category-selector">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              style={{
                borderColor: selectedCategory === cat.id ? cat.color : '#e0e0e0',
                background: selectedCategory === cat.id ? cat.color : 'white',
                color: selectedCategory === cat.id ? 'white' : '#555'
              }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-name">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* 歌曲列表 */}
        <div className="songs-grid">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className="song-card"
              onClick={() => handleSongClick(song)}
            >
              <div className="song-icon">🎵</div>
              <h3 className="song-title">{song.title}</h3>
              <div className="song-meta">
                <span className="song-age">{song.ageGroup}</span>
                <span className="song-duration">{song.duration}</span>
              </div>
              <div className="song-tags">
                {song.tags.slice(0, 2).map((tag, idx) => (
                  <span key={idx} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 歌曲详情弹窗 */}
        {selectedSong && (
          <div className="song-modal" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={handleClose}>✕</button>

              <div className="modal-header">
                <div className="modal-icon">🎵</div>
                <h2 className="modal-title">{selectedSong.title}</h2>
                <div className="modal-meta">
                  <span>{selectedSong.ageGroup}</span>
                  <span>{selectedSong.duration}</span>
                  <span>{selectedSong.melody}</span>
                </div>
              </div>

              <div className="modal-body">
                <h4>歌词</h4>
                <div className="lyrics">
                  {selectedSong.lyrics.map((line, idx) => (
                    <p key={idx} className="lyric-line">{line}</p>
                  ))}
                </div>

                <h4>标签</h4>
                <div className="tags-list">
                  {selectedSong.tags.map((tag, idx) => (
                    <span key={idx} className="tag-badge">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
