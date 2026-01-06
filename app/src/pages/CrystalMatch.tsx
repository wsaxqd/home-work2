import { useState, useEffect, useCallback, useRef } from 'react'
import { Layout, Header } from '../components/layout'
import './CrystalMatch.css'

// 水晶类型定义（7种颜色的水晶）
type CrystalType = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink'

interface Crystal {
  id: string
  type: CrystalType
  row: number
  col: number
  matched: boolean
  falling: boolean
}

interface Position {
  row: number
  col: number
}

const CRYSTAL_TYPES: CrystalType[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink']
const GRID_SIZE = 8 // 8x8 网格
const MATCH_MIN = 3 // 最少消除数量

// 水晶图标映射（使用emoji代替图片，更有水晶质感）
const CRYSTAL_ICONS: Record<CrystalType, string> = {
  red: '💎',
  blue: '💠',
  green: '🔷',
  yellow: '🔶',
  purple: '🟣',
  orange: '🟠',
  pink: '💖'
}

const CRYSTAL_COLORS: Record<CrystalType, string> = {
  red: '#ff4757',
  blue: '#5352ed',
  green: '#26de81',
  yellow: '#fed330',
  purple: '#a55eea',
  orange: '#ff9f43',
  pink: '#fd79a8'
}

export default function CrystalMatch() {
  const [grid, setGrid] = useState<Crystal[][]>([])
  const [selectedCrystal, setSelectedCrystal] = useState<Position | null>(null)
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(30)
  const [combo, setCombo] = useState(0)
  const [targetScore, setTargetScore] = useState(1000)
  const [level, setLevel] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const animationTimerRef = useRef<number | null>(null)

  // 生成随机水晶
  const generateCrystal = (row: number, col: number): Crystal => {
    return {
      id: `crystal-${row}-${col}-${Date.now()}-${Math.random()}`,
      type: CRYSTAL_TYPES[Math.floor(Math.random() * CRYSTAL_TYPES.length)],
      row,
      col,
      matched: false,
      falling: false
    }
  }

  // 初始化棋盘
  const initializeGrid = useCallback(() => {
    const newGrid: Crystal[][] = []
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row] = []
      for (let col = 0; col < GRID_SIZE; col++) {
        newGrid[row][col] = generateCrystal(row, col)
      }
    }

    // 确保初始棋盘没有可消除的组合
    let hasMatches = true
    let attempts = 0
    while (hasMatches && attempts < 100) {
      hasMatches = false
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          // 检查横向
          if (col >= 2 &&
              newGrid[row][col].type === newGrid[row][col-1].type &&
              newGrid[row][col].type === newGrid[row][col-2].type) {
            newGrid[row][col] = generateCrystal(row, col)
            hasMatches = true
          }
          // 检查纵向
          if (row >= 2 &&
              newGrid[row][col].type === newGrid[row-1][col].type &&
              newGrid[row][col].type === newGrid[row-2][col].type) {
            newGrid[row][col] = generateCrystal(row, col)
            hasMatches = true
          }
        }
      }
      attempts++
    }

    setGrid(newGrid)
  }, [])

  // 初始化游戏
  const initGame = useCallback(() => {
    initializeGrid()
    setScore(0)
    setMoves(30)
    setCombo(0)
    setLevel(1)
    setTargetScore(1000)
    setGameOver(false)
    setGameWon(false)
    setSelectedCrystal(null)
  }, [initializeGrid])

  // 检查位置是否有效
  const isValidPosition = (row: number, col: number): boolean => {
    return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE
  }

  // 检查两个水晶是否相邻
  const isAdjacent = (pos1: Position, pos2: Position): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row)
    const colDiff = Math.abs(pos1.col - pos2.col)
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
  }

  // 交换两个水晶
  const swapCrystals = (pos1: Position, pos2: Position, tempGrid: Crystal[][]): void => {
    const temp = tempGrid[pos1.row][pos1.col]
    tempGrid[pos1.row][pos1.col] = tempGrid[pos2.row][pos2.col]
    tempGrid[pos2.row][pos2.col] = temp

    // 更新位置信息
    tempGrid[pos1.row][pos1.col].row = pos1.row
    tempGrid[pos1.row][pos1.col].col = pos1.col
    tempGrid[pos2.row][pos2.col].row = pos2.row
    tempGrid[pos2.row][pos2.col].col = pos2.col
  }

  // 查找匹配的水晶
  const findMatches = (tempGrid: Crystal[][]): Position[] => {
    const matches: Set<string> = new Set()

    // 检查横向匹配
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const type = tempGrid[row][col].type
        let matchLength = 1

        for (let k = col + 1; k < GRID_SIZE && tempGrid[row][k].type === type; k++) {
          matchLength++
        }

        if (matchLength >= MATCH_MIN) {
          for (let k = 0; k < matchLength; k++) {
            matches.add(`${row}-${col + k}`)
          }
        }
      }
    }

    // 检查纵向匹配
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const type = tempGrid[row][col].type
        let matchLength = 1

        for (let k = row + 1; k < GRID_SIZE && tempGrid[k][col].type === type; k++) {
          matchLength++
        }

        if (matchLength >= MATCH_MIN) {
          for (let k = 0; k < matchLength; k++) {
            matches.add(`${row + k}-${col}`)
          }
        }
      }
    }

    return Array.from(matches).map(key => {
      const [row, col] = key.split('-').map(Number)
      return { row, col }
    })
  }

  // 标记匹配的水晶
  const markMatches = (tempGrid: Crystal[][], matches: Position[]): void => {
    matches.forEach(({ row, col }) => {
      tempGrid[row][col].matched = true
    })
  }

  // 移除匹配的水晶并下落
  const removeAndFall = (tempGrid: Crystal[][]): Crystal[][] => {
    const newGrid = tempGrid.map(row => [...row])

    // 移除匹配的水晶
    for (let col = 0; col < GRID_SIZE; col++) {
      // 从下往上处理每一列
      let writeRow = GRID_SIZE - 1
      for (let readRow = GRID_SIZE - 1; readRow >= 0; readRow--) {
        if (!newGrid[readRow][col].matched) {
          if (readRow !== writeRow) {
            newGrid[writeRow][col] = { ...newGrid[readRow][col], row: writeRow, falling: true }
          }
          writeRow--
        }
      }

      // 填充新水晶
      while (writeRow >= 0) {
        newGrid[writeRow][col] = { ...generateCrystal(writeRow, col), falling: true }
        writeRow--
      }
    }

    return newGrid
  }

  // 处理消除逻辑
  const processMatches = useCallback(async () => {
    setIsProcessing(true)
    let tempGrid = grid.map(row => row.map(cell => ({ ...cell })))
    let currentCombo = 0
    let totalMatches = 0

    let hasMatches = true
    while (hasMatches) {
      const matches = findMatches(tempGrid)

      if (matches.length === 0) {
        hasMatches = false
        break
      }

      currentCombo++
      totalMatches += matches.length

      // 标记匹配
      markMatches(tempGrid, matches)
      setGrid(tempGrid.map(row => row.map(cell => ({ ...cell }))))

      // 等待消除动画
      await new Promise(resolve => setTimeout(resolve, 400))

      // 移除并下落
      tempGrid = removeAndFall(tempGrid)
      setGrid(tempGrid.map(row => row.map(cell => ({ ...cell }))))

      // 等待下落动画
      await new Promise(resolve => setTimeout(resolve, 400))

      // 清除 falling 标记
      tempGrid = tempGrid.map(row => row.map(cell => ({ ...cell, falling: false, matched: false })))
    }

    // 计算得分
    if (totalMatches > 0) {
      const baseScore = totalMatches * 10
      const comboBonus = currentCombo > 1 ? (currentCombo - 1) * 50 : 0
      const totalScore = baseScore + comboBonus

      setScore(prev => prev + totalScore)
      setCombo(currentCombo)

      // Combo动画消失
      setTimeout(() => setCombo(0), 2000)
    }

    setGrid(tempGrid)
    setIsProcessing(false)
  }, [grid])

  // 处理水晶点击
  const handleCrystalClick = async (row: number, col: number) => {
    if (isProcessing || gameOver || gameWon) return

    const clickedPos = { row, col }

    if (!selectedCrystal) {
      // 第一次点击，选择水晶
      setSelectedCrystal(clickedPos)
    } else {
      // 第二次点击
      if (selectedCrystal.row === row && selectedCrystal.col === col) {
        // 点击同一个，取消选择
        setSelectedCrystal(null)
      } else if (isAdjacent(selectedCrystal, clickedPos)) {
        // 相邻水晶，尝试交换
        const tempGrid = grid.map(row => row.map(cell => ({ ...cell })))
        swapCrystals(selectedCrystal, clickedPos, tempGrid)

        // 检查交换后是否有匹配
        const matches = findMatches(tempGrid)

        if (matches.length > 0) {
          // 有匹配，应用交换
          setGrid(tempGrid)
          setSelectedCrystal(null)
          setMoves(prev => prev - 1)

          // 延迟处理消除，让交换动画完成
          setTimeout(() => {
            processMatches()
          }, 300)
        } else {
          // 无匹配，交换回来（播放错误动画）
          setSelectedCrystal(null)
        }
      } else {
        // 不相邻，选择新的水晶
        setSelectedCrystal(clickedPos)
      }
    }
  }

  // 检查游戏结束
  useEffect(() => {
    if (moves <= 0 && !isProcessing) {
      if (score >= targetScore) {
        setGameWon(true)
      } else {
        setGameOver(true)
      }
    }
  }, [moves, score, targetScore, isProcessing])

  // 下一关
  const nextLevel = () => {
    setLevel(prev => prev + 1)
    setTargetScore(prev => prev + 500)
    setMoves(30)
    setGameWon(false)
    initializeGrid()
  }

  // 初始化
  useEffect(() => {
    initGame()
  }, [initGame])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (animationTimerRef.current !== null) {
        clearTimeout(animationTimerRef.current)
      }
    }
  }, [])

  return (
    <Layout>
      <Header
        title="💎 水晶消消乐"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        showBack={true}
        showLogout={false}
      />
      <div className="crystal-match-container">
        {/* 游戏信息面板 */}
        <div className="game-info-bar">
          <div className="info-group">
            <div className="info-label">关卡</div>
            <div className="info-value level-value">{level}</div>
          </div>
          <div className="info-group">
            <div className="info-label">得分</div>
            <div className="info-value score-value">{score}</div>
          </div>
          <div className="info-group">
            <div className="info-label">目标</div>
            <div className="info-value target-value">{targetScore}</div>
          </div>
          <div className="info-group">
            <div className="info-label">步数</div>
            <div className="info-value moves-value">{moves}</div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min((score / targetScore) * 100, 100)}%` }}
            >
              <div className="progress-shine"></div>
            </div>
          </div>
          <div className="progress-text">
            {score} / {targetScore}
          </div>
        </div>

        {/* Combo提示 */}
        {combo > 1 && (
          <div className="combo-display">
            <div className="combo-text">COMBO x{combo}!</div>
            <div className="combo-stars">✨✨✨</div>
          </div>
        )}

        {/* 游戏棋盘 */}
        <div className="crystal-grid-container">
          <div className="crystal-grid">
            {grid.map((row, rowIndex) => (
              row.map((crystal, colIndex) => {
                const isSelected = selectedCrystal?.row === rowIndex && selectedCrystal?.col === colIndex

                return (
                  <div
                    key={crystal.id}
                    className={`crystal-cell ${isSelected ? 'selected' : ''} ${crystal.matched ? 'matched' : ''} ${crystal.falling ? 'falling' : ''}`}
                    onClick={() => handleCrystalClick(rowIndex, colIndex)}
                    style={{
                      '--crystal-color': CRYSTAL_COLORS[crystal.type]
                    } as React.CSSProperties}
                  >
                    <div className="crystal-inner">
                      <div className="crystal-shine"></div>
                      <div className="crystal-icon">{CRYSTAL_ICONS[crystal.type]}</div>
                      <div className="crystal-glow"></div>
                    </div>
                  </div>
                )
              })
            ))}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="game-controls">
          <button className="control-button restart-btn" onClick={initGame}>
            <span className="btn-icon">🔄</span>
            <span className="btn-text">重新开始</span>
          </button>
        </div>

        {/* 游戏结束弹窗 */}
        {(gameOver || gameWon) && (
          <div className="game-modal">
            <div className={`modal-content ${gameWon ? 'victory' : 'defeat'}`}>
              <div className="modal-icon">
                {gameWon ? '🎉' : '😢'}
              </div>
              <h2>{gameWon ? '恭喜过关！' : '游戏结束'}</h2>
              <div className="modal-stats">
                <div className="stat-row">
                  <span>关卡</span>
                  <strong>{level}</strong>
                </div>
                <div className="stat-row">
                  <span>最终得分</span>
                  <strong>{score}</strong>
                </div>
                <div className="stat-row">
                  <span>目标分数</span>
                  <strong>{targetScore}</strong>
                </div>
              </div>
              <div className="modal-buttons">
                {gameWon ? (
                  <>
                    <button className="modal-btn primary" onClick={nextLevel}>
                      下一关 →
                    </button>
                    <button className="modal-btn secondary" onClick={initGame}>
                      重新开始
                    </button>
                  </>
                ) : (
                  <button className="modal-btn primary" onClick={initGame}>
                    再试一次
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
