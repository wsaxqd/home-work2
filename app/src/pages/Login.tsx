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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (!selectedAvatar || !nickname || !age || !username || !password) {
      setError('请填写所有信息')
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
        setError(response.error || '注册失败')
      }
    } catch (err: any) {
      setError(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码')
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
        setError(response.error || '登录失败')
      }
    } catch (err: any) {
      setError(err.message || '登录失败')
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
            onClick={() => setIsLogin(false)}
            style={{ padding: '8px 20px' }}
          >
            注册
          </button>
          <button
            className={`btn ${isLogin ? 'btn-primary' : ''}`}
            onClick={() => setIsLogin(true)}
            style={{ padding: '8px 20px' }}
          >
            登录
          </button>
        </div>

        {error && (
          <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px', padding: '10px', background: '#fee', borderRadius: '5px' }}>
            {error}
          </div>
        )}

        <div className="form-section">
          <label className="form-label">用户名</label>
          <input
            type="text"
            className="form-input"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-section">
          <label className="form-label">密码</label>
          <input
            type="password"
            className="form-input"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {!isLogin && (
          <>
            <div className="form-section">
              <label className="form-label">选择你的头像</label>
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
              <label className="form-label">你的昵称</label>
              <input
                type="text"
                className="form-input"
                placeholder="给自己起个好听的名字"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="form-section">
              <label className="form-label">你的年龄</label>
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
          disabled={loading || (isLogin ? (!username || !password) : (!selectedAvatar || !nickname || !age || !username || !password))}
          onClick={handleStart}
        >
          {loading ? '加载中...' : (isLogin ? '登录 🚀' : '开始探索 🚀')}
        </button>
      </div>
    </div>
  )
}
