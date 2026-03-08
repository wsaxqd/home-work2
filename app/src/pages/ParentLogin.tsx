import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import parentAPI from '../services/parentAPI'
import './ParentLogin.css'

type LoginMode = 'password' | 'code'
type CodeType = 'email' | 'sms'

export default function ParentLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<LoginMode>('password')
  const [codeType, setCodeType] = useState<CodeType>('email')
  const [isRegister, setIsRegister] = useState(false)

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [childAccount, setChildAccount] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const validatePhone = (phoneNum: string) => /^1[3-9]\d{9}$/.test(phoneNum)
  const validateEmail = (emailStr: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)

  const handleSendCode = async () => {
    if (codeType === 'email') {
      if (!validateEmail(email)) {
        setError('请输入正确的邮箱地址')
        return
      }
    } else {
      if (!validatePhone(phone)) {
        setError('请输入正确的手机号')
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      if (codeType === 'email') {
        await parentAPI.sendVerifyCode(email)
      }
      setCountdown(60)
      setError('')
    } catch (err: any) {
      setError(err.message || '发送验证码失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async () => {
    if (!phone || !password) {
      setError('请输入手机号和密码')
      return
    }

    if (!validatePhone(phone)) {
      setError('请输入正确的手机号')
      return
    }

    setLoading(true)
    setError('')

    try {
      await parentAPI.login({ phone, password })
      navigate('/parent/dashboard')
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeLogin = async () => {
    if (codeType === 'email') {
      if (!validateEmail(email)) {
        setError('请输入正确的邮箱地址')
        return
      }
    } else {
      if (!validatePhone(phone)) {
        setError('请输入正确的手机号')
        return
      }
    }

    if (!verifyCode || verifyCode.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 验证码登录（演示模式）
      if (code === '123456') {
        navigate('/parent/dashboard')
      } else {
        setError('验证码错误')
      }
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!phone || !email || !password || !confirmPassword) {
      setError('请填写完整信息')
      return
    }

    if (!validatePhone(phone)) {
      setError('请输入正确的手机号')
      return
    }

    if (!validateEmail(email)) {
      setError('请输入正确的邮箱地址')
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    if (password !== confirmPassword) {
      setError('两次密码不一致')
      return
    }

    if (!verifyCode) {
      setError('请输入邮箱验证码')
      return
    }

    if (!childAccount) {
      setError('请输入孩子账号进行绑定')
      return
    }

    setLoading(true)
    setError('')

    try {
      await parentAPI.register({
        phone,
        email,
        password,
        verifyCode,
        childAccount
      })
      setError('')
      setIsRegister(false)
      setPassword('')
      setConfirmPassword('')
      setVerifyCode('')
      setChildAccount('')
    } catch (err: any) {
      setError(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (isRegister) {
      handleRegister()
    } else if (mode === 'password') {
      handlePasswordLogin()
    } else {
      handleCodeLogin()
    }
  }

  const handleModeSwitch = (newMode: LoginMode) => {
    setMode(newMode)
    setError('')
    setVerifyCode('')
  }

  return (
    <div className="parent-login-container">
      <div className="parent-login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="parent-login-card">
        <div className="login-header">
          <div className="logo">👨‍👩‍👧‍👦</div>
          <h1>家长端</h1>
          <p>守护孩子成长每一步</p>
        </div>

        {!isRegister && (
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === 'password' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('password')}
            >
              <span className="tab-icon">🔐</span>
              密码登录
            </button>
            <button
              className={`mode-tab ${mode === 'code' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('code')}
            >
              <span className="tab-icon">💬</span>
              验证码登录
            </button>
          </div>
        )}

        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        <div className="form-content">
          {/* 密码登录 */}
          {!isRegister && mode === 'password' && (
            <>
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
              </div>

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
            </>
          )}

          {/* 验证码登录 */}
          {!isRegister && mode === 'code' && (
            <>
              <div className="login-type-switch">
                <button
                  className={`type-btn ${codeType === 'email' ? 'active' : ''}`}
                  onClick={() => setCodeType('email')}
                  type="button"
                >
                  📧 邮箱验证码
                </button>
                <button
                  className={`type-btn ${codeType === 'sms' ? 'active' : ''}`}
                  onClick={() => setCodeType('sms')}
                  type="button"
                >
                  📱 短信验证码
                </button>
              </div>

              {codeType === 'email' ? (
                <>
                  <div className="input-wrapper">
                    <label className="input-label">
                      <span className="label-icon">📧</span>
                      邮箱地址
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="请输入邮箱地址"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
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
                        value={verifyCode}
                        maxLength={6}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                      />
                      <button
                        className="sms-button"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || !validateEmail(email)}
                      >
                        {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                  </div>
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
                        value={verifyCode}
                        maxLength={6}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                      />
                      <button
                        className="sms-button"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || !validatePhone(phone)}
                      >
                        {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* 注册表单 */}
          {isRegister && (
            <>
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
              </div>

              <div className="input-wrapper">
                <label className="input-label">
                  <span className="label-icon">📧</span>
                  邮箱
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="请输入邮箱地址"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="input-wrapper">
                <label className="input-label">
                  <span className="label-icon">💬</span>
                  邮箱验证码
                </label>
                <div className="sms-input-group">
                  <input
                    type="text"
                    className="input-field sms-input"
                    placeholder="请输入6位验证码"
                    value={verifyCode}
                    maxLength={6}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <button
                    className="sms-button"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || !validateEmail(email)}
                  >
                    {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                  </button>
                </div>
              </div>

              <div className="input-wrapper">
                <label className="input-label">
                  <span className="label-icon">🔒</span>
                  设置密码
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="至少6位"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="input-wrapper">
                <label className="input-label">
                  <span className="label-icon">✅</span>
                  确认密码
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="input-wrapper">
                <label className="input-label">
                  <span className="label-icon">👶</span>
                  孩子账号
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="输入孩子账号进行绑定"
                  value={childAccount}
                  onChange={(e) => setChildAccount(e.target.value)}
                />
              </div>
            </>
          )}

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
                {isRegister ? '立即注册 🚀' : mode === 'password' ? '立即登录 🚀' : '验证登录 🚀'}
              </>
            )}
          </button>

          <div className="form-footer">
            {!isRegister ? (
              <p className="footer-text">
                还没有账号？
                <a className="footer-link" onClick={() => setIsRegister(true)}>
                  立即注册
                </a>
              </p>
            ) : (
              <p className="footer-text">
                已有账号？
                <a className="footer-link" onClick={() => setIsRegister(false)}>
                  立即登录
                </a>
              </p>
            )}
            <button className="link-btn" onClick={() => navigate('/home')}>
              返回儿童端
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
