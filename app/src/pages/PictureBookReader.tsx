import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import TextToSpeech from '../components/TextToSpeech'
import './PictureBookReader.css'

interface BookPage {
  pageNumber: number
  content: string
  illustration: string
}

interface BookData {
  id: number
  title: string
  author: string
  pages: BookPage[]
}

// 示例绘本内容数据
const bookContents: { [key: number]: BookData } = {
  1: {
    id: 1,
    title: '小熊宝宝绘本系列',
    author: '蒲蒲兰',
    pages: [
      { pageNumber: 1, content: '小熊宝宝早上起床了，\n"你好！"他对太阳说。', illustration: '🌅🐻' },
      { pageNumber: 2, content: '小熊宝宝去洗脸刷牙，\n"刷刷刷，真干净！"', illustration: '🪥🐻💧' },
      { pageNumber: 3, content: '小熊宝宝要拉巴巴了，\n"坐在马桶上，真舒服！"', illustration: '🚽🐻' },
      { pageNumber: 4, content: '到了晚上，小熊宝宝要睡觉了，\n"晚安，月亮！晚安，星星！"', illustration: '🌙⭐🐻😴' },
      { pageNumber: 5, content: '小熊宝宝做了一个甜甜的梦，\n梦见和好朋友一起玩耍。', illustration: '💭🐻🐰🐶' },
    ]
  },
  4: {
    id: 4,
    title: '好饿的毛毛虫',
    author: '艾瑞·卡尔',
    pages: [
      { pageNumber: 1, content: '月光下，一个小小的蛋\n躺在叶子上。', illustration: '🌙🥚🍃' },
      { pageNumber: 2, content: '星期天早上，太阳升起来了，\n"啪！"从蛋里爬出一条\n又小又饿的毛毛虫。', illustration: '☀️🐛🥚' },
      { pageNumber: 3, content: '他开始找东西吃。\n星期一，他吃了一个苹果。\n但是，他还是很饿。', illustration: '🐛🍎' },
      { pageNumber: 4, content: '星期二，他吃了两个梨。\n星期三，他吃了三个李子。\n但是，他还是很饿。', illustration: '🐛🍐🍐🍑🍑🍑' },
      { pageNumber: 5, content: '星期六，他吃了太多东西，\n肚子好疼啊！', illustration: '🐛😵🍰🍭🍦' },
      { pageNumber: 6, content: '第二天是星期天，\n他吃了一片又嫩又绿的叶子，\n感觉好多了。', illustration: '🐛🍃😊' },
      { pageNumber: 7, content: '毛毛虫不再是小小的了，\n他是一条又肥又大的毛毛虫。\n他造了一个茧，把自己包在里面。', illustration: '🐛→🥚' },
      { pageNumber: 8, content: '他在茧里待了两个多星期。\n然后，他在茧上咬了一个洞，\n钻了出来……', illustration: '🥚🦋' },
      { pageNumber: 9, content: '他变成了一只美丽的蝴蝶！', illustration: '🦋✨🌸' },
    ]
  },
  14: {
    id: 14,
    title: '我爸爸',
    author: '安东尼·布朗',
    pages: [
      { pageNumber: 1, content: '这是我爸爸，\n他真的很棒！', illustration: '👨‍🦱😊' },
      { pageNumber: 2, content: '我爸爸什么都不怕，\n连坏蛋大野狼都不怕。', illustration: '👨💪🐺' },
      { pageNumber: 3, content: '他可以从月亮上跳过去。', illustration: '👨🚀🌙' },
      { pageNumber: 4, content: '他会走钢索，而且不会掉下来。', illustration: '👨🎪🎭' },
      { pageNumber: 5, content: '他敢跟大力士摔跤。', illustration: '👨💪🏋️' },
      { pageNumber: 6, content: '在运动会的比赛中，\n他轻轻松松就跑了第一名。', illustration: '👨🏃‍♂️🥇' },
      { pageNumber: 7, content: '我爸爸吃得像马一样多，\n游泳游得像鱼一样快。', illustration: '👨🍔🐟🏊' },
      { pageNumber: 8, content: '他像大猩猩一样强壮，\n也像河马一样快乐。', illustration: '👨🦍🦛😄' },
      { pageNumber: 9, content: '我爸爸真的很棒！\n我爱他，而且你知道吗？\n他也爱我！（永远爱我）', illustration: '👨❤️👦' },
    ]
  },
  15: {
    id: 15,
    title: '我妈妈',
    author: '安东尼·布朗',
    pages: [
      { pageNumber: 1, content: '这是我妈妈，\n她真的很棒！', illustration: '👩‍🦰😊' },
      { pageNumber: 2, content: '我妈妈是个了不起的厨师。', illustration: '👩‍🍳🍰🍕' },
      { pageNumber: 3, content: '她是个伟大的化妆师。', illustration: '👩💄✨' },
      { pageNumber: 4, content: '她是全世界最强壮的女人！', illustration: '👩💪🏋️‍♀️' },
      { pageNumber: 5, content: '我妈妈是个神奇的园丁，\n她能让所有的东西都长得很好。', illustration: '👩🌺🌻🌷' },
      { pageNumber: 6, content: '她是个好心的仙子，\n我难过时，总是把我变得很开心。', illustration: '👩🧚✨😊' },
      { pageNumber: 7, content: '她的歌声像天使一样甜美，\n吼起来像狮子一样凶猛。', illustration: '👩😇🦁🎵' },
      { pageNumber: 8, content: '我妈妈像蝴蝶一样美丽，\n又舒适的像一把扶手椅。', illustration: '👩🦋🪑' },
      { pageNumber: 9, content: '她像猫咪一样柔软，\n又像犀牛一样强悍。', illustration: '👩🐱🦏' },
      { pageNumber: 10, content: '我妈妈真的，真的很棒！\n我爱她，而且你知道吗？\n她也爱我！（永远爱我）', illustration: '👩❤️👧' },
    ]
  }
}

