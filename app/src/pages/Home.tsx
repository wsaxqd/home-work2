import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState({ username: '小朋友', level: 1, points: 0 })
  const [todayTasks, setTodayTasks] = useState({ completed: 0, total: 5 })
  const isLoggedIn = !!localStorage.getItem('token')

  useEffect(() => {
    if (isLoggedIn) {
      // 加载用户信息
      const username = localStorage.getItem('username') || '小朋友'
      setUserInfo({ username, level: 5, points: 128 })
    }
  }, [isLoggedIn])

  return (
    <Layout>
      {/* 用户信息条 */}
      {isLoggedIn && (
        <div className="user-info-bar">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <div className="user-name">{userInfo.username}</div>
            <div className="user-level">Lv.{userInfo.level}</div>
          </div>
          <div className="user-points">⭐ {userInfo.points}</div>
        </div>
      )}

      <div className="home-content">
        {/* 未登录提示 */}
        {!isLoggedIn && (
          <div className="login-prompt-card">
            <div className="lock-icon">🔒</div>
            <h2 className="login-prompt-title">开启AI学习之旅</h2>
            <p className="login-prompt-desc">登录后解锁全部功能</p>
            <button className="login-btn" onClick={() => navigate('/login')}>
              立即登录
            </button>
          </div>
        )}

        {/* 今日任务 */}
        {isLoggedIn && (
          <div className="today-tasks">
            <div className="tasks-header">
              <span className="tasks-icon">🎯</span>
              <span className="tasks-title">今日任务</span>
              <span className="tasks-progress">({todayTasks.completed}/{todayTasks.total})</span>
            </div>
            <div className="tasks-progress-bar">
              <div className="tasks-progress-fill" style={{ width: `${(todayTasks.completed / todayTasks.total) * 100}%` }}></div>
            </div>
          </div>
        )}

        {/* 核心功能大卡片 */}
        <div className="core-features">
          <div className="feature-card learning" onClick={() => navigate('/learning-map')}>
            <div className="feature-icon">📚</div>
            <div className="feature-info">
              <div className="feature-title">学习</div>
              <div className="feature-desc">AI智能辅导</div>
            </div>
          </div>
          <div className="feature-card games" onClick={() => navigate('/games')}>
            <div className="feature-icon">🎮</div>
            <div className="feature-info">
              <div className="feature-title">游戏</div>
              <div className="feature-desc">寓教于乐</div>
            </div>
          </div>
          <div className="feature-card creation" onClick={() => navigate('/create')}>
            <div className="feature-icon">✨</div>
            <div className="feature-info">
              <div className="feature-title">创作</div>
              <div className="feature-desc">AI创意工坊</div>
            </div>
          </div>
          <div className="feature-card community" onClick={() => navigate('/community')}>
            <div className="feature-icon">👥</div>
            <div className="feature-info">
              <div className="feature-title">社区</div>
              <div className="feature-desc">分享交流</div>
            </div>
          </div>
          <div className="feature-card profile" onClick={() => navigate('/profile')}>
            <div className="feature-icon">👤</div>
            <div className="feature-info">
              <div className="feature-title">我的</div>
              <div className="feature-desc">个人中心</div>
            </div>
          </div>
        </div>

        {/* 继续学习 */}
        {isLoggedIn && (
          <div className="continue-learning">
            <div className="section-header">
              <span className="section-title">📖 继续学习</span>
            </div>
            <div className="learning-card" onClick={() => navigate('/learning-map')}>
              <div className="learning-subject">数学王国</div>
              <div className="learning-progress-info">
                <span>第3关 - 加减法挑战</span>
                <span className="learning-percentage">60%</span>
              </div>
              <div className="learning-progress-bar">
                <div className="learning-progress-fill" style={{ width: '60%' }}></div>
              </div>
              <button className="learning-continue-btn">继续学习 ▶</button>
            </div>
          </div>
        )}

        {/* 热门推荐 */}
        <div className="hot-recommendations">
          <div className="section-header">
            <span className="section-title">🔥 热门推荐</span>
            <span className="section-more" onClick={() => navigate('/games')}>更多 →</span>
          </div>
          <div className="recommendations-scroll">
            <div className="recommendation-item" onClick={() => navigate('/pk-battle')}>
              <div className="recommendation-cover">⚔️</div>
              <div className="recommendation-title">多人PK</div>
            </div>
            <div className="recommendation-item" onClick={() => navigate('/story-creator')}>
              <div className="recommendation-cover">📖</div>
              <div className="recommendation-title">故事创作</div>
            </div>
            <div className="recommendation-item" onClick={() => navigate('/math-speed-game')}>
              <div className="recommendation-cover">🔢</div>
              <div className="recommendation-title">数学速算</div>
            </div>
            <div className="recommendation-item" onClick={() => navigate('/ai-chat')}>
              <div className="recommendation-cover">🤖</div>
              <div className="recommendation-title">AI对话</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
