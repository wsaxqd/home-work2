import { useState, useRef, useEffect } from 'react'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import './WhyQuestions.css'

interface Question {
  id: number
  question: string
  category: string
  answer: string
  relatedQuestions: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

const categories = [
  { id: 'all', name: '全部', icon: '🌟', color: '#667eea' },
  { id: 'nature', name: '自然科学', icon: '🌍', color: '#4ecdc4' },
  { id: 'animal', name: '动物世界', icon: '🦁', color: '#ff6b6b' },
  { id: 'space', name: '宇宙太空', icon: '🚀', color: '#a29bfe' },
  { id: 'body', name: '人体奥秘', icon: '🧠', color: '#fd79a8' },
  { id: 'tech', name: '科技发明', icon: '💡', color: '#fdcb6e' },
  { id: 'life', name: '生活常识', icon: '🏠', color: '#55efc4' },
]

const questions: Question[] = [
  // 自然科学
  {
    id: 1,
    question: '为什么天空是蓝色的？',
    category: 'nature',
    answer: '天空之所以是蓝色的，是因为阳光穿过大气层时，蓝色光波比较短，容易被空气中的微小粒子散射。我们抬头看天空时，看到的就是这些被散射的蓝光。这种现象叫做"瑞利散射"。',
    relatedQuestions: ['为什么日落时天空是红色的？', '为什么云是白色的？'],
    difficulty: 'medium'
  },
  {
    id: 2,
    question: '为什么会下雨？',
    category: 'nature',
    answer: '太阳把地面上的水加热，水变成水蒸气升到天空。当水蒸气遇到冷空气，就会凝结成小水滴，很多小水滴聚在一起形成云。当云里的水滴越来越多、越来越重，就会从天上掉下来，这就是雨。',
    relatedQuestions: ['为什么会打雷？', '为什么会下雪？'],
    difficulty: 'easy'
  },
  {
    id: 3,
    question: '为什么彩虹有七种颜色？',
    category: 'nature',
    answer: '阳光看起来是白色的，但实际上是由红、橙、黄、绿、蓝、靛、紫七种颜色的光混合而成。当阳光穿过雨滴时，会发生折射和反射，不同颜色的光被分开，就形成了美丽的彩虹。',
    relatedQuestions: ['为什么彩虹是弯的？', '为什么有时能看到双彩虹？'],
    difficulty: 'medium'
  },

  // 动物世界
  {
    id: 4,
    question: '为什么长颈鹿的脖子那么长？',
    category: 'animal',
    answer: '长颈鹿的长脖子是经过漫长进化形成的。在非洲草原上，树叶是重要的食物来源。脖子长的长颈鹿能够吃到高处的树叶，获得更多食物，更容易生存下来。经过千万年的进化，长颈鹿的脖子就越来越长了。',
    relatedQuestions: ['为什么长颈鹿不会头晕？', '长颈鹿怎么睡觉？'],
    difficulty: 'easy'
  },
  {
    id: 5,
    question: '为什么鱼能在水里呼吸？',
    category: 'animal',
    answer: '鱼有一个特殊的器官叫做"鳃"。当鱼游动时，水从嘴巴流进来，经过鳃，鳃能从水中吸收氧气，然后把水从鳃盖排出去。这样鱼就能在水里呼吸了。就像我们用肺呼吸空气一样，鱼用鳃呼吸水中的氧气。',
    relatedQuestions: ['为什么鱼睁着眼睛睡觉？', '为什么鱼要成群游动？'],
    difficulty: 'easy'
  },
  {
    id: 6,
    question: '为什么猫从高处跳下不会受伤？',
    category: 'animal',
    answer: '猫有很强的平衡能力和柔软的身体。当猫从高处掉下来时，它能快速调整身体姿势，让四只脚先着地。猫的脚掌有厚厚的肉垫，能缓冲落地的冲击力。而且猫的骨骼很灵活，能吸收冲击力，所以不容易受伤。',
    relatedQuestions: ['为什么猫总是用舌头舔毛？', '为什么猫的眼睛在黑暗中会发光？'],
    difficulty: 'medium'
  },

  // 宇宙太空
  {
    id: 7,
    question: '为什么月亮会有圆缺变化？',
    category: 'space',
    answer: '月亮本身不会发光，我们看到的月光其实是太阳照在月亮上反射的光。月亮绕着地球转，不同位置时，太阳照亮月亮的部分不同，我们看到的月亮形状就不一样。从新月到满月，再到新月，大约需要29天半。',
    relatedQuestions: ['为什么月亮总是跟着我们走？', '为什么月亮上有黑色的影子？'],
    difficulty: 'medium'
  },
  {
    id: 8,
    question: '为什么星星会眨眼睛？',
    category: 'space',
    answer: '星星其实不会眨眼睛，这是因为星光穿过地球大气层时，会受到空气流动的影响。空气在不断流动，就像水波一样，星光穿过这些"波动"的空气时，亮度会不断变化，看起来就像在眨眼睛一样。',
    relatedQuestions: ['为什么白天看不到星星？', '为什么有的星星特别亮？'],
    difficulty: 'easy'
  },

  // 人体奥秘
  {
    id: 9,
    question: '为什么我们会打哈欠？',
    category: 'body',
    answer: '打哈欠是身体的一种自然反应。当我们累了或者大脑缺氧时，身体会通过打哈欠来吸入更多的氧气，帮助大脑清醒。打哈欠还能帮助我们放松紧张的肌肉。有趣的是，看到别人打哈欠，我们也会跟着打哈欠！',
    relatedQuestions: ['为什么打哈欠会传染？', '为什么困了会打哈欠？'],
    difficulty: 'easy'
  },
  {
    id: 10,
    question: '为什么我们会做梦？',
    category: 'body',
    answer: '做梦是大脑在睡觉时的一种活动。白天我们经历了很多事情，大脑需要整理这些信息。在睡觉时，大脑会把白天的记忆重新组合，就形成了各种各样的梦。梦可以帮助我们处理情绪，巩固记忆。',
    relatedQuestions: ['为什么有时候记得梦，有时候不记得？', '为什么会做噩梦？'],
    difficulty: 'medium'
  },

  // 科技发明
  {
    id: 11,
    question: '为什么飞机能在天上飞？',
    category: 'tech',
    answer: '飞机能飞起来主要靠机翼。机翼的形状很特别，上面是弯的，下面是平的。当飞机快速前进时，空气流过机翼，上面的空气流得快，压力小；下面的空气流得慢，压力大。下面的压力把飞机托起来，飞机就飞起来了。',
    relatedQuestions: ['为什么飞机要逆风起飞？', '为什么飞机会留下白色的尾巴？'],
    difficulty: 'medium'
  },
  {
    id: 12,
    question: '为什么电灯会发光？',
    category: 'tech',
    answer: '电灯里有一根很细的金属丝叫灯丝。当电流通过灯丝时，灯丝会变得非常热，热到发出明亮的光。就像烧红的铁会发光一样。现在的LED灯是用特殊的材料，电流通过时直接发光，更省电也更亮。',
    relatedQuestions: ['为什么灯泡用久了会变黑？', '为什么LED灯更省电？'],
    difficulty: 'easy'
  },

  // 生活常识
  {
    id: 13,
    question: '为什么冰箱能让食物保鲜？',
    category: 'life',
    answer: '食物变质是因为细菌在繁殖。细菌喜欢温暖的环境，在低温下它们就不活跃了。冰箱能把温度降到很低，细菌繁殖得很慢，食物就能保存更长时间。冷冻室温度更低，能让食物保存更久。',
    relatedQuestions: ['为什么冰箱会结冰？', '为什么有些食物不能放冰箱？'],
    difficulty: 'easy'
  },
  {
    id: 14,
    question: '为什么肥皂能洗掉脏东西？',
    category: 'life',
    answer: '肥皂有一个神奇的本领：它的一端喜欢水，另一端喜欢油。当我们用肥皂洗手时，喜欢油的那端会抓住脏东西（很多脏东西都含有油），喜欢水的那端会被水冲走，这样就把脏东西一起带走了。',
    relatedQuestions: ['为什么要用温水洗手？', '为什么洗手要搓20秒？'],
    difficulty: 'easy'
  },
]

export default function WhyQuestions() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
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

