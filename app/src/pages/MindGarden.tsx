import { useState } from 'react'
import { Layout, Header } from '../components/layout'
import './MindGarden.css'

const moods = [
  { emoji: '😊', label: '开心', color: '#4caf50' },
  { emoji: '😌', label: '平静', color: '#03a9f4' },
  { emoji: '😔', label: '难过', color: '#9e9e9e' },
  { emoji: '😤', label: '生气', color: '#f44336' },
  { emoji: '😰', label: '焦虑', color: '#ff9800' },
  { emoji: '🥰', label: '感恩', color: '#e91e63' },
]

const flowers = ['🌸', '🌺', '🌻', '🌹', '🌷', '💐']

export default function MindGarden() {
  const [selectedMood, setSelectedMood] = useState('')
  const [thought, setThought] = useState('')
  const [gardenFlowers, setGardenFlowers] = useState<string[]>(['🌸', '🌺', '🌻'])

  const handleSubmit = () => {
    if (selectedMood && thought) {
      const randomFlower = flowers[Math.floor(Math.random() * flowers.length)]
      setGardenFlowers([...gardenFlowers, randomFlower])
      setSelectedMood('')
      setThought('')
      alert('记录成功！你的花园又开了一朵新花 ' + randomFlower)
    }
  }

  return (
    <Layout>
      <Header
        title="心灵花园"
        gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
        showBack={false}
        showLogout={true}
      />
      <div className="main-content">
        <div className="garden-intro">
          <div className="intro-icon">🌸</div>
          <div className="intro-text">
            <h3>欢迎来到心灵花园</h3>
            <p>记录心情，培养积极情绪，让花园越来越美丽</p>
          </div>
        </div>

        <div className="section-title">今天的心情</div>
        <div className="mood-grid">
          {moods.map((mood) => (
            <div
              key={mood.label}
              className={`mood-item ${selectedMood === mood.label ? 'selected' : ''}`}
              style={{ borderColor: selectedMood === mood.label ? mood.color : 'transparent' }}
              onClick={() => setSelectedMood(mood.label)}
            >
              <div className="mood-emoji">{mood.emoji}</div>
              <div className="mood-label">{mood.label}</div>
            </div>
          ))}
        </div>

        <div className="section-title">写下你的想法</div>
        <div className="thought-input">
          <textarea
            placeholder="今天发生了什么让你有这种心情呢？"
            value={thought}
            onChange={(e) => setThought(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary submit-btn"
          disabled={!selectedMood || !thought}
          onClick={handleSubmit}
        >
          记录心情 🌱
        </button>

        <div className="section-title">我的花园</div>
        <div className="garden-view">
          <div className="garden-ground">
            {gardenFlowers.map((flower, index) => (
              <div
                key={index}
                className="garden-flower"
                style={{
                  left: `${(index * 25) % 80 + 10}%`,
                  animationDelay: `${index * 0.2}s`
                }}
              >
                {flower}
              </div>
            ))}
          </div>
          <div className="garden-stats">
            已种植 {gardenFlowers.length} 朵花
          </div>
        </div>

        <div className="section-title">情绪小贴士</div>
        <div className="tips-card">
          <div className="tip-icon">💡</div>
          <div className="tip-content">
            <p>当你感到难过时，可以试试深呼吸：</p>
            <p>吸气4秒 → 屏息4秒 → 呼气4秒</p>
            <p>重复3次，你会感觉好很多哦！</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
