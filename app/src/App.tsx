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
  MyWorks,
  Favorites,
  StoryLibrary,
  FruitMatch,
  TankBattle,
  ChessGame,
  ChineseChess,
  CrystalMatch,
  AIEncyclopedia,
  PictureBook,
  FourClassics,
  WhackAMole,
  NumberPuzzle,
  JigsawPuzzle,
  Search,
  ParentLogin,
  ParentLayout,
  ParentDashboard,
  ChildrenManagement,
  LearningData,
  UsageControl,
  GrowthReport,
  ParentSettings
} from './pages'
import TimeLockModal from './components/TimeLockModal'
import ContentProtectedRoute from './components/ContentProtectedRoute'
import { timeControlManager } from './services/timeControl'
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

// 家长端路由守卫组件：检查家长是否已登录
function ParentProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const parentProfile = localStorage.getItem('parentProfile')
    setIsLoggedIn(!!parentProfile)
    setIsChecking(false)
  }, [])

  if (isChecking) {
    return <div>Loading...</div>
  }

  return isLoggedIn ? <>{children}</> : <Navigate to="/parent/login" replace />
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
  const [showTimeLock, setShowTimeLock] = useState(false)
  const [lockReason, setLockReason] = useState<string>()
  const [remainingTime, setRemainingTime] = useState<number>()

  useEffect(() => {
    // 检查是否是儿童端登录
    const userProfile = localStorage.getItem('userProfile')
    if (!userProfile) return

    // 加载时间控制设置
    timeControlManager.loadSettings()

    // 启动时间监控
    timeControlManager.startMonitoring(() => {
      // 时间到了，显示锁定界面
      timeControlManager.checkTimeLimit().then(result => {
        if (!result.allowed) {
          setLockReason(result.reason)
          setRemainingTime(result.remainingTime)
          setShowTimeLock(true)
        }
      })
    }, 60) // 每60秒检查一次

    return () => {
      timeControlManager.stopMonitoring()
    }
  }, [])

  const handleUnlock = () => {
    // 家长解锁后，刷新设置并关闭锁定界面
    timeControlManager.loadSettings().then(() => {
      setShowTimeLock(false)
    })
  }

  return (
    <BrowserRouter>
      {showTimeLock && (
        <TimeLockModal
          remainingTime={remainingTime}
          reason={lockReason}
          onUnlock={handleUnlock}
        />
      )}
      <Routes>
        <Route path="/" element={<InitialRoute />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />

        {/* 4个主导航页面 */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* 全局搜索页面 */}
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />

        {/* 个人中心子页面 */}
        <Route path="/mind-garden" element={<ProtectedRoute><MindGarden /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
        <Route path="/my-works" element={<ProtectedRoute><MyWorks /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

        {/* 创作工具子页面 - 受内容访问控制 */}
        <Route path="/art-creator" element={<ProtectedRoute><ContentProtectedRoute contentType="creation"><ArtCreator /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/music-creator" element={<ProtectedRoute><ContentProtectedRoute contentType="creation"><MusicCreator /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/story-creator" element={<ProtectedRoute><ContentProtectedRoute contentType="creation"><StoryCreator /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/poem-creator" element={<ProtectedRoute><ContentProtectedRoute contentType="creation"><PoemCreator /></ContentProtectedRoute></ProtectedRoute>} />

        {/* 游戏子页面 - 受内容访问控制 */}
        <Route path="/fruit-match" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><FruitMatch /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/tank-battle" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><TankBattle /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/chess-game" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><ChessGame /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/chinese-chess" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><ChineseChess /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/crystal-match" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><CrystalMatch /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/whack-a-mole" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><WhackAMole /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/number-puzzle" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><NumberPuzzle /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/jigsaw-puzzle" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><JigsawPuzzle /></ContentProtectedRoute></ProtectedRoute>} />

        {/* 阅读相关页面 - 受内容访问控制 */}
        <Route path="/story-library" element={<ProtectedRoute><ContentProtectedRoute contentType="reading"><StoryLibrary /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/picture-book" element={<ProtectedRoute><ContentProtectedRoute contentType="reading"><PictureBook /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/four-classics" element={<ProtectedRoute><ContentProtectedRoute contentType="reading"><FourClassics /></ContentProtectedRoute></ProtectedRoute>} />

        {/* AI百科页面 - 受内容访问控制 */}
        <Route path="/ai-encyclopedia" element={<ProtectedRoute><ContentProtectedRoute contentType="aiEncyclopedia"><AIEncyclopedia /></ContentProtectedRoute></ProtectedRoute>} />

        {/* 家长端路由 */}
        <Route path="/parent/login" element={<ParentLogin />} />
        <Route path="/parent" element={<ParentProtectedRoute><ParentLayout /></ParentProtectedRoute>}>
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="children" element={<ChildrenManagement />} />
          <Route path="data" element={<LearningData />} />
          <Route path="control" element={<UsageControl />} />
          <Route path="report" element={<GrowthReport />} />
          <Route path="settings" element={<ParentSettings />} />
        </Route>

        {/* 未匹配的路由重定向到首页 */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
