import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Splash,
  Login,
  Home,
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
  Favorites,
  StoryLibrary,
  FruitMatch,
  TankBattle,
  ChessGame,
  ChineseChess,
  CrystalMatch,
  AIEncyclopedia
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

  return isLoggedIn ? <Navigate to="/home" replace /> : <Navigate to="/splash" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InitialRoute />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />

        {/* 4个主导航页面 */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* 个人中心子页面 */}
        <Route path="/mind-garden" element={<ProtectedRoute><MindGarden /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
        <Route path="/my-works" element={<ProtectedRoute><MyWorks /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

        {/* 创作工具子页面 */}
        <Route path="/art-creator" element={<ProtectedRoute><ArtCreator /></ProtectedRoute>} />
        <Route path="/music-creator" element={<ProtectedRoute><MusicCreator /></ProtectedRoute>} />
        <Route path="/story-creator" element={<ProtectedRoute><StoryCreator /></ProtectedRoute>} />
        <Route path="/poem-creator" element={<ProtectedRoute><PoemCreator /></ProtectedRoute>} />

        {/* 游戏子页面 */}
        <Route path="/expression-game" element={<ProtectedRoute><ExpressionGame /></ProtectedRoute>} />
        <Route path="/image-recognition-game" element={<ProtectedRoute><ImageRecognitionGame /></ProtectedRoute>} />
        <Route path="/fruit-match" element={<ProtectedRoute><FruitMatch /></ProtectedRoute>} />
        <Route path="/tank-battle" element={<ProtectedRoute><TankBattle /></ProtectedRoute>} />
        <Route path="/chess-game" element={<ProtectedRoute><ChessGame /></ProtectedRoute>} />
        <Route path="/chinese-chess" element={<ProtectedRoute><ChineseChess /></ProtectedRoute>} />
        <Route path="/crystal-match" element={<ProtectedRoute><CrystalMatch /></ProtectedRoute>} />

        {/* 故事库页面 */}
        <Route path="/story-library" element={<ProtectedRoute><StoryLibrary /></ProtectedRoute>} />

        {/* AI百科页面 */}
        <Route path="/ai-encyclopedia" element={<ProtectedRoute><AIEncyclopedia /></ProtectedRoute>} />

        {/* 未匹配的路由重定向到首页 */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
