import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import './Login.css'

const avatars = ['🦁', '🐰', '🐼', '🦊', '🐯', '🐨']

export default function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 切换登录/注册模式时清空表单和错误
  const handleModeSwitch = (loginMode: boolean) => {
    setIsLogin(loginMode)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  // 表单验证
  const validateForm = () => {
    // 清空之前的错误
    setError('')

    if (!username || !password) {
      setError('⚠️ 请输入用户名和密码')
      return false
    }

    if (username.length < 3) {
      setError('⚠️ 用户名至少需要3个字符')
      return false
    }

    if (password.length < 6) {
      setError('⚠️ 密码至少需要6个字符')
      return false
    }

    if (!isLogin) {
      // 注册模式的额外验证
      if (!confirmPassword) {
        setError('⚠️ 请确认密码')
        return false
      }

      if (password !== confirmPassword) {
        setError('⚠️ 两次输入的密码不一致，请重新输入')
        return false
      }

      if (!selectedAvatar || !nickname || !age) {
        setError('⚠️ 请完善所有注册信息')
        return false
      }

      if (nickname.length < 2) {
        setError('⚠️ 昵称至少需要2个字符')
        return false
      }
    }

    return true
  }

  const handleRegister = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await authApi.register({
        username,
        password,
        nickname,
        avatar: selectedAvatar,
        age: parseInt(age)
      })

      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userProfile', JSON.stringify(response.data.user))
        navigate('/home')
      } else {
        setError('❌ ' + (response.error || '注册失败，请稍后重试'))
      }
    } catch (err: any) {
      setError('❌ ' + (err.message || '网络错误，请检查连接后重试'))
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await authApi.login({
        username,
        password
      })

      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userProfile', JSON.stringify(response.data.user))
        navigate('/home')
      } else {
        setError('❌ ' + (response.error || '登录失败，请检查用户名和密码'))
      }
    } catch (err: any) {
      setError('❌ ' + (err.message || '网络错误，请检查连接后重试'))
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    if (isLogin) {
      handleLogin()
    } else {
      handleRegister()
    }
  }

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="login-logo">🌟</div>
        <h1>欢迎来到启蒙之光</h1>
        <p>让我们开始奇妙的探索之旅</p>
      </div>

      <div className="login-form">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px' }}>
          <button
            className={`btn ${!isLogin ? 'btn-primary' : ''}`}
            onClick={() => handleModeSwitch(false)}
            style={{ padding: '8px 20px' }}
          >
            注册
          </button>
          <button
            className={`btn ${isLogin ? 'btn-primary' : ''}`}
            onClick={() => handleModeSwitch(true)}
            style={{ padding: '8px 20px' }}
          >
            登录
          </button>
        </div>

        {error && (
          <div style={{
            color: '#d32f2f',
            textAlign: 'center',
            marginBottom: '15px',
            padding: '15px 20px',
            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            borderRadius: '12px',
            border: '2px solid #ef5350',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
            animation: 'shake 0.5s'
          }}>
            <div style={{ marginBottom: '5px', fontSize: '24px' }}>⚠️</div>
            {error}
          </div>
        )}

        <div className="form-section">
          <label className="form-label">用户名 *</label>
          <input
            type="text"
            className="form-input"
            placeholder="请输入用户名（至少3个字符）"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-section">
          <label className="form-label">密码 *</label>
          <input
            type="password"
            className="form-input"
            placeholder="请输入密码（至少6个字符）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {!isLogin && (
          <>
            <div className="form-section">
              <label className="form-label">确认密码 *</label>
              <input
                type="password"
                className="form-input"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  borderColor: confirmPassword && password !== confirmPassword ? '#ef5350' : undefined
                }}
              />
              {confirmPassword && password !== confirmPassword && (
                <div style={{ color: '#ef5350', fontSize: '12px', marginTop: '5px' }}>
                  ⚠️ 两次密码不一致
                </div>
              )}
            </div>
            <div className="form-section">
              <label className="form-label">选择你的头像 *</label>
              <div className="avatar-grid">
                {avatars.map((avatar) => (
                  <div
                    key={avatar}
                    className={`avatar-item ${selectedAvatar === avatar ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    {avatar}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">你的昵称 *</label>
              <input
                type="text"
                className="form-input"
                placeholder="给自己起个好听的名字（至少2个字符）"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="form-section">
              <label className="form-label">你的年龄 *</label>
              <select
                className="form-select"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              >
                <option value="">选择年龄</option>
                {[3,4,5,6,7,8,9,10,11,12].map((a) => (
                  <option key={a} value={a}>{a}岁</option>
                ))}
              </select>
            </div>
          </>
        )}

        <button
          className="btn btn-primary start-btn"
          disabled={loading}
          onClick={handleStart}
          style={{
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 处理中...' : (isLogin ? '登录 🚀' : '开始探索 🚀')}
        </button>

        {!isLogin && (
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#666',
            marginTop: '10px'
          }}>
            * 为必填项
          </div>
        )}
      </div>
    </div>
  )
}
