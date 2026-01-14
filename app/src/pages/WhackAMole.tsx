import { useState, useEffect, useRef } from 'react'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import './WhackAMole.css'

interface Hole {
  id: number
  hasMole: boolean
  isHit: boolean
}

export default function WhackAMole() {
  const [holes, setHoles] = useState<Hole[]>(
    Array.from({ length: 9 }, (_, i) => ({ id: i, hasMole: false, isHit: false }))
  )
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isPlaying, setIsPlaying] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const gameTimerRef = useRef<number | null>(null)
  const moleTimerRef = useRef<number | null>(null)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  // 加载最高分
  useEffect(() => {
    const savedHighScore = localStorage.getItem('whackAMoleHighScore')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore))
    }
  }, [])

  // 组件卸载时清理追踪器
  useEffect(() => {
    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.cancel()
      }
    }
  }, [])

  // 游戏计时器
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      gameTimerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && isPlaying) {
      endGame()
    }

    return () => {
      if (gameTimerRef.current) clearTimeout(gameTimerRef.current)
    }
  }, [isPlaying, timeLeft])

  // 地鼠出现逻辑
  useEffect(() => {
    if (isPlaying) {
      const showMole = () => {
        const randomHole = Math.floor(Math.random() * 9)
        setHoles(prev => prev.map((hole, idx) =>
          idx === randomHole ? { ...hole, hasMole: true, isHit: false } : { ...hole, hasMole: false, isHit: false }
        ))

        // 地鼠显示时间
        setTimeout(() => {
          setHoles(prev => prev.map(hole => ({ ...hole, hasMole: false })))
        }, 800)
      }

      moleTimerRef.current = setInterval(showMole, 1000)
    }

    return () => {
      if (moleTimerRef.current) clearInterval(moleTimerRef.current)
    }
  }, [isPlaying])

  const startGame = () => {
    setScore(0)
    setTimeLeft(30)
    setIsPlaying(true)
    setHoles(Array.from({ length: 9 }, (_, i) => ({ id: i, hasMole: false, isHit: false })))

    // 启动使用追踪
    usageTrackerRef.current = new UsageTracker('游戏', '打地鼠')
    usageTrackerRef.current.start()
  }

  const endGame = () => {
    setIsPlaying(false)
    if (gameTimerRef.current) clearTimeout(gameTimerRef.current)
    if (moleTimerRef.current) clearInterval(moleTimerRef.current)

    // 记录使用数据
    if (usageTrackerRef.current) {
      usageTrackerRef.current.end(score, {
        timeLeft,
        totalTime: 30 - timeLeft,
        hits: score / 10
      })
      usageTrackerRef.current = null
    }

    // 更新最高分
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('whackAMoleHighScore', score.toString())
    }
  }

  const hitMole = (holeId: number) => {
    if (!isPlaying) return

    setHoles(prev => {
      const hole = prev[holeId]
      if (hole.hasMole && !hole.isHit) {
        setScore(s => s + 10)
        return prev.map((h, idx) =>
          idx === holeId ? { ...h, isHit: true } : h
        )
      }
      return prev
    })
  }

  return (
    <Layout>
      <Header
        title="打地鼠"
        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        showBack={true}
      />
      <div className="main-content">
        <div className="game-info">
          <div className="info-card">
            <div className="info-label">得分</div>
            <div className="info-value score">{score}</div>
          </div>
          <div className="info-card">
            <div className="info-label">时间</div>
            <div className="info-value time">{timeLeft}s</div>
          </div>
          <div className="info-card">
            <div className="info-label">最高分</div>
            <div className="info-value high-score">{highScore}</div>
          </div>
        </div>

        <div className="game-board">
          {holes.map((hole) => (
            <div
              key={hole.id}
              className={`hole ${hole.hasMole ? 'has-mole' : ''} ${hole.isHit ? 'hit' : ''}`}
              onClick={() => hitMole(hole.id)}
            >
              <div className="hole-bg"></div>
              {hole.hasMole && !hole.isHit && <div className="mole">🐹</div>}
              {hole.isHit && <div className="hit-effect">💥</div>}
            </div>
          ))}
        </div>

        {!isPlaying && (
          <button className="start-button" onClick={startGame}>
            {timeLeft === 30 ? '开始游戏' : '再玩一次'}
          </button>
        )}

        {timeLeft === 0 && (
          <div className="game-over">
            <div className="game-over-title">游戏结束!</div>
            <div className="game-over-score">本次得分: {score}</div>
            {score === highScore && score > 0 && (
              <div className="new-record">🎉 新纪录!</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
