import { useState } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import './ParentLayout.css'

export default function ParentLayout() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('dashboard')

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗?')) {
      localStorage.removeItem('parentProfile')
      navigate('/parent/login')
    }
  }

  const menuItems = [
    { id: 'dashboard', name: '控制台', icon: '📊', path: '/parent/dashboard' },
    { id: 'children', name: '孩子管理', icon: '👶', path: '/parent/children' },
    { id: 'data', name: '学习数据', icon: '📈', path: '/parent/data' },
    { id: 'control', name: '使用控制', icon: '⏰', path: '/parent/control' },
    { id: 'report', name: '成长报告', icon: '📝', path: '/parent/report' },
    { id: 'settings', name: '设置', icon: '⚙️', path: '/parent/settings' }
  ]

  const handleMenuClick = (item: typeof menuItems[0]) => {
    setActiveMenu(item.id)
    navigate(item.path)
  }

  return (
    <div className="parent-layout">
      {/* 顶部导航栏 */}
      <header className="parent-header">
        <div className="header-left">
          <div className="logo">👨‍👩‍👧‍👦</div>
          <h1>家长控制台</h1>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>

      <div className="parent-content">
        {/* 侧边栏 */}
        <aside className="parent-sidebar">
          <nav className="sidebar-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-name">{item.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* 主内容区域 */}
        <main className="parent-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
