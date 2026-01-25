import { useState, useEffect } from 'react'
import parentAPI from '../services/parentAPI'
import { useToast } from '../components/Toast'
import './ChildrenManagement.css'

interface Child {
  id: number
  user_id: string
  nickname: string
  age: number
  avatar: string
  gender: '男' | '女'
  grade: string
  bind_time: string
}

export default function ChildrenManagement() {
  const toast = useToast()
  const [children, setChildren] = useState<Child[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [formData, setFormData] = useState({
    nickname: '',
    age: '',
    avatar: '👦',
    account: '',
    gender: '男' as '男' | '女',
    grade: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      setIsLoading(true)
      const data = await parentAPI.getChildren()
      setChildren(data || [])
    } catch (err: any) {
      console.error('加载孩子列表失败:', err)
      toast.info(err.message || '加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleOpenModal = (child?: Child) => {
    if (child) {
      setEditingChild(child)
      setFormData({
        nickname: child.nickname,
        age: child.age.toString(),
        avatar: child.avatar,
        account: '',  // 不显示account,编辑时不需要
        gender: child.gender,
        grade: child.grade
      })
    } else {
      setEditingChild(null)
      setFormData({
        nickname: '',
        age: '',
        avatar: '👦',
        account: '',
        gender: '男',
        grade: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingChild(null)
  }

  const handleSubmit = async () => {
    if (!formData.nickname || !formData.age || !formData.grade) {
      toast.info('请填写完整信息')
      return
    }

    if (!editingChild && !formData.account) {
      toast.info('请输入孩子账号')
      return
    }

    setIsSubmitting(true)

    try {
      if (editingChild) {
        // 编辑模式
        await parentAPI.updateChild(editingChild.id, {
          nickname: formData.nickname,
          age: parseInt(formData.age),
          gender: formData.gender,
          grade: formData.grade,
          avatar: formData.avatar
        })
        toast.success('修改成功!')
      } else {
        // 添加模式
        await parentAPI.addChild({
          account: formData.account,
          nickname: formData.nickname,
          age: parseInt(formData.age),
          gender: formData.gender,
          grade: formData.grade,
          avatar: formData.avatar
        })
        toast.success('添加成功!')
      }

      handleCloseModal()
      loadChildren() // 重新加载列表
    } catch (err: any) {
      toast.info(err.message || '操作失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (child: Child) => {
    if (window.confirm(`确定要解除与 ${child.nickname} 的绑定吗?`)) {
      try {
        await parentAPI.deleteChild(child.id)
        toast.success('已解除绑定')
        loadChildren() // 重新加载列表
      } catch (err: any) {
        toast.info(err.message || '解绑失败')
      }
    }
  }

  const avatarOptions = ['👦', '👧', '🧒', '👶', '🐻', '🐰', '🐱', '🐶']

  return (
    <div className="children-management">
      {/* 页面头部 */}
      <div className="page-header">
        <div>
          <h2>孩子管理</h2>
          <p>管理已绑定的孩子账号</p>
        </div>
        <button className="add-btn" onClick={() => handleOpenModal()}>
          <span>+</span>
          添加孩子
        </button>
      </div>

      {/* 孩子列表 */}
      <div className="children-list">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        ) : children.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👨‍👩‍👧‍👦</div>
            <p>还没有绑定孩子账号</p>
            <button className="add-btn-empty" onClick={() => handleOpenModal()}>
              添加第一个孩子
            </button>
          </div>
        ) : (
          children.map(child => (
            <div key={child.id} className="child-item">
              <div className="child-avatar-large">{child.avatar || (child.gender === '男' ? '👦' : '👧')}</div>
              <div className="child-details">
                <h3>{child.nickname}</h3>
                <div className="child-meta">
                  <span className="meta-item">
                    <span className="meta-label">性别:</span>
                    {child.gender}
                  </span>
                  <span className="meta-item">
                    <span className="meta-label">年龄:</span>
                    {child.age}岁
                  </span>
                  <span className="meta-item">
                    <span className="meta-label">年级:</span>
                    {child.grade}
                  </span>
                </div>
                <div className="child-meta">
                  <span className="meta-item">
                    <span className="meta-label">用户ID:</span>
                    {child.user_id}
                  </span>
                  <span className="meta-item">
                    <span className="meta-label">绑定时间:</span>
                    {new Date(child.bind_time).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="child-actions">
                <button className="edit-btn" onClick={() => handleOpenModal(child)}>
                  编辑
                </button>
                <button className="delete-btn" onClick={() => handleDelete(child)}>
                  解绑
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 添加/编辑模态框 */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingChild ? '编辑孩子信息' : '添加孩子'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-body">
              {/* 头像选择 */}
              <div className="form-group">
                <label>选择头像</label>
                <div className="avatar-selector">
                  {avatarOptions.map(avatar => (
                    <button
                      key={avatar}
                      className={`avatar-option ${formData.avatar === avatar ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, avatar })}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              {/* 姓名 */}
              <div className="form-group">
                <label>孩子姓名</label>
                <input
                  type="text"
                  name="nickname"
                  placeholder="请输入孩子姓名"
                  value={formData.nickname}
                  onChange={handleInputChange}
                />
              </div>

              {/* 性别 */}
              <div className="form-group">
                <label>性别</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>

              {/* 年龄 */}
              <div className="form-group">
                <label>年龄</label>
                <input
                  type="number"
                  name="age"
                  placeholder="请输入年龄"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="3"
                  max="18"
                />
              </div>

              {/* 年级 */}
              <div className="form-group">
                <label>年级</label>
                <select name="grade" value={formData.grade} onChange={handleInputChange}>
                  <option value="">请选择年级</option>
                  <option value="学前班">学前班</option>
                  <option value="一年级">一年级</option>
                  <option value="二年级">二年级</option>
                  <option value="三年级">三年级</option>
                  <option value="四年级">四年级</option>
                  <option value="五年级">五年级</option>
                  <option value="六年级">六年级</option>
                  <option value="初一">初一</option>
                  <option value="初二">初二</option>
                  <option value="初三">初三</option>
                </select>
              </div>

              {/* 账号 */}
              <div className="form-group">
                <label>孩子账号</label>
                <input
                  type="text"
                  name="account"
                  placeholder="请输入孩子账号"
                  value={formData.account}
                  onChange={handleInputChange}
                  disabled={!!editingChild}
                />
                {editingChild && (
                  <span className="form-hint">账号不可修改</span>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCloseModal} disabled={isSubmitting}>
                取消
              </button>
              <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '处理中...' : (editingChild ? '保存修改' : '确认添加')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
