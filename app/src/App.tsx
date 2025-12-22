import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Splash,
  Login,
  Create,
  Games,
  Profile,
  MindGarden,
  Assessment,
  ArtCreator,
  MusicCreator,
  StoryCreator,
  PoemCreator,
  ExpressionGame,
  ImageRecognitionGame,
  MyWorks,
  Favorites
} from './pages'
import './styles/global.css'

// 路由守卫组件：检查用户是否已登录
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const userProfile = localStorage.getItem('userProfile')
    setIsLoggedIn(!!userProfile)
    setIsChecking(false)
  }, [])

  if (isChecking) {
    return <div>Loading...</div>
  }

  return isLoggedIn ? <>{children}</> : <Navigate to="/splash" replace />
}

// 初始路由组件：决定显示Splash还是Create
function InitialRoute() {
  const [isChecking, setIsChecking] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const userProfile = localStorage.getItem('userProfile')
    setIsLoggedIn(!!userProfile)
    setIsChecking(false)
  }, [])

  if (isChecking) {
    return <div>Loading...</div>
  }

  return isLoggedIn ? <Navigate to="/create" replace /> : <Navigate to="/splash" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InitialRoute />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />

        {/* 4个主导航页面 */}
        <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
        <Route path="/mind-garden" element={<ProtectedRoute><MindGarden /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* 创作工具子页面 */}
        <Route path="/art-creator" element={<ProtectedRoute><ArtCreator /></ProtectedRoute>} />
        <Route path="/music-creator" element={<ProtectedRoute><MusicCreator /></ProtectedRoute>} />
        <Route path="/story-creator" element={<ProtectedRoute><StoryCreator /></ProtectedRoute>} />
        <Route path="/poem-creator" element={<ProtectedRoute><PoemCreator /></ProtectedRoute>} />

        {/* 游戏子页面 */}
        <Route path="/expression-game" element={<ProtectedRoute><ExpressionGame /></ProtectedRoute>} />
        <Route path="/image-recognition-game" element={<ProtectedRoute><ImageRecognitionGame /></ProtectedRoute>} />

        {/* 个人中心子页面 */}
        <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
        <Route path="/my-works" element={<ProtectedRoute><MyWorks /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

        {/* 未匹配的路由重定向到创作页 */}
        <Route path="*" element={<Navigate to="/create" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
