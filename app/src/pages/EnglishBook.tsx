import { useState, useRef, useEffect } from 'react'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import { useToast } from '../components/Toast'
import './EnglishBook.css'

interface Book {
  id: number
  title: string
  author: string
  cover: string
  level: string
  summary: string
  themes: string[]
  rating: number
  vocabulary: number
}

// 入门级绘本 (Level 1)
const level1Books: Book[] = [
  { id: 1, title: 'Brown Bear, Brown Bear', author: 'Bill Martin Jr.', cover: '🐻', level: 'Level 1', summary: '通过重复的句式学习颜色和动物', themes: ['颜色', '动物'], rating: 5, vocabulary: 50 },
  { id: 2, title: 'The Very Hungry Caterpillar', author: 'Eric Carle', cover: '🐛', level: 'Level 1', summary: '毛毛虫变蝴蝶的经典故事', themes: ['成长', '数字'], rating: 5, vocabulary: 60 },
  { id: 3, title: 'Goodnight Moon', author: 'Margaret Wise Brown', cover: '🌙', level: 'Level 1', summary: '温馨的晚安故事', themes: ['睡前故事', '日常'], rating: 5, vocabulary: 40 },
  { id: 4, title: 'Where is Baby\'s Belly Button?', author: 'Karen Katz', cover: '👶', level: 'Level 1', summary: '互动翻翻书，认识身体部位', themes: ['身体部位', '互动'], rating: 5, vocabulary: 30 },
  { id: 5, title: 'Dear Zoo', author: 'Rod Campbell', cover: '🦁', level: 'Level 1', summary: '动物园寄来的宠物', themes: ['动物', '翻翻书'], rating: 5, vocabulary: 45 },
  { id: 6, title: 'From Head to Toe', author: 'Eric Carle', cover: '🦒', level: 'Level 1', summary: '跟着动物学动作', themes: ['动作', '身体'], rating: 5, vocabulary: 35 },
  { id: 7, title: 'The Wheels on the Bus', author: 'Paul O. Zelinsky', cover: '🚌', level: 'Level 1', summary: '经典儿歌改编绘本', themes: ['交通', '儿歌'], rating: 5, vocabulary: 50 },
  { id: 8, title: 'Spot\'s First Walk', author: 'Eric Hill', cover: '🐶', level: 'Level 1', summary: '小狗Spot的第一次散步', themes: ['冒险', '日常'], rating: 5, vocabulary: 40 },
]

// 进阶级绘本 (Level 2)
const level2Books: Book[] = [
  { id: 101, title: 'The Gruffalo', author: 'Julia Donaldson', cover: '👹', level: 'Level 2', summary: '小老鼠智斗怪兽的故事', themes: ['勇气', '智慧'], rating: 5, vocabulary: 120 },
  { id: 102, title: 'Room on the Broom', author: 'Julia Donaldson', cover: '🧙', level: 'Level 2', summary: '女巫和她的朋友们', themes: ['友谊', '分享'], rating: 5, vocabulary: 130 },
  { id: 103, title: 'We\'re Going on a Bear Hunt', author: 'Michael Rosen', cover: '🐻', level: 'Level 2', summary: '一家人去猎熊的冒险', themes: ['冒险', '家庭'], rating: 5, vocabulary: 100 },
  { id: 104, title: 'The Rainbow Fish', author: 'Marcus Pfister', cover: '🐠', level: 'Level 2', summary: '彩虹鱼学会分享', themes: ['分享', '友谊'], rating: 5, vocabulary: 110 },
  { id: 105, title: 'Guess How Much I Love You', author: 'Sam McBratney', cover: '🐰', level: 'Level 2', summary: '大兔子和小兔子比爱', themes: ['爱', '亲情'], rating: 5, vocabulary: 90 },
  { id: 106, title: 'The Snowy Day', author: 'Ezra Jack Keats', cover: '⛄', level: 'Level 2', summary: '下雪天的快乐时光', themes: ['季节', '玩耍'], rating: 5, vocabulary: 95 },
  { id: 107, title: 'Corduroy', author: 'Don Freeman', cover: '🧸', level: 'Level 2', summary: '小熊找纽扣的故事', themes: ['友谊', '接纳'], rating: 5, vocabulary: 105 },
  { id: 108, title: 'Chicka Chicka Boom Boom', author: 'Bill Martin Jr.', cover: '🌴', level: 'Level 2', summary: '字母爬椰子树', themes: ['字母', '韵律'], rating: 5, vocabulary: 80 },
]

