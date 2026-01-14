import { useState, useEffect, useRef } from 'react'
import { Layout, Header } from '../components/layout'
import { UsageTracker } from '../services/usageTracking'
import './NumberPuzzle.css'

type Board = (number | null)[]

export default function NumberPuzzle() {
  const [board, setBoard] = useState<Board>([])
  const [moves, setMoves] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSolved, setIsSolved] = useState(false)
  const [bestMoves, setBestMoves] = useState<number | null>(null)
  const usageTrackerRef = useRef<UsageTracker | null>(null)

  // 加载最佳步数
  useEffect(() => {
    const saved = localStorage.getItem('numberPuzzleBestMoves')
    if (saved) {
      setBestMoves(parseInt(saved))
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

  // 初始化棋盘
  const initBoard = () => {
    let newBoard: Board = [1, 2, 3, 4, 5, 6, 7, 8, null]

    // 打乱棋盘
    for (let i = 0; i < 100; i++) {
      const emptyIndex = newBoard.indexOf(null)
      const validMoves = getValidMoves(newBoard, emptyIndex)
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]
      newBoard = swap(newBoard, emptyIndex, randomMove)
    }

    setBoard(newBoard)
    setMoves(0)
    setIsPlaying(true)
    setIsSolved(false)

    // 启动使用追踪
    usageTrackerRef.current = new UsageTracker('游戏', '数字华容道')
    usageTrackerRef.current.start()
  }

  // 获取可移动的位置
  const getValidMoves = (_currentBoard: Board, emptyIndex: number): number[] => {
    const moves: number[] = []
    const row = Math.floor(emptyIndex / 3)
    const col = emptyIndex % 3

    if (row > 0) moves.push(emptyIndex - 3) // 上
    if (row < 2) moves.push(emptyIndex + 3) // 下
    if (col > 0) moves.push(emptyIndex - 1) // 左
    if (col < 2) moves.push(emptyIndex + 1) // 右

    return moves
  }

  // 交换位置
  const swap = (currentBoard: Board, index1: number, index2: number): Board => {
    const newBoard = [...currentBoard]
    ;[newBoard[index1], newBoard[index2]] = [newBoard[index2], newBoard[index1]]
    return newBoard
  }

  // 检查是否完成
  const checkSolved = (currentBoard: Board): boolean => {
    for (let i = 0; i < 8; i++) {
      if (currentBoard[i] !== i + 1) return false
    }
    return currentBoard[8] === null
  }

  // 点击方块
  const handleTileClick = (index: number) => {
    if (!isPlaying || isSolved) return

    const emptyIndex = board.indexOf(null)
    const validMoves = getValidMoves(board, emptyIndex)

    if (validMoves.includes(index)) {
      const newBoard = swap(board, emptyIndex, index)
      setBoard(newBoard)
      setMoves(moves + 1)

      if (checkSolved(newBoard)) {
        setIsSolved(true)
        setIsPlaying(false)

        // 记录使用数据
        if (usageTrackerRef.current) {
          const finalMoves = moves + 1
          const score = Math.max(0, 100 - finalMoves)
          usageTrackerRef.current.end(score, {
            moves: finalMoves,
            success: true
          })
          usageTrackerRef.current = null
        }

        // 更新最佳步数
        if (bestMoves === null || moves + 1 < bestMoves) {
          setBestMoves(moves + 1)
          localStorage.setItem('numberPuzzleBestMoves', (moves + 1).toString())
        }
      }
    }
  }

  return (
    <Layout>
      <Header
        title="数字华容道"
        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        showBack={true}
      />
      <div className="main-content">
        <div className="puzzle-info">
          <div className="info-card">
            <div className="info-label">步数</div>
            <div className="info-value moves">{moves}</div>
          </div>
          <div className="info-card">
            <div className="info-label">最佳</div>
            <div className="info-value best">{bestMoves ?? '-'}</div>
          </div>
        </div>

        {board.length > 0 && (
          <div className="puzzle-board">
            {board.map((tile, index) => (
              <div
                key={index}
                className={`puzzle-tile ${tile === null ? 'empty' : ''}`}
                onClick={() => handleTileClick(index)}
              >
                {tile !== null && <span>{tile}</span>}
              </div>
            ))}
          </div>
        )}

        {!isPlaying && !isSolved && (
          <button className="start-button" onClick={initBoard}>
            开始游戏
          </button>
        )}

        {isPlaying && (
          <button className="reset-button" onClick={initBoard}>
            重新开始
          </button>
        )}

        {isSolved && (
          <div className="success-message">
            <div className="success-title">🎉 恭喜完成!</div>
            <div className="success-moves">用了 {moves} 步</div>
            {moves === bestMoves && (
              <div className="new-record">✨ 新纪录!</div>
            )}
            <button className="play-again-button" onClick={initBoard}>
              再玩一次
            </button>
          </div>
        )}

        <div className="game-tips">
          <div className="tips-title">💡 游戏说明</div>
          <div className="tips-content">
            点击数字方块移动到空白位置，将数字按顺序排列即可获胜！
          </div>
        </div>
      </div>
    </Layout>
  )
}