  // 筛选问题
  const filteredQuestions = questions.filter(q => {
    if (selectedCategory !== 'all' && q.category !== selectedCategory) {
      return false
    }
    if (searchKeyword) {
      return q.question.toLowerCase().includes(searchKeyword.toLowerCase())
    }
    return true
  })

  // 点击问题
  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question)
    usageTrackerRef.current = new UsageTracker('阅读', `十万个为什么-${question.question}`, {
      questionId: question.id,
      category: question.category
    })
    usageTrackerRef.current.start()
  }

  // 关闭详情
  const handleClose = () => {
    if (usageTrackerRef.current) {
      usageTrackerRef.current.end()
      usageTrackerRef.current = null
    }
    setSelectedQuestion(null)
  }

  return (
    <Layout>
      <Header title="十万个为什么" gradient="linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)" />

      <div className="main-content">
        {/* 介绍横幅 */}
        <div className="why-intro">
          <div className="intro-icon">🤔</div>
          <h2 className="intro-title">解答你的好奇心</h2>
          <p className="intro-desc">探索世界的奥秘，发现科学的乐趣</p>
        </div>

        {/* 搜索框 */}
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索你想知道的问题..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
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

        {/* 问题列表 */}
        <div className="questions-list">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="question-card"
              onClick={() => handleQuestionClick(q)}
            >
              <div className="question-header">
                <span className="question-icon">❓</span>
                <span className={`difficulty-badge ${q.difficulty}`}>
                  {q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}
                </span>
              </div>
              <h3 className="question-title">{q.question}</h3>
              <div className="question-category">
                {categories.find(c => c.id === q.category)?.icon} {categories.find(c => c.id === q.category)?.name}
              </div>
            </div>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <p>没有找到相关问题，试试其他关键词吧</p>
          </div>
        )}

        {/* 问题详情弹窗 */}
        {selectedQuestion && (
          <div className="question-modal" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={handleClose}>✕</button>

              <div className="modal-header">
                <div className="modal-icon">💡</div>
                <h2 className="modal-question">{selectedQuestion.question}</h2>
              </div>

              <div className="modal-body">
                <h4>答案</h4>
                <p className="answer-text">{selectedQuestion.answer}</p>

                {selectedQuestion.relatedQuestions.length > 0 && (
                  <>
                    <h4>相关问题</h4>
                    <div className="related-questions">
                      {selectedQuestion.relatedQuestions.map((rq, idx) => (
                        <div key={idx} className="related-item">
                          <span className="related-icon">🔗</span>
                          <span>{rq}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
