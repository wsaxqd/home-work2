import { useState } from 'react'
import { Layout, Header } from '../components/layout'
import './Feedback.css'

type FeedbackType = 'bug' | 'feature' | 'other'
type FeedbackStatus = 'pending' | 'processing' | 'resolved'

interface FeedbackItem {
  id: string
  type: FeedbackType
  content: string
  contact: string
  images: string[]
  status: FeedbackStatus
  createdAt: string
}

export default function Feedback() {
  const [type, setType] = useState<FeedbackType>('bug')
  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // 模拟历史反馈数据
  const [feedbackHistory] = useState<FeedbackItem[]>([
    {
      id: '1',
      type: 'bug',
      content: '登录页面在某些情况下会出现白屏',
      contact: '13800138000',
      images: [],
      status: 'resolved',
      createdAt: '2026-02-05 14:30'
    },
    {
      id: '2',
      type: 'feature',
      content: '希望能添加夜间模式功能',
      contact: 'user@example.com',
      images: [],
      status: 'processing',
      createdAt: '2026-02-06 10:15'
    }
  ])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // 模拟图片上传
    const newImages = Array.from(files).map(file => URL.createObjectURL(file))
    setImages([...images, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('请输入反馈内容')
      return
    }

    setSubmitting(true)
    try {
      // TODO: 调用提交反馈API
      // await feedbackApi.submit({ type, content, contact, images })

      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert('反馈提交成功,感谢您的反馈!')

      // 重置表单
      setType('bug')
      setContent('')
      setContact('')
      setImages([])
    } catch (error) {
      alert('提交失败,请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const getTypeText = (type: FeedbackType) => {
    const map = {
      bug: '问题反馈',
      feature: '功能建议',
      other: '其他'
    }
    return map[type]
  }

  const getStatusText = (status: FeedbackStatus) => {
    const map = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决'
    }
    return map[status]
  }

  return (
    <Layout>
      <Header
        title="问题反馈"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        showBack={true}
      />

      <div className="main-content feedback-page">
        {/* 反馈表单 */}
        <div className="feedback-form-section">
          <div className="form-group">
            <label className="form-label">
              反馈类型<span className="required">*</span>
            </label>
            <div className="type-selector">
              <button
                className={`type-option ${type === 'bug' ? 'active' : ''}`}
                onClick={() => setType('bug')}
              >
                问题反馈
              </button>
              <button
                className={`type-option ${type === 'feature' ? 'active' : ''}`}
                onClick={() => setType('feature')}
              >
                功能建议
              </button>
              <button
                className={`type-option ${type === 'other' ? 'active' : ''}`}
                onClick={() => setType('other')}
              >
                其他
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              问题描述<span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="请详细描述您遇到的问题或建议..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
            />
            <div className="char-count">{content.length}/500</div>
          </div>

          <div className="form-group">
            <label className="form-label">联系方式</label>
            <input
              type="text"
              className="form-input"
              placeholder="手机号或邮箱(选填)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">上传截图</label>
            <label className="upload-area">
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <div className="upload-icon">📷</div>
              <div className="upload-text">点击上传截图</div>
              <div className="upload-hint">支持 JPG、PNG 格式,最多3张</div>
            </label>
            {images.length > 0 && (
              <div className="image-preview">
                {images.map((img, index) => (
                  <div key={index} className="preview-item">
                    <img src={img} alt={`预览${index + 1}`} className="preview-image" />
                    <button
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中...' : '提交反馈'}
          </button>
        </div>

        {/* 反馈历史 */}
        <div className="feedback-history-section">
          <h3 className="section-title">我的反馈</h3>
          {feedbackHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-text">暂无反馈记录</div>
              <div className="empty-hint">提交反馈后可在此查看处理进度</div>
            </div>
          ) : (
            <div className="history-list">
              {feedbackHistory.map(item => (
                <div key={item.id} className="history-item">
                  <div className="history-header">
                    <span className={`history-type ${item.type}`}>
                      {getTypeText(item.type)}
                    </span>
                    <span className={`history-status ${item.status}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  <div className="history-content">{item.content}</div>
                  <div className="history-date">{item.createdAt}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
