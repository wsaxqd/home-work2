import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Header } from '../components/layout'
import { authApi } from '../services/api'
import './AccountSecurity.css'

export default function AccountSecurity() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<'password' | 'phone' | 'email'>('password')

  // 密码修改
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // 手机号绑定
  const [phone, setPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneCodeSent, setPhoneCodeSent] = useState(false)
  const [phoneCountdown, setPhoneCountdown] = useState(0)

  // 邮箱绑定
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [emailCountdown, setEmailCountdown] = useState(0)

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('请填写完整信息')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('两次输入的新密码不一致')
      return
    }

    if (newPassword.length < 8) {
      alert('新密码至少需要8位')
      return
    }

    setPasswordLoading(true)
    try {
      const response = await authApi.changePassword(oldPassword, newPassword)
      if (response.success) {
        alert('密码修改成功')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error: any) {
      alert(error.message || '密码修改失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSendPhoneCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      alert('请输入正确的手机号')
      return
    }

    try {
      const response = await authApi.sendSMSCode(phone)
      if (response.success) {
        setPhoneCodeSent(true)
        setPhoneCountdown(60)
        const timer = setInterval(() => {
          setPhoneCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        alert('验证码已发送')
      }
    } catch (error: any) {
      alert(error.message || '发送验证码失败')
    }
  }

  const handleBindPhone = async () => {
    if (!phone || !phoneCode) {
      alert('请填写完整信息')
      return
    }

    try {
      await authApi.bindPhone(phone, phoneCode)
      alert('手机号绑定成功')
      setPhone('')
      setPhoneCode('')
      setPhoneCodeSent(false)
    } catch (error: any) {
      alert(error.message || '绑定失败')
    }
  }

  const handleSendEmailCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('请输入正确的邮箱地址')
      return
    }

    try {
      const response = await authApi.sendEmailCode(email)
      if (response.success) {
        setEmailCodeSent(true)
        setEmailCountdown(60)
        const timer = setInterval(() => {
          setEmailCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        alert('验证码已发送')
      }
    } catch (error: any) {
      alert(error.message || '发送验证码失败')
    }
  }

  const handleBindEmail = async () => {
    if (!email || !emailCode) {
      alert('请填写完整信息')
      return
    }

    try {
      await authApi.bindEmail(email, emailCode)
      alert('邮箱绑定成功')
      setEmail('')
      setEmailCode('')
      setEmailCodeSent(false)
    } catch (error: any) {
      alert(error.message || '绑定失败')
    }
  }

  return (
    <Layout>
      <Header title="账户安全" showBack={true} />
      <div className="main-content account-security-page">
        <div className="security-tabs">
          <button
            className={`tab-button ${activeSection === 'password' ? 'active' : ''}`}
            onClick={() => setActiveSection('password')}
          >
            修改密码
          </button>
          <button
            className={`tab-button ${activeSection === 'phone' ? 'active' : ''}`}
            onClick={() => setActiveSection('phone')}
          >
            手机号
          </button>
          <button
            className={`tab-button ${activeSection === 'email' ? 'active' : ''}`}
            onClick={() => setActiveSection('email')}
          >
            邮箱
          </button>
        </div>

        {activeSection === 'password' && (
          <div className="security-section">
            <div className="security-card">
              <h3>修改密码</h3>
              <p className="hint">密码至少8位，需包含大小写字母和数字</p>

              <div className="form-group">
                <label>当前密码</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="请输入当前密码"
                />
              </div>

              <div className="form-group">
                <label>新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码"
                />
              </div>

              <div className="form-group">
                <label>确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                />
              </div>

              <button
                className="submit-button"
                onClick={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? '修改中...' : '确认修改'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'phone' && (
          <div className="security-section">
            <div className="security-card">
              <h3>绑定手机号</h3>
              <p className="hint">绑定手机号后可用于登录和找回密码</p>

              <div className="form-group">
                <label>手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  maxLength={11}
                />
              </div>

              <div className="form-group">
                <label>验证码</label>
                <div className="code-input-group">
                  <input
                    type="text"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    placeholder="请输入验证码"
                    maxLength={6}
                  />
                  <button
                    className="code-button"
                    onClick={handleSendPhoneCode}
                    disabled={phoneCountdown > 0}
                  >
                    {phoneCountdown > 0 ? `${phoneCountdown}秒后重试` : '发送验证码'}
                  </button>
                </div>
              </div>

              <button className="submit-button" onClick={handleBindPhone}>
                确认绑定
              </button>
            </div>
          </div>
        )}

        {activeSection === 'email' && (
          <div className="security-section">
            <div className="security-card">
              <h3>绑定邮箱</h3>
              <p className="hint">绑定邮箱后可用于登录和找回密码</p>

              <div className="form-group">
                <label>邮箱地址</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱地址"
                />
              </div>

              <div className="form-group">
                <label>验证码</label>
                <div className="code-input-group">
                  <input
                    type="text"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    placeholder="请输入验证码"
                    maxLength={6}
                  />
                  <button
                    className="code-button"
                    onClick={handleSendEmailCode}
                    disabled={emailCountdown > 0}
                  >
                    {emailCountdown > 0 ? `${emailCountdown}秒后重试` : '发送验证码'}
                  </button>
                </div>
              </div>

              <button className="submit-button" onClick={handleBindEmail}>
                确认绑定
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
