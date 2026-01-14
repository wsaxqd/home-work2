import { useState, useRef, useEffect } from 'react'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import './Assessment.css'

const questions = [
  { id: 1, text: '你更喜欢哪种活动？', options: ['画画涂色', '唱歌跳舞', '讲故事', '玩游戏'] },
  { id: 2, text: '遇到困难时你会怎么做？', options: ['自己想办法', '请教别人', '休息一下再试', '换个方法'] },
  { id: 3, text: '你喜欢和多少人一起玩？', options: ['一个人', '2-3个朋友', '一群小伙伴', '都可以'] },
]

const abilities = [
  { name: '创造力', value: 85, color: '#4caf50' },
  { name: '表达力', value: 72, color: '#2196f3' },
  { name: '情绪力', value: 68, color: '#e91e63' },
  { name: '专注力', value: 80, color: '#ff9800' },
  { name: '合作力', value: 75, color: '#9c27b0' },
]

export default function Assessment() {
  const usageTrackerRef = useRef<UsageTracker | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // 评估完成,记录结果
      setShowResult(true)

      // 记录评估数据
      if (usageTrackerRef.current) {
        const avgAbility = abilities.reduce((sum, a) => sum + a.value, 0) / abilities.length;
        usageTrackerRef.current.end(avgAbility, {
          totalQuestions: questions.length,
          completedQuestions: newAnswers.length,
          abilities: abilities.map(a => ({ name: a.name, value: a.value })),
        });
        usageTrackerRef.current = null; // 清空引用
      }
    }
  }

  const resetAssessment = () => {
    setCurrentQuestion(0)
    setAnswers([])
    setShowResult(false)

    // 重新开始评估,启动新的追踪
    if (usageTrackerRef.current) {
      usageTrackerRef.current.cancel();
    }
    usageTrackerRef.current = new UsageTracker('学习', '能力评估', {
      totalQuestions: questions.length,
    });
    usageTrackerRef.current.start();
  }

  // 启动使用追踪
  useEffect(() => {
    // 创建追踪器并开始记录
    usageTrackerRef.current = new UsageTracker('学习', '能力评估', {
      totalQuestions: questions.length,
    });
    usageTrackerRef.current.start();

    // 组件卸载时记录数据(如果未完成评估)
    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.end(undefined, {
          totalQuestions: questions.length,
          completedQuestions: answers.length,
          completed: showResult,
        });
      }
    };
  }, []);

  return (
    <Layout>
      <Header title="能力评估" gradient="linear-gradient(135deg, #00bcd4 0%, #009688 100%)" />
      <div className="main-content">
        {!showResult ? (
          <div className="assessment-section">
            <div className="progress-info">
              <span>问题 {currentQuestion + 1} / {questions.length}</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="question-card">
              <div className="question-icon">🤔</div>
              <div className="question-text">{questions[currentQuestion].text}</div>
              <div className="options-list">
                {questions[currentQuestion].options.map((option, index) => (
                  <div
                    key={index}
                    className="option-item"
                    onClick={() => handleAnswer(option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="result-section">
            <div className="result-header">
              <div className="result-icon">🎉</div>
              <h2>评估完成！</h2>
              <p>根据你的回答，AI分析了你的能力特点</p>
            </div>

            <div className="section-title">能力雷达</div>
            <div className="abilities-list">
              {abilities.map((ability) => (
                <div key={ability.name} className="ability-item">
                  <div className="ability-header">
                    <span className="ability-name">{ability.name}</span>
                    <span className="ability-value">{ability.value}%</span>
                  </div>
                  <div className="ability-bar">
                    <div
                      className="ability-fill"
                      style={{ width: `${ability.value}%`, background: ability.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="section-title">AI建议</div>
            <div className="suggestion-card">
              <div className="suggestion-icon">💡</div>
              <div className="suggestion-content">
                <p>你的创造力很强！建议多尝试AI绘画和故事创作。</p>
                <p>情绪管理方面可以多使用心灵花园功能。</p>
              </div>
            </div>

            <button className="btn btn-primary reset-btn" onClick={resetAssessment}>
              重新评估
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
