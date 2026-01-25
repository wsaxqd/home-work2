import { useState, useEffect } from 'react'
import parentAPI from '../services/parentAPI'
import { useToast } from '../components/Toast'
import './UsageControl.css'

interface ChildInfo {
  id: number
  user_id: string
  nickname: string
  age: number
  gender: string
  avatar: string
}

interface TimeControl {
  dailyLimit: number
  gameLimit: number
  startTime: string
  endTime: string
  enabled: boolean
}

interface ContentControl {
  games: boolean
  creation: boolean
  reading: boolean
  aiEncyclopedia: boolean
}

export default function UsageControl() {
  const toast = useToast()
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null)
  const [timeControl, setTimeControl] = useState<TimeControl>({
    dailyLimit: 120,
    gameLimit: 30,
    startTime: '08:00',
    endTime: '20:00',
    enabled: true
  })
  const [contentControl, setContentControl] = useState<ContentControl>({
    games: true,
    creation: true,
    reading: true,
    aiEncyclopedia: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const handleTimeControlChange = (field: keyof TimeControl, value: any) => {
    setTimeControl({
      ...timeControl,
      [field]: value
    })
  }

  const handleContentControlChange = (field: keyof ContentControl) => {
    setContentControl({
      ...contentControl,
      [field]: !contentControl[field]
    })
  }

  // 加载孩子列表
  useEffect(() => {
    loadChildren()
  }, [])

  // 当选中的孩子变化时,加载该孩子的控制设置
  useEffect(() => {
    if (selectedChild) {
      loadControlSettings(selectedChild.user_id)
    }
  }, [selectedChild])

  const loadChildren = async () => {
    try {
      setIsLoading(true)
      const childrenData = await parentAPI.getChildren()

      if (childrenData && childrenData.length > 0) {
        setChildren(childrenData)
        setSelectedChild(childrenData[0])
      } else {
        setChildren([])
        setSelectedChild(null)
      }
    } catch (err: any) {
      console.error('加载孩子列表失败:', err)
      toast.info(err.message || '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const loadControlSettings = async (userId: string) => {
    try {
      const settings = await parentAPI.getControlSettings(parseInt(userId))

      if (settings) {
        // 更新时间控制设置
        if (settings.timeControl) {
          setTimeControl({
            dailyLimit: settings.timeControl.dailyLimit || 120,
            gameLimit: settings.timeControl.gameLimit || 30,
            startTime: settings.timeControl.startTime || '08:00',
            endTime: settings.timeControl.endTime || '20:00',
            enabled: settings.timeControl.enabled !== false
          })
        }

        // 更新内容控制设置
        if (settings.contentControl) {
          setContentControl({
            games: settings.contentControl.games !== false,
            creation: settings.contentControl.creation !== false,
            reading: settings.contentControl.reading !== false,
            aiEncyclopedia: settings.contentControl.aiEncyclopedia !== false
          })
        }
      }
    } catch (err: any) {
      console.error('加载控制设置失败:', err)
    }
  }

  const handleSave = async () => {
    if (!selectedChild) {
      toast.info('请先选择孩子')
      return
    }

    setIsSaving(true)
    try {
      await parentAPI.updateControlSettings(parseInt(selectedChild.user_id), {
        ...timeControl,
        contentControls: contentControl
      })
      toast.success('设置已保存!')
    } catch (error: any) {
      toast.error(error.message || '保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="usage-control">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  // 空状态
  if (!selectedChild || children.length === 0) {
    return (
      <div className="usage-control">
        <div className="empty-state">
          <div className="empty-icon">👶</div>
          <h3>还没有绑定孩子账号</h3>
          <p>请先添加孩子账号,才能设置使用控制</p>
        </div>
      </div>
    )
  }

  return (
    <div className="usage-control">
      {/* 页面头部 */}
      <div className="page-header">
        <div>
          <h2>使用控制</h2>
          <p>设置 {selectedChild.nickname} 的使用时间和内容权限</p>
        </div>
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存设置'}
        </button>
      </div>

      {/* 孩子选择器 */}
      {children.length > 1 && (
        <div className="child-selector">
          {children.map(child => (
            <button
              key={child.id}
              className={`child-card ${selectedChild?.id === child.id ? 'active' : ''}`}
              onClick={() => setSelectedChild(child)}
            >
              <span className="child-avatar">{child.avatar || (child.gender === '男' ? '👦' : '👧')}</span>
              <div className="child-info">
                <span className="child-name">{child.nickname}</span>
                <span className="child-age">{child.age}岁</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 时间控制 */}
      <div className="control-section">
        <div className="section-header">
          <h3>⏰ 时间控制</h3>
          <label className="switch">
            <input
              type="checkbox"
              checked={timeControl.enabled}
              onChange={(e) => handleTimeControlChange('enabled', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className={`section-content ${!timeControl.enabled ? 'disabled' : ''}`}>
          {/* 每日使用时长 */}
          <div className="control-item">
            <div className="control-label">
              <span className="label-text">每日使用时长限制</span>
              <span className="label-value">{timeControl.dailyLimit}分钟</span>
            </div>
            <input
              type="range"
              min="30"
              max="300"
              step="10"
              value={timeControl.dailyLimit}
              onChange={(e) => handleTimeControlChange('dailyLimit', parseInt(e.target.value))}
              disabled={!timeControl.enabled}
            />
            <div className="range-labels">
              <span>30分钟</span>
              <span>300分钟</span>
            </div>
          </div>

          {/* 游戏时长限制 */}
          <div className="control-item">
            <div className="control-label">
              <span className="label-text">游戏时长限制</span>
              <span className="label-value">{timeControl.gameLimit}分钟</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={timeControl.gameLimit}
              onChange={(e) => handleTimeControlChange('gameLimit', parseInt(e.target.value))}
              disabled={!timeControl.enabled}
            />
            <div className="range-labels">
              <span>10分钟</span>
              <span>120分钟</span>
            </div>
          </div>

          {/* 可用时间段 */}
          <div className="control-item">
            <div className="control-label">
              <span className="label-text">可用时间段</span>
            </div>
            <div className="time-range-inputs">
              <div className="time-input-group">
                <label>开始时间</label>
                <input
                  type="time"
                  value={timeControl.startTime}
                  onChange={(e) => handleTimeControlChange('startTime', e.target.value)}
                  disabled={!timeControl.enabled}
                />
              </div>
              <span className="time-separator">至</span>
              <div className="time-input-group">
                <label>结束时间</label>
                <input
                  type="time"
                  value={timeControl.endTime}
                  onChange={(e) => handleTimeControlChange('endTime', e.target.value)}
                  disabled={!timeControl.enabled}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容访问控制 */}
      <div className="control-section">
        <div className="section-header">
          <h3>🔒 内容访问控制</h3>
        </div>

        <div className="section-content">
          <div className="content-controls">
            <div className="content-item">
              <div className="content-info">
                <span className="content-icon">🎮</span>
                <div className="content-text">
                  <span className="content-name">游戏中心</span>
                  <span className="content-desc">包含所有益智游戏</span>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={contentControl.games}
                  onChange={() => handleContentControlChange('games')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="content-item">
              <div className="content-info">
                <span className="content-icon">🎨</span>
                <div className="content-text">
                  <span className="content-name">创作工具</span>
                  <span className="content-desc">绘画、音乐、故事创作</span>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={contentControl.creation}
                  onChange={() => handleContentControlChange('creation')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="content-item">
              <div className="content-info">
                <span className="content-icon">📚</span>
                <div className="content-text">
                  <span className="content-name">阅读内容</span>
                  <span className="content-desc">绘本、故事、四大名著</span>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={contentControl.reading}
                  onChange={() => handleContentControlChange('reading')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="content-item">
              <div className="content-info">
                <span className="content-icon">🤖</span>
                <div className="content-text">
                  <span className="content-name">AI百科</span>
                  <span className="content-desc">AI问答和知识学习</span>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={contentControl.aiEncyclopedia}
                  onChange={() => handleContentControlChange('aiEncyclopedia')}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="info-box">
        <span className="info-icon">💡</span>
        <div className="info-text">
          <strong>温馨提示：</strong>
          <p>• 时间限制到达后，应用将自动锁定，需要家长解锁</p>
          <p>• 关闭的内容模块将在儿童端隐藏</p>
          <p>• 建议根据孩子年龄和学习情况合理设置</p>
        </div>
      </div>
    </div>
  )
}
