import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import parentAPI from '../services/parentAPI'
import './ParentLogin.css'

export default function ParentLogin() {
  const navigate = useNavigate()
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login')
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    verifyCode: '',
    childAccount: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isSendingCode, setIsSendingCode] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // 发送邮箱验证码
  const handleSendVerifyCode = async () => {
    if (!formData.email) {
      alert('请先输入邮箱')
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('请输入正确的邮箱格式')
      return
    }

    setIsSendingCode(true)

    try {
      // 调用发送验证码API
      await parentAPI.sendVerifyCode(formData.email)
      alert('验证码已发送到您的邮箱，请查收')

      // 开始60秒倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      alert(error.message || '发送验证码失败，请重试')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleLogin = async () => {
    if (!formData.phone || !formData.password) {
      alert('请输入手机号和密码')
      return
    }

    if (!formData.email) {
      alert('请输入邮箱')
      return
    }

    setIsLoading(true)

    try {
      // 调用真实的登录API
      await parentAPI.login({
        phone: formData.phone,
        password: formData.password
      })

      // Token已自动保存到localStorage
      alert('登录成功！')
      navigate('/parent/dashboard')
    } catch (error: any) {
      alert(error.message || '登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!formData.phone || !formData.email || !formData.password || !formData.confirmPassword) {
      alert('请填写完整信息')
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('请输入正确的邮箱格式')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert('两次密码不一致')
      return
    }

    if (!formData.verifyCode) {
      alert('请输入邮箱验证码')
      return
    }

    if (!formData.childAccount) {
      alert('请输入孩子账号进行绑定')
      return
    }

    setIsLoading(true)

    try {
      // 调用真实的注册API
      await parentAPI.register({
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        verifyCode: formData.verifyCode,
        childAccount: formData.childAccount
      })

      alert('注册成功！请登录')
      setLoginMode('login')
      setFormData({
        phone: formData.phone,
        email: formData.email,
        password: '',
        confirmPassword: '',
        verifyCode: '',
        childAccount: ''
      })
    } catch (error: any) {
      alert(error.message || '注册失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="parent-login-container">
      <div className="parent-login-card">
        {/* Logo 和标题 */}
        <div className="login-header">
          <div className="logo">👨‍👩‍👧‍👦</div>
          <h1>家长端</h1>
          <p>守护孩子成长每一步</p>
        </div>

        {/* 切换登录/注册 */}
        <div className="mode-switch">
          <button
            className={`mode-btn ${loginMode === 'login' ? 'active' : ''}`}
            onClick={() => setLoginMode('login')}
          >
            登录
          </button>
          <button
            className={`mode-btn ${loginMode === 'register' ? 'active' : ''}`}
            onClick={() => setLoginMode('register')}
          >
            注册
          </button>
        </div>

        {/* 表单区域 */}
        <div className="login-form">
          {/* 手机号 */}
          <div className="form-group">
            <label>手机号</label>
            <input
              type="tel"
              name="phone"
              placeholder="请输入手机号"
              value={formData.phone}
              onChange={handleInputChange}
              maxLength={11}
            />
          </div>

          {/* 邮箱 */}
          <div className="form-group">
            <label>邮箱</label>
            <input
              type="email"
              name="email"
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          {/* 注册模式显示邮箱验证码 */}
          {loginMode === 'register' && (
            <div className="form-group">
              <label>邮箱验证码</label>
              <div className="verify-code-input">
                <input
                  type="text"
                  name="verifyCode"
                  placeholder="请输入验证码"
                  value={formData.verifyCode}
                  onChange={handleInputChange}
                  maxLength={6}
                />
                <button
                  type="button"
                  className="send-code-btn"
                  onClick={handleSendVerifyCode}
                  disabled={countdown > 0 || isSendingCode}
                >
                  {countdown > 0 ? `${countdown}秒后重试` : isSendingCode ? '发送中...' : '发送验证码'}
                </button>
              </div>
            </div>
          )}

          {/* 密码 */}
          <div className="form-group">
            <label>密码</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* 注册模式的额外字段 */}
          {loginMode === 'register' && (
            <>
              <div className="form-group">
                <label>确认密码</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>孩子账号</label>
                <input
                  type="text"
                  name="childAccount"
                  placeholder="输入孩子账号进行绑定"
                  value={formData.childAccount}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}

          {/* 提交按钮 */}
          <button
            className="submit-btn"
            onClick={loginMode === 'login' ? handleLogin : handleRegister}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : loginMode === 'login' ? '登录' : '注册'}
          </button>
        </div>

        {/* 底部链接 */}
        <div className="login-footer">
          <button className="link-btn" onClick={() => navigate('/home')}>
            返回儿童端
          </button>
        </div>
      </div>
    </div>
  )
}
