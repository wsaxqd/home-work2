import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import './Login.css'

const avatars = ['🦁', '🐰', '🐼', '🦊', '🐯', '🐨']

type LoginMode = 'password' | 'sms' | 'register'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<LoginMode>('password')

  // 通用字段
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 验证码登录
  const [smsCode, setSmsCode] = useState('')
  const [countdown, setCountdown] = useState(0)

  // 注册字段
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 切换模式时清空表单
  const handleModeSwitch = (newMode: LoginMode) => {
    setMode(newMode)
    setError('')
    setPassword('')
    setConfirmPassword('')
    setSmsCode('')
    setPasswordStrength(0)
  }

  // 验证手机号
  const validatePhone = (phoneNum: string) => {
    return /^1[3-9]\d{9}$/.test(phoneNum)
  }

  // 检查密码强度
  const checkPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 6) strength++
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    return Math.min(strength, 3)
  }

  // 发送验证码
  const handleSendSms = async () => {
    if (!validatePhone(phone)) {
      setError('⚠️ 请输入正确的手机号')
      return
    }

    setCountdown(60)
    // 模拟发送验证码（实际应调用API）
    console.log('发送验证码到:', phone)
    // TODO: 实际项目中调用 await authApi.sendSms({ phone })
  }

  // 密码登录
  const handlePasswordLogin = async () => {
    if (!validatePhone(phone)) {
      setError('⚠️ 请输入正确的手机号')
      return
    }

    if (!password || password.length < 6) {
      setError('⚠️ 密码至少需要6个字符')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 使用手机号登录
      const response = await authApi.login({
        phone: phone,
        password
      })

      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userProfile', JSON.stringify(response.data.user))
        navigate('/create')
      } else {
        setError('❌ ' + (response.error || '登录失败，请检查手机号和密码'))
      }
    } catch (err: any) {
      setError('❌ ' + (err.message || '网络错误，请检查连接后重试'))
    } finally {
      setLoading(false)
    }
  }

  // 验证码登录
  const handleSmsLogin = async () => {
    if (!validatePhone(phone)) {
      setError('⚠️ 请输入正确的手机号')
      return
    }

    if (!smsCode || smsCode.length !== 6) {
      setError('⚠️ 请输入6位验证码')
      return
    }

    setLoading(true)
    setError('')

    // 模拟验证码登录
    setTimeout(() => {
      const user = {
        username: phone,
        nickname: '用户' + phone.slice(-4),
        avatar: '🌟',
        age: 8,
        level: 1,
        coins: 100
      }
      localStorage.setItem('token', 'sms-token-' + Date.now())
      localStorage.setItem('userProfile', JSON.stringify(user))
      navigate('/create')
    }, 500)
  }

  // 注册
  const handleRegister = async () => {
    if (!validatePhone(phone)) {
      setError('⚠️ 请输入正确的手机号')
      return
    }

    if (!password || password.length < 6) {
      setError('⚠️ 密码至少需要6个字符')
      return
    }

    if (password !== confirmPassword) {
      setError('⚠️ 两次输入的密码不一致，请重新输入')
      return
    }

    if (!selectedAvatar || !nickname || !age) {
      setError('⚠️ 请完善所有注册信息')
      return
    }

    if (nickname.length < 2) {
      setError('⚠️ 昵称至少需要2个字符')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await authApi.register({
        phone: phone,
        password,
        nickname,
        avatar: selectedAvatar,
        age: parseInt(age)
      })

      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userProfile', JSON.stringify(response.data.user))
        navigate('/create')
      } else {
        setError('❌ ' + (response.error || '注册失败，请稍后重试'))
      }
    } catch (err: any) {
      // 注册失败时，使用localStorage模拟
      const user = {
        username: phone,
        nickname,
        avatar: selectedAvatar,
        age: parseInt(age),
        level: 1,
        coins: 100
      }
      localStorage.setItem('token', 'local-token-' + Date.now())
      localStorage.setItem('userProfile', JSON.stringify(user))
      navigate('/create')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (mode === 'password') handlePasswordLogin()
    else if (mode === 'sms') handleSmsLogin()
    else handleRegister()
  }

  return (
    <div className="login-container-new">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="login-card">
        <div className="login-header-new">
          <div className="login-logo-new">🌟</div>
          <h1 className="login-title-new">启蒙之光</h1>
          <p className="login-subtitle-new">儿童AI创作平台</p>
        </div>

        {/* 模式切换标签 */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'password' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('password')}
          >
            <span className="tab-icon">🔐</span>
            密码登录
          </button>
          <button
            className={`mode-tab ${mode === 'sms' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('sms')}
          >
            <span className="tab-icon">📱</span>
            验证码登录
          </button>
          <button
            className={`mode-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('register')}
          >
            <span className="tab-icon">✨</span>
            新用户注册
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* 表单内容 */}
        <div className="form-content">
          {/* 手机号输入（所有模式共用） */}
          <div className="input-wrapper">
            <label className="input-label">
              <span className="label-icon">📱</span>
              手机号
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="请输入11位手机号"
              value={phone}
              maxLength={11}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            />
            {phone && !validatePhone(phone) && (
              <div className="input-hint error">请输入正确的手机号格式</div>
            )}
          </div>

          {/* 密码登录模式 */}
          {mode === 'password' && (
            <div className="input-wrapper">
              <label className="input-label">
                <span className="label-icon">🔒</span>
                密码
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {/* 验证码登录模式 */}
          {mode === 'sms' && (
            <div className="input-wrapper">
              <label className="input-label">
                <span className="label-icon">💬</span>
                验证码
              </label>
              <div className="sms-input-group">
                <input
                  type="text"
                  className="input-field sms-input"
                  placeholder="请输入6位验证码"
                  value={smsCode}
                  maxLength={6}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  className="sms-button"
                  onClick={handleSendSms}
                  disabled={countdown > 0 || !validatePhone(phone)}
                >
                  {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                </button>
              </div>
              <div className="input-hint">验证码已发送至您的手机，请注意查收</div>
            </div>
          )}

          {/* 注册模式 */}
          {mode === 'register' && (
            <>
              <div className="input-wrapper">
                <label className="input-label">
                  <span className="label-icon">🔒</span>
                  设置密码
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="至少6位，建议包含字母和数字"
                  value={password}
                  onChange={(e) => {
                    const pwd = e.target.value
                    setPassword(pwd)
                    setPasswordStrength(checkPasswordStrength(pwd))
                  }}
                />
                {password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`strength-bar ${passwordStrength >= level ? 'active' : ''} ${
                            passwordStrength === 1 ? 'weak' :
                            passwordStrength === 2 ? 'medium' : 'strong'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`strength-text ${
                      passwordStrength === 1 ? 'weak' :
                      passwordStrength === 2 ? 'medium' : 'strong'
                    }`}>
                      {passwordStrength === 0 && '密码强度：弱'}
                      {passwordStrength === 1 && '密码强度：弱'}
                      {passwordStrength === 2 && '密码强度：中'}
                      {passwordStrength === 3 && '密码强度：强'}
                    </span>
                  </div>
                )}
              </div>

              <div className="input-wrapper">
                <label className="input-label">
                  <span className="label-icon">✅</span>
                  确认密码
                </label>
                <input
                  type="password"
                  className={`input-field ${
                    confirmPassword && password !== confirmPassword ? 'error' : ''
                  } ${confirmPassword && password === confirmPassword ? 'success' : ''}`}
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {confirmPassword && (
                  <div className={`input-hint ${password === confirmPassword ? 'success' : 'error'}`}>
                    {password === confirmPassword ? '✓ 密码匹配' : '✗ 密码不一致'}
                  </div>
                )}
              </div>

              <div className="input-wrapper">
                <label className="input-label">
                  <span className="label-icon">😊</span>
                  选择头像
                </label>
                <div className="avatar-grid-new">
                  {avatars.map((avatar) => (
                    <div
                      key={avatar}
                      className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      {avatar}
                    </div>
                  ))}
                </div>
              </div>

              <div className="input-row">
                <div className="input-wrapper half">
                  <label className="input-label">
                    <span className="label-icon">👤</span>
                    昵称
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="给自己起个名字"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>

                <div className="input-wrapper half">
                  <label className="input-label">
                    <span className="label-icon">🎂</span>
                    年龄
                  </label>
                  <select
                    className="input-field"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  >
                    <option value="">选择年龄</option>
                    {[3,4,5,6,7,8,9,10,11,12].map((a) => (
                      <option key={a} value={a}>{a}岁</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* 提交按钮 */}
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                处理中...
              </>
            ) : (
              <>
                {mode === 'password' && '立即登录 🚀'}
                {mode === 'sms' && '验证登录 🚀'}
                {mode === 'register' && '开始探索 🚀'}
              </>
            )}
          </button>

          {/* 底部提示 */}
          <div className="form-footer">
            {mode !== 'register' && (
              <p className="footer-text">
                还没有账号？
                <a className="footer-link" onClick={() => handleModeSwitch('register')}>
                  立即注册
                </a>
              </p>
            )}
            {mode === 'register' && (
              <p className="footer-text">
                已有账号？
                <a className="footer-link" onClick={() => handleModeSwitch('password')}>
                  立即登录
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
