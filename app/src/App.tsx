import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Splash,
  Login,
  Home,
  Create,
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

// 初始路由组件：决定显示Splash还是Home
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

  return isLoggedIn ? <Navigate to="/home" replace /> : <Navigate to="/splash" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InitialRoute />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/mind-garden" element={<ProtectedRoute><MindGarden /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
        <Route path="/art-creator" element={<ProtectedRoute><ArtCreator /></ProtectedRoute>} />
        <Route path="/music-creator" element={<ProtectedRoute><MusicCreator /></ProtectedRoute>} />
        <Route path="/story-creator" element={<ProtectedRoute><StoryCreator /></ProtectedRoute>} />
        <Route path="/poem-creator" element={<ProtectedRoute><PoemCreator /></ProtectedRoute>} />
        <Route path="/expression-game" element={<ProtectedRoute><ExpressionGame /></ProtectedRoute>} />
        <Route path="/image-recognition-game" element={<ProtectedRoute><ImageRecognitionGame /></ProtectedRoute>} />
        <Route path="/my-works" element={<ProtectedRoute><MyWorks /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        {/* 未匹配的路由重定向到首页 */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
