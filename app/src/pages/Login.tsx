import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

const avatars = ['🦁', '🐰', '🐼', '🦊', '🐯', '🐨']

export default function Login() {
  const navigate = useNavigate()
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState('')

  const handleStart = () => {
    if (selectedAvatar && nickname && age) {
      localStorage.setItem('userProfile', JSON.stringify({
        avatar: selectedAvatar,
        nickname,
        age: parseInt(age)
      }))
      navigate('/home')
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

        <button
          className="btn btn-primary start-btn"
          disabled={!selectedAvatar || !nickname || !age}
          onClick={handleStart}
        >
          开始探索 🚀
        </button>
      </div>
    </div>
  )
}
