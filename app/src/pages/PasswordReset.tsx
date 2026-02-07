import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import './PasswordReset.css'

type Step = 'input' | 'verify' | 'reset' | 'success'

export default function PasswordReset() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('input')
  const [method, setMethod] = useState<'phone' | 'email'>('phone')

  // 步骤1: 输入手机号/邮箱
  const [contact, setContact] = useState('')

  // 步骤2: 验证码
  const [verifyCode, setVerifyCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [resetToken, setResetToken] = useState('')

  // 步骤3: 新密码
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)

  const handleSendCode = async () => {
    if (!contact) {
      alert('请输入' + (method === 'phone' ? '手机号' : '邮箱'))
      return
    }

    if (method === 'phone' && !/^1[3-9]\d{9}$/.test(contact)) {
      alert('请输入正确的手机号')
      return
    }

    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      alert('请输入正确的邮箱地址')
      return
    }

    setLoading(true)
    try {
      await authApi.forgotPassword(contact, method)
      setStep('verify')
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      alert('验证码已发送')
    } catch (error: any) {
      alert(error.message || '发送验证码失败')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verifyCode) {
      alert('请输入验证码')
      return
    }

    setLoading(true)
    try {
      const response = await authApi.verifyResetCode(contact, verifyCode, method)
      if (response.success && response.data) {
        setResetToken(response.data.resetToken)
        setStep('reset')
        alert('验证成功')
      }
    } catch (error: any) {
      alert(error.message || '验证码错误')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('请填写完整信息')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('两次输入的密码不一致')
      return
    }

    if (newPassword.length < 8) {
      alert('密码至少需要8位')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(resetToken, newPassword)
      setStep('success')
      alert('密码重置成功')
    } catch (error: any) {
      alert(error.message || '密码重置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = () => {
    setStep('input')
    setVerifyCode('')
  }

  return (
    <div className="password-reset-page">
      <div className="reset-container">
        <div className="reset-header">
          <button className="back-button" onClick={() => navigate('/login')}>
            ← 返回登录
          </button>
          <h1>找回密码</h1>
        </div>

        {/* 步骤指示器 */}
        <div className="steps-indicator">
          <div className={`step-item ${step === 'input' ? 'active' : step !== 'input' ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">输入账号</div>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${step === 'verify' ? 'active' : step === 'reset' || step === 'success' ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">验证身份</div>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${step === 'reset' ? 'active' : step === 'success' ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">重置密码</div>
          </div>
        </div>

        {/* 步骤1: 输入手机号/邮箱 */}
        {step === 'input' && (
          <div className="reset-form">
            <div className="method-tabs">
              <button
                className={`method-tab ${method === 'phone' ? 'active' : ''}`}
                onClick={() => setMethod('phone')}
              >
                手机号找回
              </button>
              <button
                className={`method-tab ${method === 'email' ? 'active' : ''}`}
                onClick={() => setMethod('email')}
              >
                邮箱找回
              </button>
            </div>

            <div className="form-group">
              <label>{method === 'phone' ? '手机号' : '邮箱地址'}</label>
              <input
                type={method === 'phone' ? 'tel' : 'email'}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={method === 'phone' ? '请输入手机号' : '请输入邮箱地址'}
                maxLength={method === 'phone' ? 11 : undefined}
              />
            </div>

            <button
              className="submit-button"
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </div>
        )}

        {/* 步骤2: 验证验证码 */}
        {step === 'verify' && (
          <div className="reset-form">
            <div className="info-text">
              验证码已发送至 {method === 'phone' ? '手机号' : '邮箱'}: {contact}
            </div>

            <div className="form-group">
              <label>验证码</label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="请输入6位验证码"
                maxLength={6}
              />
            </div>

            <div className="resend-section">
              {countdown > 0 ? (
                <span className="countdown-text">{countdown}秒后可重新发送</span>
              ) : (
                <button className="resend-button" onClick={handleResendCode}>
                  重新发送验证码
                </button>
              )}
            </div>

            <button
              className="submit-button"
              onClick={handleVerifyCode}
              disabled={loading}
            >
              {loading ? '验证中...' : '下一步'}
            </button>
          </div>
        )}

        {/* 步骤3: 设置新密码 */}
        {step === 'reset' && (
          <div className="reset-form">
            <div className="info-text">请设置新密码</div>

            <div className="form-group">
              <label>新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码(至少8位)"
              />
            </div>

            <div className="form-group">
              <label>确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
            </div>

            <div className="password-hint">
              密码要求: 至少8位,建议包含大小写字母和数字
            </div>

            <button
              className="submit-button"
              onClick={handleResetPassword}
              disabled={loading}
            >
              {loading ? '重置中...' : '完成重置'}
            </button>
          </div>
        )}

        {/* 步骤4: 完成 */}
        {step === 'success' && (
          <div className="reset-form success-state">
            <div className="success-icon">✓</div>
            <h2>密码重置成功!</h2>
            <p>您可以使用新密码登录了</p>
            <button
              className="submit-button"
              onClick={() => navigate('/login')}
            >
              返回登录
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
