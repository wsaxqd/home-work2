import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { diaryApi } from '../services/api/diary'
import { aiApi } from '../services/api/ai'
import './MoodDiary.css'

interface DiaryEntry {
  id: string
  date: Date
  mood: 'happy' | 'sad' | 'angry' | 'worried' | 'excited' | 'calm'
  content: string
  voiceNote?: string
  drawing?: string
  aiResponse?: string
}

const MOODS = [
  { id: 'happy', emoji: '😊', label: '开心', color: '#ffd93d' },
  { id: 'sad', emoji: '😢', label: '难过', color: '#6bcfff' },
  { id: 'angry', emoji: '😠', label: '生气', color: '#ff6b6b' },
  { id: 'worried', emoji: '😰', label: '担心', color: '#a29bfe' },
  { id: 'excited', emoji: '🤩', label: '兴奋', color: '#fd79a8' },
  { id: 'calm', emoji: '😌', label: '平静', color: '#81ecec' }
]

export default function MoodDiary() {
  const navigate = useNavigate()
  const [view, setView] = useState<'list' | 'write'>('list')
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [content, setContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [showAIResponse, setShowAIResponse] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  // 加载日记
  useEffect(() => {
    loadDiaries()
  }, [])

  const loadDiaries = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await diaryApi.getDiaries({ page: 1, limit: 50 })
      const diaryEntries: DiaryEntry[] = response.items.map((diary: any) => ({
        id: diary.id,
        date: new Date(diary.createdAt),
        mood: diary.mood,
        content: diary.content,
        aiResponse: diary.aiResponse
      }))
      setEntries(diaryEntries)
    } catch (err: any) {
      console.error('加载日记失败:', err)
      setError('加载日记失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 保存日记
  const saveDiary = async () => {
    if (!selectedMood || !content.trim()) {
      alert('请选择心情并写下你的想法')
      return
    }

    setSaving(true)
    setError('')

    try {
      // 先调用AI获取情感分析和鼓励回复
      let aiResponse = ''
      try {
        const emotionResult = await aiApi.analyzeEmotion(content)
        const moodLabels: Record<string, string> = {
          happy: '开心', sad: '难过', angry: '生气',
          worried: '担心', excited: '兴奋', calm: '平静'
        }
        const moodLabel = moodLabels[selectedMood] || selectedMood

        const chatResponse = await aiApi.chat({
          messages: [{
            role: 'system',
            content: `你是一个温暖的心理陪伴者，用户写了一篇心情为"${moodLabel}"的日记。请给予简短（1-2句话）、温暖、鼓励的回复。`
          }, {
            role: 'user',
            content: content
          }]
        })
        aiResponse = chatResponse.response
      } catch (aiErr) {
        console.error('AI回复生成失败:', aiErr)
        aiResponse = generateAIResponse(selectedMood, content)
      }

      // 创建日记
      const diaryData = {
        mood: selectedMood,
        content: content.trim(),
        aiResponse: aiResponse
      }

      const newDiary = await diaryApi.createDiary(diaryData)

      const newEntry: DiaryEntry = {
        id: newDiary.id,
        date: new Date(newDiary.createdAt),
        mood: newDiary.mood as any,
        content: newDiary.content,
        aiResponse: newDiary.aiResponse
      }

      setEntries([newEntry, ...entries])

      // 显示AI回复
      setShowAIResponse(true)
      setTimeout(() => {
        setShowAIResponse(false)
        setView('list')
        setSelectedMood('')
        setContent('')
      }, 3000)
    } catch (err: any) {
      console.error('保存日记失败:', err)
      setError('保存日记失败，请稍后重试')
      alert('保存日记失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  // 生成AI鼓励回复
  const generateAIResponse = (mood: string, text: string): string => {
    const responses: Record<string, string[]> = {
      happy: [
        '看到你这么开心，我也很高兴！继续保持这份快乐哦！✨',
        '太棒了！把这份快乐记录下来，以后可以回来看看！🌟',
        '你的笑容一定很灿烂！希望你每天都这么开心！😊'
      ],
      sad: [
        '我能感受到你的难过。没关系，哭出来也是一种释放。我会一直陪着你的。💙',
        '每个人都会有难过的时候，这很正常。明天会更好的，相信我！🌈',
        '你很勇敢，愿意把难过写下来。慢慢来，一切都会好起来的。🤗'
      ],
      angry: [
        '我理解你现在很生气。深呼吸，让自己冷静一下。生气会伤害自己哦。💚',
        '生气的时候写下来是个好办法！等心情平复了，再想想怎么解决问题。',
        '你有权利生气，但不要让愤怒控制你。你比你想象的更强大！💪'
      ],
      worried: [
        '不要太担心啦！很多担心的事情最后都不会发生。相信自己！🌟',
        '我知道你在担心，但你已经很努力了。一步一步来，会好的！',
        '担心说明你很在乎，这是好事。但也要学会放松，给自己一些时间。'
      ],
      excited: [
        '哇！你的兴奋感染到我了！一定发生了很棒的事情！🎉',
        '太好了！这种兴奋的感觉要好好珍惜！继续加油！✨',
        '看到你这么兴奋，我也为你感到高兴！享受这个美好时刻！🌟'
      ],
      calm: [
        '平静是一种很好的状态。享受这份宁静吧！🍃',
        '能保持平静很不容易，你做得很好！继续保持这份心境。',
        '平静的心能看到更多美好。希望你一直这么从容！😌'
      ]
    }

    const moodResponses = responses[mood] || responses.happy
    return moodResponses[Math.floor(Math.random() * moodResponses.length)]
  }

  return (
    <Layout>
      <Header
        title="心情日记"
        gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
        rightButton={
          <button
            className="header-action-btn"
            onClick={() => setView(view === 'list' ? 'write' : 'list')}
          >
            {view === 'list' ? '✏️ 写日记' : '📋 查看'}
          </button>
        }
      />
      <div className="mood-diary-container">

      {/* 列表视图 */}
      {view === 'list' && (
        <div className="diary-list">
          {entries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📔</div>
              <p className="empty-text">还没有日记哦</p>
              <p className="empty-hint">点击右上角"写日记"开始记录你的心情吧！</p>
            </div>
          ) : (
            <div className="entries-grid">
              {entries.map((entry) => {
                const mood = MOODS.find(m => m.id === entry.mood)
                return (
                  <div key={entry.id} className="diary-card">
                    <div className="card-header">
                      <div className="mood-badge" style={{ background: mood?.color }}>
                        <span className="mood-emoji">{mood?.emoji}</span>
                        <span className="mood-label">{mood?.label}</span>
                      </div>
                      <div className="card-date">
                        {entry.date.toLocaleDateString('zh-CN', {
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="card-content">{entry.content}</div>
                    {entry.aiResponse && (
                      <div className="ai-response">
                        <span className="ai-icon">🤗</span>
                        <span className="ai-text">{entry.aiResponse}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 写日记视图 */}
      {view === 'write' && (
        <div className="diary-write">
          <div className="write-section">
            <h3 className="section-title">今天的心情是？</h3>
            <div className="mood-selector">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  className={`mood-btn ${selectedMood === mood.id ? 'selected' : ''}`}
                  style={{
                    background: selectedMood === mood.id ? mood.color : '#f7fafc',
                    borderColor: selectedMood === mood.id ? mood.color : '#e2e8f0'
                  }}
                  onClick={() => setSelectedMood(mood.id)}
                >
                  <span className="mood-emoji-large">{mood.emoji}</span>
                  <span className="mood-label-small">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="write-section">
            <h3 className="section-title">写下你的想法</h3>
            <textarea
              className="diary-textarea"
              placeholder="今天发生了什么？你有什么想说的吗？&#10;&#10;可以写下：&#10;• 开心的事情&#10;• 难过的原因&#10;• 想念的人&#10;• 任何你想记录的..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
            />
          </div>

          <button className="save-btn" onClick={saveDiary}>
            保存日记 💾
          </button>
        </div>
      )}

      {/* AI回复弹窗 */}
      {showAIResponse && entries.length > 0 && (
        <div className="ai-response-modal">
          <div className="modal-content">
            <div className="modal-icon">🤗</div>
            <p className="modal-text">{entries[0].aiResponse}</p>
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}
