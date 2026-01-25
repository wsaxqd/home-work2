import { useState } from 'react'
import './TutorialModal.css'

interface Tutorial {
  id: string
  icon: string
  title: string
  description: string
  steps: {
    number: number
    title: string
    content: string
    example?: string
  }[]
  tips: string[]
}

const tutorials: Tutorial[] = [
  {
    id: 'art',
    icon: '🎨',
    title: 'AI绘画教程',
    description: '教你如何用AI创作精美的图画',
    steps: [
      {
        number: 1,
        title: '输入描述',
        content: '在输入框中详细描述你想画的内容，越详细越好！',
        example: '示例：画一只穿着红色衣服的可爱小猫，坐在草地上，背景是蓝天白云'
      },
      {
        number: 2,
        title: '选择风格',
        content: '选择你喜欢的画风，比如卡通、写实、水彩等',
        example: '提示：儿童画适合选择"卡通"或"可爱"风格'
      },
      {
        number: 3,
        title: '生成图画',
        content: '点击"开始创作"按钮，等待AI为你生成图画',
        example: '生成时间约10-30秒，请耐心等待'
      },
      {
        number: 4,
        title: '保存作品',
        content: '如果喜欢，可以保存到"我的作品"，还能分享给小伙伴哦！',
        example: '可以给作品起个好听的名字'
      }
    ],
    tips: [
      '描述越详细，画出来的效果越好',
      '可以多尝试几次，每次AI画的都不一样',
      '试试用"可爱的"、"梦幻的"这样的形容词',
      '可以描述颜色、动作、表情等细节'
    ]
  },
  {
    id: 'music',
    icon: '🎵',
    title: 'AI音乐教程',
    description: '教你如何创作属于自己的音乐',
    steps: [
      {
        number: 1,
        title: '选择风格',
        content: '选择音乐的风格和情绪，比如欢快、舒缓、活泼等',
        example: '示例：欢快的儿童歌曲、轻松的钢琴曲'
      },
      {
        number: 2,
        title: '设置参数',
        content: '可以设置音乐的节奏快慢、音调高低等',
        example: '新手建议：使用默认参数就很好听'
      },
      {
        number: 3,
        title: '生成音乐',
        content: '点击"开始创作"，AI会为你谱写一段独特的旋律',
        example: '生成时间约15-45秒'
      },
      {
        number: 4,
        title: '试听保存',
        content: '点击播放按钮试听，满意了就保存下来吧！',
        example: '可以作为学习背景音乐'
      }
    ],
    tips: [
      '不同的情绪会创作出不同感觉的音乐',
      '可以为音乐取个好听的名字',
      '试试创作"摇篮曲"或"进行曲"',
      '音乐可以重复生成，直到满意为止'
    ]
  },
  {
    id: 'story',
    icon: '📖',
    title: 'AI故事教程',
    description: '教你如何编写精彩的故事',
    steps: [
      {
        number: 1,
        title: '设定主角',
        content: '给你的故事设定主角，可以是人、动物或任何你喜欢的角色',
        example: '示例：一只勇敢的小兔子、一个爱学习的小女孩'
      },
      {
        number: 2,
        title: '选择主题',
        content: '选择故事的主题，比如冒险、友情、成长等',
        example: '建议：从简单的主题开始，比如"日常生活"'
      },
      {
        number: 3,
        title: '添加情节',
        content: '输入你想要的故事情节或关键词',
        example: '示例：寻找宝藏、帮助朋友、克服困难'
      },
      {
        number: 4,
        title: '生成故事',
        content: 'AI会根据你的设定，创作一个完整的故事',
        example: '故事会有开头、发展和结尾'
      },
      {
        number: 5,
        title: '阅读分享',
        content: '阅读生成的故事，可以保存或分享给朋友',
        example: '还可以继续修改和完善故事'
      }
    ],
    tips: [
      '好的故事需要有趣的主角和情节',
      '可以加入一些转折和惊喜',
      '试试让主角遇到困难再解决',
      '可以从童话故事中寻找灵感'
    ]
  },
  {
    id: 'poem',
    icon: '✍️',
    title: 'AI诗词教程',
    description: '教你如何创作优美的诗词',
    steps: [
      {
        number: 1,
        title: '选择诗体',
        content: '选择你想创作的诗词类型，比如五言、七言、现代诗等',
        example: '新手推荐：现代诗更容易理解'
      },
      {
        number: 2,
        title: '确定主题',
        content: '选择诗词的主题，比如春天、友情、思念等',
        example: '示例：描写四季、自然风景、动物植物'
      },
      {
        number: 3,
        title: '输入关键词',
        content: '输入你想在诗中出现的关键词',
        example: '示例：花朵、小鸟、阳光、快乐'
      },
      {
        number: 4,
        title: '生成诗词',
        content: 'AI会创作符合韵律和意境的诗词',
        example: '可以多次生成，选择最喜欢的'
      },
      {
        number: 5,
        title: '学习鉴赏',
        content: '读一读生成的诗词，理解其中的意境和韵律',
        example: '可以朗读出来，感受诗歌的美'
      }
    ],
    tips: [
      '诗词讲究韵律和意境',
      '可以从简单的四句诗开始',
      '试着用比喻和拟人的手法',
      '多读古诗词可以提高创作水平'
    ]
  }
]

