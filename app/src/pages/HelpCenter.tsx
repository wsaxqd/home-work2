import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import './HelpCenter.css'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

interface Category {
  id: string
  name: string
  icon: string
  count: number
}

export default function HelpCenter() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const categories: Category[] = [
    { id: 'account', name: '账户问题', icon: '👤', count: 8 },
    { id: 'learning', name: '学习问题', icon: '📚', count: 12 },
    { id: 'creation', name: '创作问题', icon: '🎨', count: 6 },
    { id: 'other', name: '其他问题', icon: '❓', count: 5 },
  ]

  const faqs: FAQ[] = [
    {
      id: '1',
      category: 'account',
      question: '如何注册账号?',
      answer: '您可以使用手机号或邮箱注册账号。在登录页面点击"注册"按钮,填写相关信息即可完成注册。注册后建议完善个人资料,以获得更好的使用体验。'
    },
    {
      id: '2',
      category: 'account',
      question: '忘记密码怎么办?',
      answer: '在登录页面点击"忘记密码",通过手机号或邮箱验证码找回密码。验证成功后可以设置新密码。建议设置一个包含大小写字母和数字的强密码。'
    },
    {
      id: '3',
      category: 'account',
      question: '如何修改个人信息?',
      answer: '进入"个人中心"->"设置"页面,可以修改昵称、头像、个人简介等信息。修改后点击保存即可生效。'
    },
    {
      id: '4',
      category: 'learning',
      question: '如何使用作业助手?',
      answer: '进入"作业助手"页面,拍照上传题目或手动输入题目内容,AI会为您提供详细的解题思路和答案。支持小学到初中的各科作业辅导。'
    },
    {
      id: '5',
      category: 'learning',
      question: '学习地图是什么?',
      answer: '学习地图是根据您的学习进度和能力水平,为您规划的个性化学习路径。通过完成各个知识点的学习和练习,逐步提升能力。'
    },
    {
      id: '6',
      category: 'learning',
      question: '如何查看学习统计?',
      answer: '在"个人中心"可以查看学习时长、完成任务数、知识点掌握情况等统计数据。家长端也可以查看孩子的详细学习报告。'
    },
    {
      id: '7',
      category: 'creation',
      question: 'AI创作工具如何使用?',
      answer: '进入"创作"页面,选择想要创作的类型(绘画、音乐、故事、诗歌),输入创作主题或描述,AI会帮您生成作品。您可以对生成的作品进行修改和完善。'
    },
    {
      id: '8',
      category: 'creation',
      question: '如何分享我的作品?',
      answer: '在"我的作品"页面,选择想要分享的作品,点击"发布到社区"按钮。发布后其他用户可以看到、点赞和评论您的作品。'
    },
    {
      id: '9',
      category: 'other',
      question: '如何获得积分?',
      answer: '完成每日任务、学习打卡、发布作品、参与社区互动等都可以获得积分。积分可以在商城兑换虚拟道具和学习工具。'
    },
    {
      id: '10',
      category: 'other',
      question: '家长端如何使用?',
      answer: '家长可以通过家长端登录,查看孩子的学习数据、设置使用时长限制、管理内容访问权限等。保护孩子健康使用的同时,了解孩子的学习情况。'
    },
  ]

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch = searchTerm === '' ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <Layout>
      <Header
        title="帮助中心"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        showBack={true}
      />

      <div className="main-content help-center-page">
        {/* 搜索框 */}
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="搜索问题..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        {/* 分类 */}
        <div className="categories-section">
          <h3 className="section-title">问题分类</h3>
          <div className="category-grid">
            {categories.map(category => (
              <div
                key={category.id}
                className="category-card"
                onClick={() => setActiveCategory(category.id)}
                style={{
                  opacity: activeCategory === 'all' || activeCategory === category.id ? 1 : 0.6
                }}
              >
                <div className="category-icon">{category.icon}</div>
                <div className="category-name">{category.name}</div>
                <div className="category-count">{category.count}个问题</div>
              </div>
            ))}
          </div>
          {activeCategory !== 'all' && (
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #667eea',
                borderRadius: '6px',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              查看全部
            </button>
          )}
        </div>

        {/* 常见问题 */}
        <div className="faq-section">
          <h3 className="section-title">常见问题</h3>
          {filteredFAQs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">没有找到相关问题</div>
              <div className="empty-hint">试试其他关键词</div>
            </div>
          ) : (
            <div className="faq-list">
              {filteredFAQs.map(faq => (
                <div
                  key={faq.id}
                  className={`faq-item ${expandedFAQ === faq.id ? 'active' : ''}`}
                >
                  <div className="faq-question" onClick={() => toggleFAQ(faq.id)}>
                    <span className="faq-question-text">{faq.question}</span>
                    <span className="faq-toggle">▼</span>
                  </div>
                  <div className="faq-answer">
                    <p className="faq-answer-text">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 联系我们 */}
        <div className="contact-section">
          <h3 className="section-title">联系我们</h3>
          <div className="contact-grid">
            <div className="contact-card" onClick={() => navigate('/feedback')}>
              <div className="contact-icon">💬</div>
              <div className="contact-name">问题反馈</div>
            </div>
            <div className="contact-card" onClick={() => alert('客服功能开发中...')}>
              <div className="contact-icon">👨‍💼</div>
              <div className="contact-name">在线客服</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