// 高级绘本 (Level 3)
const level3Books: Book[] = [
  { id: 201, title: 'Where the Wild Things Are', author: 'Maurice Sendak', cover: '👹', level: 'Level 3', summary: 'Max的想象世界冒险', themes: ['想象力', '情绪'], rating: 5, vocabulary: 180 },
  { id: 202, title: 'The Giving Tree', author: 'Shel Silverstein', cover: '🌳', level: 'Level 3', summary: '大树无私奉献的故事', themes: ['奉献', '爱'], rating: 5, vocabulary: 150 },
  { id: 203, title: 'Charlotte\'s Web', author: 'E.B. White', cover: '🕷️', level: 'Level 3', summary: '蜘蛛夏洛救小猪威尔伯', themes: ['友谊', '生命'], rating: 5, vocabulary: 250 },
  { id: 204, title: 'The Tale of Peter Rabbit', author: 'Beatrix Potter', cover: '🐰', level: 'Level 3', summary: '彼得兔的冒险故事', themes: ['冒险', '教训'], rating: 5, vocabulary: 160 },
  { id: 205, title: 'Green Eggs and Ham', author: 'Dr. Seuss', cover: '🥚', level: 'Level 3', summary: 'Sam劝朋友尝试新食物', themes: ['尝试', '韵律'], rating: 5, vocabulary: 140 },
  { id: 206, title: 'The Cat in the Hat', author: 'Dr. Seuss', cover: '🎩', level: 'Level 3', summary: '戴帽子的猫带来的混乱', themes: ['幽默', '想象'], rating: 5, vocabulary: 170 },
  { id: 207, title: 'Madeline', author: 'Ludwig Bemelmans', cover: '👧', level: 'Level 3', summary: '巴黎小女孩Madeline的故事', themes: ['勇敢', '学校'], rating: 5, vocabulary: 190 },
  { id: 208, title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', cover: '👑', level: 'Level 3', summary: '小王子的星际旅行', themes: ['哲理', '友谊'], rating: 5, vocabulary: 280 },
]

export default function EnglishBook() {
  const toast = useToast()
  const [selectedLevel, setSelectedLevel] = useState<'1' | '2' | '3'>('1')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  const getCurrentBooks = () => {
    switch (selectedLevel) {
      case '1': return level1Books
      case '2': return level2Books
      case '3': return level3Books
      default: return level1Books
    }
  }

  const books = getCurrentBooks()

  // 清理追踪器
  useEffect(() => {
    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.end()
        usageTrackerRef.current = null
      }
    }
  }, [])

  // 开始阅读书籍
  const handleBookClick = (book: Book) => {
    setSelectedBook(book)
    // 启动使用追踪
    usageTrackerRef.current = new UsageTracker('阅读', `英语绘本-${book.title}`, {
      bookId: book.id,
      level: book.level,
      author: book.author,
      themes: book.themes
    })
    usageTrackerRef.current.start()
  }

  // 关闭书籍详情
  const handleCloseBook = () => {
    if (usageTrackerRef.current && selectedBook) {
      usageTrackerRef.current.end(undefined, {
        completed: false
      })
      usageTrackerRef.current = null
    }
    setSelectedBook(null)
  }

  // 开始阅读按钮
  const handleStartReading = () => {
    if (usageTrackerRef.current && selectedBook) {
      usageTrackerRef.current.end(undefined, {
        completed: true
      })
      usageTrackerRef.current = null
    }
    toast.info(`开始阅读《${selectedBook?.title}》`)
    setSelectedBook(null)
  }

  return (
    <Layout>
      <Header title="英语绘本" gradient="linear-gradient(135deg, #ffd89b 0%, #19547b 100%)" />

      <div className="main-content">
        {/* 介绍横幅 */}
        <div className="english-intro">
          <div className="intro-icon">🎈</div>
          <h2 className="intro-title">快乐学英语</h2>
          <p className="intro-desc">通过经典英文绘本，培养英语阅读兴趣</p>
        </div>

        {/* 级别选择 */}
        <div className="level-selector">
          <button
            className={`level-btn ${selectedLevel === '1' ? 'active' : ''}`}
            onClick={() => setSelectedLevel('1')}
          >
            <span className="level-icon">🌱</span>
            <span className="level-label">入门级</span>
            <span className="level-count">{level1Books.length}本</span>
          </button>
          <button
            className={`level-btn ${selectedLevel === '2' ? 'active' : ''}`}
            onClick={() => setSelectedLevel('2')}
          >
            <span className="level-icon">🌿</span>
            <span className="level-label">进阶级</span>
            <span className="level-count">{level2Books.length}本</span>
          </button>
          <button
            className={`level-btn ${selectedLevel === '3' ? 'active' : ''}`}
            onClick={() => setSelectedLevel('3')}
          >
            <span className="level-icon">🌳</span>
            <span className="level-label">高级</span>
            <span className="level-count">{level3Books.length}本</span>
          </button>
        </div>

        {/* 绘本列表 */}
        <div className="books-grid">
          {books.map((book) => (
            <div
              key={book.id}
              className="book-card"
              onClick={() => handleBookClick(book)}
            >
              <div className="book-cover">{book.cover}</div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">作者：{book.author}</p>
                <div className="book-meta">
                  <span className="book-level">{book.level}</span>
                  <span className="book-vocab">词汇：{book.vocabulary}</span>
                </div>
                <div className="book-rating">
                  {'⭐'.repeat(book.rating)}
                </div>
                <div className="book-themes">
                  {book.themes.slice(0, 2).map((theme, idx) => (
                    <span key={idx} className="theme-tag">{theme}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 绘本详情弹窗 */}
        {selectedBook && (
          <div className="book-detail-modal" onClick={handleCloseBook}>
            <div className="book-detail-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={handleCloseBook}>✕</button>

              <div className="detail-header">
                <div className="detail-cover">{selectedBook.cover}</div>
                <div className="detail-info">
                  <h2>{selectedBook.title}</h2>
                  <p className="detail-author">作者：{selectedBook.author}</p>
                  <p className="detail-level">难度：{selectedBook.level}</p>
                  <p className="detail-vocab">词汇量：{selectedBook.vocabulary}个单词</p>
                  <div className="detail-rating">
                    {'⭐'.repeat(selectedBook.rating)}
                  </div>
                </div>
              </div>

              <div className="detail-body">
                <h4>内容简介</h4>
                <p className="detail-summary">{selectedBook.summary}</p>

                <h4>主题标签</h4>
                <div className="detail-themes">
                  {selectedBook.themes.map((theme, idx) => (
                    <span key={idx} className="theme-badge">{theme}</span>
                  ))}
                </div>

                <div className="action-buttons">
                  <button className="btn-primary" onClick={handleStartReading}>开始阅读</button>
                  <button className="btn-secondary">收藏</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
