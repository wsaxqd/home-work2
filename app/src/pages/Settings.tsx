import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { authApi } from '../services/api'
import type { User } from '../types'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'notifications'>('account')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 账户设置
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')

  // 偏好设置
  const [language, setLanguage] = useState('zh-CN')
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')

  // 通知设置
  const [systemNotifications, setSystemNotifications] = useState(true)
  const [learningReminders, setLearningReminders] = useState(true)
  const [messagePush, setMessagePush] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const response = await authApi.getCurrentUser()
      if (response.success && response.data) {
        setUser(response.data)
        setNickname(response.data.nickname || '')
        setBio(response.data.bio || '')
        setAvatar(response.data.avatar || '')
      }
    } catch (error) {
      console.error('加载用户数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAccount = async () => {
    setSaving(true)
    try {
      const response = await authApi.updateProfile({
        nickname,
        bio,
        avatar
      })
      if (response.success) {
        alert('保存成功')
        // 更新本地存储
        const localProfile = localStorage.getItem('userProfile')
        if (localProfile) {
          const profile = JSON.parse(localProfile)
          profile.nickname = nickname
          profile.bio = bio
          profile.avatar = avatar
          localStorage.setItem('userProfile', JSON.stringify(profile))
        }
      }
    } catch (error) {
      console.error('保存失败', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = () => {
    // 保存偏好设置到localStorage
    localStorage.setItem('userPreferences', JSON.stringify({
      language,
      theme,
      fontSize
    }))
    alert('偏好设置已保存')
  }

  const handleSaveNotifications = () => {
    // 保存通知设置到localStorage
    localStorage.setItem('notificationSettings', JSON.stringify({
      systemNotifications,
      learningReminders,
      messagePush
    }))
    alert('通知设置已保存')
  }

  if (loading) {
    return (
      <Layout>
        <Header title="设置" showBack={true} />
        <div className="main-content" style={{ textAlign: 'center', padding: '40px' }}>
          <div>加载中...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Header title="设置" showBack={true} />
      <div className="main-content settings-page">
        {/* 标签页导航 */}
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            账户设置
          </button>
          <button
            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            偏好设置
          </button>
          <button
            className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            通知设置
          </button>
        </div>

        {/* 账户设置 */}
        {activeTab === 'account' && (
          <div className="settings-section">
            <div className="settings-card">
              <h3>个人信息</h3>

              <div className="form-group">
                <label>头像</label>
                <div className="avatar-upload">
                  <img
                    src={avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (user?.username || 'default')}
                    alt="头像"
                    className="avatar-preview"
                  />
                  <button className="upload-button">更换头像</button>
                </div>
              </div>

              <div className="form-group">
                <label>昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="请输入昵称"
                  maxLength={20}
                />
              </div>

              <div className="form-group">
                <label>个人简介</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="介绍一下自己吧"
                  maxLength={200}
                  rows={4}
                />
              </div>

              <button
                className="save-button"
                onClick={handleSaveAccount}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>

            <div className="settings-card">
              <h3>账户安全</h3>
              <div className="menu-item" onClick={() => navigate('/account-security')}>
                <span>🔒 密码与安全</span>
                <span className="arrow">›</span>
              </div>
            </div>
          </div>
        )}

        {/* 偏好设置 */}
        {activeTab === 'preferences' && (
          <div className="settings-section">
            <div className="settings-card">
              <h3>显示设置</h3>

              <div className="form-group">
                <label>语言</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>

              <div className="form-group">
                <label>主题模式</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="light"
                      checked={theme === 'light'}
                      onChange={(e) => setTheme(e.target.value as 'light')}
                    />
                    <span>浅色</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="dark"
                      checked={theme === 'dark'}
                      onChange={(e) => setTheme(e.target.value as 'dark')}
                    />
                    <span>深色</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="auto"
                      checked={theme === 'auto'}
                      onChange={(e) => setTheme(e.target.value as 'auto')}
                    />
                    <span>跟随系统</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>字体大小</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="small"
                      checked={fontSize === 'small'}
                      onChange={(e) => setFontSize(e.target.value as 'small')}
                    />
                    <span>小</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="medium"
                      checked={fontSize === 'medium'}
                      onChange={(e) => setFontSize(e.target.value as 'medium')}
                    />
                    <span>中</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="large"
                      checked={fontSize === 'large'}
                      onChange={(e) => setFontSize(e.target.value as 'large')}
                    />
                    <span>大</span>
                  </label>
                </div>
              </div>

              <button className="save-button" onClick={handleSavePreferences}>
                保存
              </button>
            </div>
          </div>
        )}

        {/* 通知设置 */}
        {activeTab === 'notifications' && (
          <div className="settings-section">
            <div className="settings-card">
              <h3>通知管理</h3>

              <div className="switch-item">
                <div className="switch-label">
                  <span>系统通知</span>
                  <small>接收系统重要通知</small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={systemNotifications}
                    onChange={(e) => setSystemNotifications(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="switch-item">
                <div className="switch-label">
                  <span>学习提醒</span>
                  <small>每日学习任务提醒</small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={learningReminders}
                    onChange={(e) => setLearningReminders(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="switch-item">
                <div className="switch-label">
                  <span>消息推送</span>
                  <small>接收评论和点赞通知</small>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={messagePush}
                    onChange={(e) => setMessagePush(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button className="save-button" onClick={handleSaveNotifications}>
                保存
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