interface TutorialModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null)

  if (!isOpen) return null

  const currentTutorial = tutorials.find(t => t.id === selectedTutorial)

  return (
    <div className="tutorial-modal-overlay" onClick={onClose}>
      <div className="tutorial-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="tutorial-close-btn" onClick={onClose}>✕</button>

        {!currentTutorial ? (
          // 教程列表
          <div className="tutorial-list">
            <div className="tutorial-header">
              <div className="tutorial-header-icon">🎓</div>
              <h2 className="tutorial-header-title">新手教程</h2>
              <p className="tutorial-header-desc">选择一个工具查看详细使用教程</p>
            </div>

            <div className="tutorial-grid">
              {tutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className="tutorial-card"
                  onClick={() => setSelectedTutorial(tutorial.id)}
                >
                  <div className="tutorial-card-icon">{tutorial.icon}</div>
                  <div className="tutorial-card-title">{tutorial.title}</div>
                  <div className="tutorial-card-desc">{tutorial.description}</div>
                  <div className="tutorial-card-action">查看教程 →</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // 详细教程
          <div className="tutorial-detail">
            <button
              className="tutorial-back-btn"
              onClick={() => setSelectedTutorial(null)}
            >
              ← 返回
            </button>

            <div className="tutorial-detail-header">
              <div className="tutorial-detail-icon">{currentTutorial.icon}</div>
              <div>
                <h2 className="tutorial-detail-title">{currentTutorial.title}</h2>
                <p className="tutorial-detail-desc">{currentTutorial.description}</p>
              </div>
            </div>

            <div className="tutorial-steps">
              <h3 className="tutorial-section-title">📋 操作步骤</h3>
              {currentTutorial.steps.map((step) => (
                <div key={step.number} className="tutorial-step">
                  <div className="step-number">{step.number}</div>
                  <div className="step-content">
                    <div className="step-title">{step.title}</div>
                    <div className="step-description">{step.content}</div>
                    {step.example && (
                      <div className="step-example">
                        <span className="example-label">💡</span>
                        <span className="example-text">{step.example}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="tutorial-tips">
              <h3 className="tutorial-section-title">💎 小技巧</h3>
              <ul className="tips-list">
                {currentTutorial.tips.map((tip, index) => (
                  <li key={index} className="tip-item">
                    <span className="tip-dot">•</span>
                    <span className="tip-text">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="tutorial-footer">
              <button className="tutorial-start-btn" onClick={onClose}>
                开始创作 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
