import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import TutorialModal from '../components/TutorialModal'
import './Create.css'

const createItems = [
  { icon: '🎨', title: 'AI绘画', desc: '输入描述，AI画出你的想象', path: '/art-creator', tips: '试试：画一只可爱的小猫' },
  { icon: '🎵', title: 'AI音乐', desc: '选择风格，创作独特的旋律', path: '/music-creator', tips: '试试：欢快的儿童音乐' },
  { icon: '📖', title: 'AI故事', desc: '设定角色，编写精彩故事', path: '/story-creator', tips: '试试：小兔子的冒险' },
  { icon: '✍️', title: 'AI诗词', desc: '学习古诗，创作自己的诗', path: '/poem-creator', tips: '试试：关于春天的诗' },
]

export default function Create() {
  const navigate = useNavigate()
  const [showTutorial, setShowTutorial] = useState(false)

  return (
    <Layout>
      <Header
        title="AI创作工坊"
        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        showBack={false}
        showLogout={true}
      />
      <div className="main-content">
        <div className="create-intro-new">
          <div className="intro-icon-big">✨</div>
          <div className="intro-content">
            <h3>释放你的创造力</h3>
            <p>选择一个工具，开始你的AI创作之旅！</p>
          </div>
        </div>

        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🎯</span>
            全部创作工具
          </div>
          <div className="section-subtitle">4个超酷的AI助手等你来玩</div>
        </div>

        <div className="create-tools-grid">
          {createItems.map((item) => (
            <div
              key={item.path}
              className="create-tool-card"
              onClick={() => navigate(item.path)}
            >
              <div className="tool-header">
                <div className="tool-icon-huge">{item.icon}</div>
                <div className="tool-badge">点击进入</div>
              </div>
              <div className="tool-title">{item.title}</div>
              <div className="tool-desc">{item.desc}</div>
              <div className="tool-tips">
                <span className="tips-label">💡 小提示：</span>
                <span className="tips-text">{item.tips}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="help-card" onClick={() => setShowTutorial(true)}>
          <div className="help-icon">🎓</div>
          <div className="help-content">
            <div className="help-title">新手教程</div>
            <div className="help-desc">不知道怎么玩？点击这里查看使用说明</div>
          </div>
          <div className="help-arrow">→</div>
        </div>
      </div>

      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </Layout>
  )
}
