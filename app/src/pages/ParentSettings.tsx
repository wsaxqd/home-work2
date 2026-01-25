import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import parentAPI from '../services/parentAPI'
import { useToast } from '../components/Toast'
import './ParentSettings.css'

interface ParentProfile {
  phone: string
  name: string
  email: string
  avatar?: string
}

interface NotificationSettings {
  learningReminder: boolean
  timeoutWarning: boolean
  achievementNotify: boolean
  weeklyReport: boolean
}

export default function ParentSettings() {
  const toast = useToast()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ParentProfile>({
    phone: '',
    name: '',
    email: '',
    avatar: ''
  })
  const [notifications, setNotifications] = useState<NotificationSettings>({
    learningReminder: true,
    timeoutWarning: true,
    achievementNotify: true,
    weeklyReport: true
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadParentProfile()
  }, [])

  const loadParentProfile = async () => {
    try {
      setIsLoading(true)
      const data = await parentAPI.getProfile()

      if (data) {
        setProfile({
          phone: data.phone || '',
          name: data.name || '家长',
          email: data.email || '',
          avatar: data.avatar || ''
        })

        // 加载通知设置
        if (data.notificationSettings) {
          setNotifications(data.notificationSettings)
        }
      }
    } catch (err: any) {
      console.error('加载家长信息失败:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileChange = (field: keyof ParentProfile, value: string) => {
    setProfile({
      ...profile,
      [field]: value
    })
  }

  const handleNotificationChange = (field: keyof NotificationSettings) => {
    setNotifications({
      ...notifications,
      [field]: !notifications[field]
    })
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await parentAPI.updateProfile({
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar
      })

      // 保存通知设置
      await parentAPI.updateNotificationSettings(notifications)

      toast.success('保存成功!')
    } catch (error: any) {
      toast.error(error.message || '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.info('请填写完整信息')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.info('两次密码不一致')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.info('新密码长度不能少于6位')
      return
    }

    try {
      await parentAPI.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      toast.success('密码修改成功!')
      setShowPasswordModal(false)
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      toast.error(error.message || '密码修改失败')
    }
  }

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗?')) {
      localStorage.removeItem('parentProfile')
      navigate('/parent/login')
    }
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      '警告：删除账号将清除所有数据且无法恢复，确定要继续吗?'
    )
    if (confirmed) {
      const doubleConfirm = window.confirm('请再次确认删除账号')
      if (doubleConfirm) {
        localStorage.removeItem('parentProfile')
        toast.success('账号已删除')
        navigate('/parent/login')
      }
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="parent-settings">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="parent-settings">
      {/* 页面头部 */}
      <div className="page-header">
        <div>
          <h2>设置</h2>
          <p>管理家长账号和偏好设置</p>
        </div>
      </div>

      {/* 个人信息 */}
      <div className="settings-section">
        <h3 className="section-title">👤 个人信息</h3>
        <div className="settings-content">
          <div className="form-group">
            <label>手机号</label>
            <input
              type="text"
              value={profile.phone}
              disabled
              className="disabled-input"
            />
            <span className="form-hint">手机号不可修改</span>
          </div>

          <div className="form-group">
            <label>姓名</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              placeholder="请输入姓名"
            />
          </div>

          <div className="form-group">
            <label>邮箱</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              placeholder="请输入邮箱"
            />
          </div>

          <button
            className="save-btn"
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>

      {/* 安全设置 */}
      <div className="settings-section">
        <h3 className="section-title">🔒 安全设置</h3>
        <div className="settings-content">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-name">修改密码</span>
              <span className="setting-desc">定期修改密码，保护账号安全</span>
            </div>
            <button
              className="action-btn"
              onClick={() => setShowPasswordModal(true)}
            >
              修改
            </button>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-name">登录历史</span>
              <span className="setting-desc">查看最近的登录记录</span>
            </div>
            <button className="action-btn" onClick={() => toast.info('功能开发中')}>
              查看
            </button>
          </div>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="settings-section">
        <h3 className="section-title">🔔 通知设置</h3>
        <div className="settings-content">
          <div className="notification-item">
            <div className="notification-info">
              <span className="notification-name">学习提醒</span>
              <span className="notification-desc">孩子开始学习时接收通知</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifications.learningReminder}
                onChange={() => handleNotificationChange('learningReminder')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="notification-item">
            <div className="notification-info">
              <span className="notification-name">超时提醒</span>
              <span className="notification-desc">使用时间超限时接收通知</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifications.timeoutWarning}
                onChange={() => handleNotificationChange('timeoutWarning')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="notification-item">
            <div className="notification-info">
              <span className="notification-name">成就通知</span>
              <span className="notification-desc">孩子获得成就时接收通知</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifications.achievementNotify}
                onChange={() => handleNotificationChange('achievementNotify')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="notification-item">
            <div className="notification-info">
              <span className="notification-name">周报推送</span>
              <span className="notification-desc">每周日接收成长报告</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifications.weeklyReport}
                onChange={() => handleNotificationChange('weeklyReport')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* 其他操作 */}
      <div className="settings-section">
        <h3 className="section-title">⚙️ 其他操作</h3>
        <div className="settings-content">
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
          <button className="danger-btn" onClick={handleDeleteAccount}>
            删除账号
          </button>
        </div>
      </div>

      {/* 修改密码模态框 */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>修改密码</h3>
              <button
                className="close-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>原密码</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    oldPassword: e.target.value
                  })}
                  placeholder="请输入原密码"
                />
              </div>

              <div className="form-group">
                <label>新密码</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value
                  })}
                  placeholder="请输入新密码（至少6位）"
                />
              </div>

              <div className="form-group">
                <label>确认新密码</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value
                  })}
                  placeholder="请再次输入新密码"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                取消
              </button>
              <button className="submit-btn" onClick={handleChangePassword}>
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