export default function PictureBookReader() {
  const navigate = useNavigate()
  const location = useLocation()
  const bookId = location.state?.bookId || 1
  const bookTitle = location.state?.bookTitle || '绘本阅读'

  const [currentPage, setCurrentPage] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [readingMode, setReadingMode] = useState<'manual' | 'auto'>('manual')
  const [autoPlayInterval, setAutoPlayInterval] = useState<number | null>(null)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  // 获取绘本数据
  const bookData = bookContents[bookId] || bookContents[1]
  const totalPages = bookData.pages.length

  // 启动使用追踪
  useEffect(() => {
    usageTrackerRef.current = new UsageTracker('阅读', `绘本阅读-${bookData.title}`, {
      bookId: bookData.id,
      bookTitle: bookData.title,
      author: bookData.author
    })
    usageTrackerRef.current.start()

    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.end(undefined, {
          totalPages,
          pagesRead: currentPage + 1,
          completed: currentPage === totalPages - 1
        })
        usageTrackerRef.current = null
      }
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval)
      }
    }
  }, [])

  // 自动播放
  useEffect(() => {
    if (readingMode === 'auto') {
      const interval = setInterval(() => {
        setCurrentPage(prev => {
          if (prev < totalPages - 1) {
            return prev + 1
          } else {
            setReadingMode('manual')
            return prev
          }
        })
      }, 5000) // 每5秒翻页
      setAutoPlayInterval(interval)
      return () => clearInterval(interval)
    } else {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval)
        setAutoPlayInterval(null)
      }
    }
  }, [readingMode, totalPages])

  // 翻到下一页
  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && !isFlipping) {
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPage(currentPage + 1)
        setIsFlipping(false)
      }, 300)
    }
  }

  // 翻到上一页
  const handlePrevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPage(currentPage - 1)
        setIsFlipping(false)
      }, 300)
    }
  }

  // 切换自动播放
  const toggleAutoPlay = () => {
    setReadingMode(readingMode === 'auto' ? 'manual' : 'auto')
  }

  // 完成阅读
  const handleFinishReading = () => {
    if (usageTrackerRef.current) {
      usageTrackerRef.current.end(undefined, {
        totalPages,
        pagesRead: currentPage + 1,
        completed: true
      })
      usageTrackerRef.current = null
    }
    navigate(-1)
  }

  const currentPageData = bookData.pages[currentPage]

  return (
    <Layout>
      <Header
        title={bookData.title}
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        onBack={() => navigate(-1)}
      />

      <div className="main-content reader-container">
        {/* 阅读进度 */}
        <div className="reading-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            ></div>
          </div>
          <div className="progress-text">
            第 {currentPage + 1} 页 / 共 {totalPages} 页
          </div>
        </div>

        {/* 绘本内容 */}
        <div className={`book-page ${isFlipping ? 'flipping' : ''}`}>
          <div className="page-illustration">
            <div className="illustration-content">
              {currentPageData.illustration}
            </div>
          </div>
          <div className="page-text">
            {currentPageData.content.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
          <div className="page-voice-controls">
            <TextToSpeech
              text={currentPageData.content}
              autoPlay={false}
            />
          </div>
          <div className="page-number">— {currentPageData.pageNumber} —</div>
        </div>

        {/* 翻页按钮 */}
        <div className="page-controls">
          <button
            className="page-btn prev-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 0 || isFlipping}
          >
            ← 上一页
          </button>

          <button
            className="auto-play-btn"
            onClick={toggleAutoPlay}
          >
            {readingMode === 'auto' ? '⏸️ 暂停' : '▶️ 自动播放'}
          </button>

          {currentPage === totalPages - 1 ? (
            <button
              className="page-btn finish-btn"
              onClick={handleFinishReading}
            >
              完成阅读 ✓
            </button>
          ) : (
            <button
              className="page-btn next-btn"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1 || isFlipping}
            >
              下一页 →
            </button>
          )}
        </div>

        {/* 快速跳转 */}
        <div className="page-thumbnails">
          {bookData.pages.map((page, idx) => (
            <div
              key={idx}
              className={`thumbnail ${currentPage === idx ? 'active' : ''}`}
              onClick={() => !isFlipping && setCurrentPage(idx)}
            >
              <div className="thumbnail-num">{page.pageNumber}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
