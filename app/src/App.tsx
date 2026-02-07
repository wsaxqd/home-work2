import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ToastProvider } from './components/Toast'
import {
  Splash,
  Login,
  Home,
  Create,
  Games,
  Profile,
  Community,
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
  ChineseClassics,
  WhackAMole,
  NumberPuzzle,
  JigsawPuzzle,
  Search,
  WarmHouse,
  AICompanion,
  MoodDiary,
  WarmRadio,
  WishTree,
  ParentLogin,
  ParentLayout,
  ParentDashboard,
  ChildrenManagement,
  LearningData,
  UsageControl,
  GrowthReport,
  ParentSettings,
  ChildrenSongs,
  EnglishBook,
  WhyQuestions,
  HomeworkHelper,
  HomeworkAnswer,
  HomeworkHistory,
  PKBattle,
  PKRoom,
  WrongQuestionBook,
  LearningMap,
  Checkin,
  HabitTracker,
  CheckinAchievements,
  GameLeaderboard,
  RankingLeaderboard,
  ExpressionGame,
  ImageRecognitionGame,
  MathSpeedGame,
  IdiomChainGame,
  EnglishSpellingGame,
  ScienceQuizGame,
  MemoryCardGame,
  TetrisGame,
  SnakeGame,
  Game2048,
  Explore,
  Garden,
  PictureBookReader,
  LevelDetail,
  Messages,
  DailyTasks,
  CoinsDetail,
  CoinsRanking,
  ShopMall,
  ShopHistory,
  WeakPointDiagnosis,
  PersonalizedLearningPath,
  KnowledgePointDetail,
  Practice,
  SkillTree,
  TodayTasks,
  Achievements,
  Settings,
  AccountSecurity,
  PasswordReset,
  HelpCenter,
  Feedback,
  About,
  PrivacyPolicy
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
    <ToastProvider>
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
        <Route path="/password-reset" element={<PasswordReset />} />

        {/* 4个主导航页面 */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* 社区页面 */}
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />

        {/* 全局搜索页面 */}
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />

        {/* 探索发现页面 */}
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />

        {/* 心灵花园导航 */}
        <Route path="/garden" element={<ProtectedRoute><Garden /></ProtectedRoute>} />

        {/* 个人中心子页面 */}
        <Route path="/mind-garden" element={<ProtectedRoute><MindGarden /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
        <Route path="/my-works" element={<ProtectedRoute><MyWorks /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

        {/* 消息中心 */}
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

        {/* 每日任务 */}
        <Route path="/daily-tasks" element={<ProtectedRoute><DailyTasks /></ProtectedRoute>} />

        {/* 积分系统 */}
        <Route path="/coins-detail" element={<ProtectedRoute><CoinsDetail /></ProtectedRoute>} />
        <Route path="/coins-ranking" element={<ProtectedRoute><CoinsRanking /></ProtectedRoute>} />
        <Route path="/shop-mall" element={<ProtectedRoute><ShopMall /></ProtectedRoute>} />
        <Route path="/shop-history" element={<ProtectedRoute><ShopHistory /></ProtectedRoute>} />

        {/* 创作工具子页面 - 受内容访问控制 */}
        <Route path="/art-creator" element={<ProtectedRoute><ContentProtectedRoute contentType="creation"><ArtCreator /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/music-creator" element={<ProtectedRoute><ContentProtectedRoute contentType="creation"><MusicCreator /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/story-creator" element={<ProtectedRoute><ContentProtectedRoute contentType="creation"><StoryCreator /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/poem-creator" element={<ProtectedRoute><ContentProtectedRoute contentType="creation"><PoemCreator /></ContentProtectedRoute></ProtectedRoute>} />

        {/* 游戏子页面 - 受内容访问控制 */}
        <Route path="/fruit-match" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><FruitMatch /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/expression-game" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><ExpressionGame /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/image-recognition-game" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><ImageRecognitionGame /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/math-speed-game" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><MathSpeedGame /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/idiom-chain-game" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><IdiomChainGame /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/english-spelling-game" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><EnglishSpellingGame /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/science-quiz-game" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><ScienceQuizGame /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/memory-card-game" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><MemoryCardGame /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/tetris-game" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><TetrisGame /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/snake-game" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><SnakeGame /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/game-2048" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><Game2048 /></ContentProtectedRoute></ProtectedRoute>} />
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
        <Route path="/picture-book-reader" element={<ProtectedRoute><ContentProtectedRoute contentType="reading"><PictureBookReader /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/four-classics" element={<ProtectedRoute><ContentProtectedRoute contentType="reading"><FourClassics /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/chinese-classics" element={<ProtectedRoute><ContentProtectedRoute contentType="reading"><ChineseClassics /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/children-songs" element={<ProtectedRoute><ContentProtectedRoute contentType="reading"><ChildrenSongs /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/english-book" element={<ProtectedRoute><ContentProtectedRoute contentType="reading"><EnglishBook /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/why-questions" element={<ProtectedRoute><ContentProtectedRoute contentType="reading"><WhyQuestions /></ContentProtectedRoute></ProtectedRoute>} />

        {/* AI百科页面 - 受内容访问控制 */}
        <Route path="/ai-encyclopedia" element={<ProtectedRoute><ContentProtectedRoute contentType="aiEncyclopedia"><AIEncyclopedia /></ContentProtectedRoute></ProtectedRoute>} />

        {/* 温暖小屋 - 公益情感陪伴功能 */}
        <Route path="/warm-house" element={<ProtectedRoute><WarmHouse /></ProtectedRoute>} />
        <Route path="/warm-house/companion" element={<ProtectedRoute><AICompanion /></ProtectedRoute>} />
        <Route path="/warm-house/diary" element={<ProtectedRoute><MoodDiary /></ProtectedRoute>} />
        <Route path="/warm-house/radio" element={<ProtectedRoute><WarmRadio /></ProtectedRoute>} />
        <Route path="/warm-house/wish" element={<ProtectedRoute><WishTree /></ProtectedRoute>} />

        {/* AI作业助手 - 小学初中作业辅导 */}
        <Route path="/homework" element={<ProtectedRoute><HomeworkHelper /></ProtectedRoute>} />
        <Route path="/homework/answer/:questionId" element={<ProtectedRoute><HomeworkAnswer /></ProtectedRoute>} />
        <Route path="/homework/history" element={<ProtectedRoute><HomeworkHistory /></ProtectedRoute>} />

        {/* 学习功能 */}
        <Route path="/wrong-questions" element={<ProtectedRoute><WrongQuestionBook /></ProtectedRoute>} />
        <Route path="/learning-map" element={<ProtectedRoute><LearningMap /></ProtectedRoute>} />
        <Route path="/learning/stage/:stageId" element={<ProtectedRoute><LevelDetail /></ProtectedRoute>} />

        {/* 个性化学习引擎 */}
        <Route path="/weak-point-diagnosis" element={<ProtectedRoute><WeakPointDiagnosis /></ProtectedRoute>} />
        <Route path="/learning-path/:pathId" element={<ProtectedRoute><PersonalizedLearningPath /></ProtectedRoute>} />
        <Route path="/knowledge-point/:id" element={<ProtectedRoute><KnowledgePointDetail /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />

        {/* 签到系统 */}
        <Route path="/checkin" element={<ProtectedRoute><Checkin /></ProtectedRoute>} />
        <Route path="/habit-tracker" element={<ProtectedRoute><HabitTracker /></ProtectedRoute>} />
        <Route path="/checkin-achievements" element={<ProtectedRoute><CheckinAchievements /></ProtectedRoute>} />

        {/* PK对战系统 */}
        <Route path="/pk-battle" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><PKBattle /></ContentProtectedRoute></ProtectedRoute>} />
        <Route path="/pk/room/:roomId" element={<ProtectedRoute><ContentProtectedRoute contentType="games"><PKRoom /></ContentProtectedRoute></ProtectedRoute>} />

        {/* 游戏排行榜 */}
        <Route path="/game-leaderboard" element={<ProtectedRoute><GameLeaderboard /></ProtectedRoute>} />

        {/* PK排位排行榜 */}
        <Route path="/ranking-leaderboard" element={<ProtectedRoute><RankingLeaderboard /></ProtectedRoute>} />

        {/* 技能树系统 */}
        <Route path="/skill-tree" element={<ProtectedRoute><SkillTree /></ProtectedRoute>} />

        {/* 成就系统 */}
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />

        {/* 今日任务 */}
        <Route path="/today-tasks" element={<ProtectedRoute><TodayTasks /></ProtectedRoute>} />

        {/* 设置页面 */}
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* 账户安全页面 */}
        <Route path="/account-security" element={<ProtectedRoute><AccountSecurity /></ProtectedRoute>} />

        {/* 帮助中心 */}
        <Route path="/help-center" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />

        {/* 用户反馈 */}
        <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />

        {/* 关于页面 */}
        <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />

        {/* 隐私政策 */}
        <Route path="/privacy-policy" element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />

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
    </ToastProvider>
  )
}

export default App

