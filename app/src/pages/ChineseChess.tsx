import { useState, useCallback } from 'react'
import { Layout, Header } from '../components/layout'
import './ChineseChess.css'

type PieceType = '帅' | '将' | '仕' | '士' | '相' | '象' | '马' | '车' | '炮' | '兵' | '卒'
type PieceColor = 'red' | 'black'

interface Piece {
  type: PieceType
  color: PieceColor
}

interface Position {
  row: number
  col: number
}

interface Move {
  from: Position
  to: Position
  piece: Piece
  captured?: Piece
  moveNumber: number
}

// 初始棋盘布局（9列x10行）
const INITIAL_BOARD: (Piece | null)[][] = [
  // 第0行：黑方底线
  [
    { type: '车', color: 'black' },
    { type: '马', color: 'black' },
    { type: '象', color: 'black' },
    { type: '士', color: 'black' },
    { type: '将', color: 'black' },
    { type: '士', color: 'black' },
    { type: '象', color: 'black' },
    { type: '马', color: 'black' },
    { type: '车', color: 'black' }
  ],
  // 第1行：空
  [null, null, null, null, null, null, null, null, null],
  // 第2行：黑方炮
  [null, { type: '炮', color: 'black' }, null, null, null, null, null, { type: '炮', color: 'black' }, null],
  // 第3行：黑方卒
  [
    { type: '卒', color: 'black' },
    null,
    { type: '卒', color: 'black' },
    null,
    { type: '卒', color: 'black' },
    null,
    { type: '卒', color: 'black' },
    null,
    { type: '卒', color: 'black' }
  ],
  // 第4行：楚河（空）
  [null, null, null, null, null, null, null, null, null],
  // 第5行：汉界（空）
  [null, null, null, null, null, null, null, null, null],
  // 第6行：红方兵
  [
    { type: '兵', color: 'red' },
    null,
    { type: '兵', color: 'red' },
    null,
    { type: '兵', color: 'red' },
    null,
    { type: '兵', color: 'red' },
    null,
    { type: '兵', color: 'red' }
  ],
  // 第7行：红方炮
  [null, { type: '炮', color: 'red' }, null, null, null, null, null, { type: '炮', color: 'red' }, null],
  // 第8行：空
  [null, null, null, null, null, null, null, null, null],
  // 第9行：红方底线
  [
    { type: '车', color: 'red' },
    { type: '马', color: 'red' },
    { type: '相', color: 'red' },
    { type: '仕', color: 'red' },
    { type: '帅', color: 'red' },
    { type: '仕', color: 'red' },
    { type: '相', color: 'red' },
    { type: '马', color: 'red' },
    { type: '车', color: 'red' }
  ]
]

export default function ChineseChess() {
  const [board, setBoard] = useState<(Piece | null)[][]>(INITIAL_BOARD)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('red')
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [capturedPieces, setCapturedPieces] = useState<{ red: Piece[], black: Piece[] }>({ red: [], black: [] })
  const [isCheck, setIsCheck] = useState(false)
  const [gameOver, setGameOver] = useState<{ winner: PieceColor | null, message: string } | null>(null)

  // 判断位置是否在棋盘内
  const isInBoard = (row: number, col: number): boolean => {
    return row >= 0 && row < 10 && col >= 0 && col < 9
  }

  // 判断是否在九宫格内
  const isInPalace = (row: number, col: number, color: PieceColor): boolean => {
    if (color === 'red') {
      return row >= 7 && row <= 9 && col >= 3 && col <= 5
    } else {
      return row >= 0 && row <= 2 && col >= 3 && col <= 5
    }
  }

  // 判断是否过河
  const hasCrossedRiver = (row: number, color: PieceColor): boolean => {
    return color === 'red' ? row < 5 : row > 4
  }

  // 获取帅/将的位置
  const getGeneralPosition = (color: PieceColor): Position | null => {
    const generalType = color === 'red' ? '帅' : '将'
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 9; col++) {
        const piece = board[row][col]
        if (piece && piece.type === generalType && piece.color === color) {
          return { row, col }
        }
      }
    }
    return null
  }

  // 检查将帅是否面对面
  const checkGeneralsFacing = (testBoard: (Piece | null)[][]): boolean => {
    const redGeneral = getGeneralPosition('red')
    const blackGeneral = getGeneralPosition('black')

    if (!redGeneral || !blackGeneral) return false
    if (redGeneral.col !== blackGeneral.col) return false

    // 检查两个将帅之间是否有棋子
    for (let row = redGeneral.row - 1; row > blackGeneral.row; row--) {
      if (testBoard[row][redGeneral.col] !== null) return false
    }

    return true
  }

  // 获取指定棋子的所有合法移动
  const getValidMovesForPiece = (piece: Piece, position: Position, checkTest: boolean = true): Position[] => {
    const moves: Position[] = []
    const { row, col } = position
    const { type, color } = piece

    switch (type) {
      case '帅':
      case '将': {
        // 只能在九宫格内移动一步
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
        for (const [dr, dc] of directions) {
          const newRow = row + dr
          const newCol = col + dc
          if (isInPalace(newRow, newCol, color)) {
            const target = board[newRow][newCol]
            if (!target || target.color !== color) {
              moves.push({ row: newRow, col: newCol })
            }
          }
        }
        break
      }

      case '仕':
      case '士': {
        // 只能在九宫格内斜着走一步
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        for (const [dr, dc] of directions) {
          const newRow = row + dr
          const newCol = col + dc
          if (isInPalace(newRow, newCol, color)) {
            const target = board[newRow][newCol]
            if (!target || target.color !== color) {
              moves.push({ row: newRow, col: newCol })
            }
          }
        }
        break
      }

      case '相':
      case '象': {
        // 斜着走两步（田字），不能过河，象眼不能有棋子
        const directions = [[-2, -2], [-2, 2], [2, -2], [2, 2]]
        for (const [dr, dc] of directions) {
          const newRow = row + dr
          const newCol = col + dc
          const eyeRow = row + dr / 2
          const eyeCol = col + dc / 2

          // 检查是否过河
          if ((color === 'red' && newRow < 5) || (color === 'black' && newRow > 4)) continue

          if (isInBoard(newRow, newCol)) {
            // 检查象眼
            if (board[eyeRow][eyeCol] === null) {
              const target = board[newRow][newCol]
              if (!target || target.color !== color) {
                moves.push({ row: newRow, col: newCol })
              }
            }
          }
        }
        break
      }

      case '马': {
        // 日字走法，马脚不能有棋子
        const horseMoves = [
          { dr: -2, dc: -1, legRow: -1, legCol: 0 },
          { dr: -2, dc: 1, legRow: -1, legCol: 0 },
          { dr: 2, dc: -1, legRow: 1, legCol: 0 },
          { dr: 2, dc: 1, legRow: 1, legCol: 0 },
          { dr: -1, dc: -2, legRow: 0, legCol: -1 },
          { dr: -1, dc: 2, legRow: 0, legCol: 1 },
          { dr: 1, dc: -2, legRow: 0, legCol: -1 },
          { dr: 1, dc: 2, legRow: 0, legCol: 1 }
        ]

        for (const move of horseMoves) {
          const newRow = row + move.dr
          const newCol = col + move.dc
          const legRow = row + move.legRow
          const legCol = col + move.legCol

          if (isInBoard(newRow, newCol)) {
            // 检查马脚
            if (board[legRow][legCol] === null) {
              const target = board[newRow][newCol]
              if (!target || target.color !== color) {
                moves.push({ row: newRow, col: newCol })
              }
            }
          }
        }
        break
      }

      case '车': {
        // 横竖走任意步
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
        for (const [dr, dc] of directions) {
          let newRow = row + dr
          let newCol = col + dc

          while (isInBoard(newRow, newCol)) {
            const target = board[newRow][newCol]
            if (target) {
              if (target.color !== color) {
                moves.push({ row: newRow, col: newCol })
              }
              break
            } else {
              moves.push({ row: newRow, col: newCol })
            }
            newRow += dr
            newCol += dc
          }
        }
        break
      }

      case '炮': {
        // 横竖走任意步，吃子需要跳过一个棋子
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
        for (const [dr, dc] of directions) {
          let newRow = row + dr
          let newCol = col + dc
          let hasJumped = false

          while (isInBoard(newRow, newCol)) {
            const target = board[newRow][newCol]

            if (!hasJumped) {
              // 还没跳过棋子
              if (target) {
                hasJumped = true
              } else {
                moves.push({ row: newRow, col: newCol })
              }
            } else {
              // 已经跳过一个棋子
              if (target) {
                if (target.color !== color) {
                  moves.push({ row: newRow, col: newCol })
                }
                break
              }
            }

            newRow += dr
            newCol += dc
          }
        }
        break
      }

      case '兵':
      case '卒': {
        const isRed = color === 'red'
        const forward = isRed ? -1 : 1
        const crossed = hasCrossedRiver(row, color)

        // 向前走一步
        const forwardRow = row + forward
        if (isInBoard(forwardRow, col)) {
          const target = board[forwardRow][col]
          if (!target || target.color !== color) {
            moves.push({ row: forwardRow, col })
          }
        }

        // 过河后可以横着走
        if (crossed) {
          const left = col - 1
          const right = col + 1

          if (isInBoard(row, left)) {
            const target = board[row][left]
            if (!target || target.color !== color) {
              moves.push({ row, col: left })
            }
          }

          if (isInBoard(row, right)) {
            const target = board[row][right]
            if (!target || target.color !== color) {
              moves.push({ row, col: right })
            }
          }
        }
        break
      }
    }

    // 检查移动后是否会导致己方被将军（如果需要）
    if (checkTest) {
      return moves.filter(move => {
        const testBoard = board.map(row => [...row])
        testBoard[move.row][move.col] = testBoard[row][col]
        testBoard[row][col] = null

        // 检查将帅是否会面对面
        if (checkGeneralsFacing(testBoard)) return false

        return !isKingInCheck(color, testBoard)
      })
    }

    return moves
  }

  // 检查指定颜色的帅/将是否被将军
  const isKingInCheck = (color: PieceColor, testBoard?: (Piece | null)[][]): boolean => {
    const checkBoard = testBoard || board
    const kingPos = getGeneralPosition(color)
    if (!kingPos) return false

    // 检查对方所有棋子是否能攻击到己方将帅
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 9; col++) {
        const piece = checkBoard[row][col]
        if (piece && piece.color !== color) {
          const enemyMoves = getValidMovesForPiece(piece, { row, col }, false)
          if (enemyMoves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
            return true
          }
        }
      }
    }

    return false
  }

  // 处理方格点击
  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) return

    const clickedPiece = board[row][col]

    // 如果已经选中了棋子
    if (selectedPosition) {
      // 检查是否点击的是合法移动
      const isValidMove = validMoves.some(move => move.row === row && move.col === col)

      if (isValidMove) {
        makeMove(selectedPosition, { row, col })
      } else if (clickedPiece && clickedPiece.color === currentPlayer) {
        // 选择新的己方棋子
        setSelectedPosition({ row, col })
        setValidMoves(getValidMovesForPiece(clickedPiece, { row, col }))
      } else {
        // 取消选择
        setSelectedPosition(null)
        setValidMoves([])
      }
    } else {
      // 选择己方棋子
      if (clickedPiece && clickedPiece.color === currentPlayer) {
        setSelectedPosition({ row, col })
        setValidMoves(getValidMovesForPiece(clickedPiece, { row, col }))
      }
    }
  }

  // 执行移动
  const makeMove = (from: Position, to: Position) => {
    const piece = board[from.row][from.col]
    if (!piece) return

    const capturedPiece = board[to.row][to.col]
    const newBoard = board.map(row => [...row])
    newBoard[to.row][to.col] = piece
    newBoard[from.row][from.col] = null

    // 记录移动
    const move: Move = {
      from,
      to,
      piece,
      captured: capturedPiece || undefined,
      moveNumber: moveHistory.length + 1
    }

    // 更新被吃棋子
    if (capturedPiece) {
      const newCaptured = { ...capturedPieces }
      newCaptured[capturedPiece.color].push(capturedPiece)
      setCapturedPieces(newCaptured)

      // 检查是否吃掉了将/帅
      if (capturedPiece.type === '帅' || capturedPiece.type === '将') {
        setGameOver({
          winner: currentPlayer,
          message: `${currentPlayer === 'red' ? '红方' : '黑方'}胜利！`
        })
      }
    }

    setBoard(newBoard)
    setMoveHistory([...moveHistory, move])
    setSelectedPosition(null)
    setValidMoves([])

    // 切换玩家
    const nextPlayer = currentPlayer === 'red' ? 'black' : 'red'
    setCurrentPlayer(nextPlayer)

    // 检查下一个玩家是否被将军
    setTimeout(() => {
      const inCheck = isKingInCheck(nextPlayer, newBoard)
      setIsCheck(inCheck)
    }, 100)
  }

  // 重新开始游戏
  const restartGame = useCallback(() => {
    setBoard(INITIAL_BOARD)
    setSelectedPosition(null)
    setCurrentPlayer('red')
    setValidMoves([])
    setMoveHistory([])
    setCapturedPieces({ red: [], black: [] })
    setIsCheck(false)
    setGameOver(null)
  }, [])

  // 获取移动记录的中文表示
  const getMoveNotation = (move: Move): string => {
    const { piece, from, to } = move
    const colNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
    const rowNames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

    return `${piece.type} ${colNames[from.col]}${rowNames[from.row]} → ${colNames[to.col]}${rowNames[to.row]}`
  }

  return (
    <Layout>
      <Header
        title="中国象棋"
        gradient="linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)"
        showBack={true}
        showLogout={false}
      />
      <div className="chinese-chess-container">
        <div className="chess-layout">
          {/* 棋盘区域 */}
          <div className="chess-board-section">
            {/* 黑方玩家信息 */}
            <div className="player-info black-player">
              <div className="player-label">
                <span className="player-icon">⚫</span>
                <span>黑方</span>
              </div>
              {currentPlayer === 'black' && <div className="current-turn">当前回合</div>}
              <div className="captured-pieces">
                {capturedPieces.black.map((piece, index) => (
                  <span key={index} className="captured-piece">{piece.type}</span>
                ))}
              </div>
            </div>

            {/* 棋盘 */}
            <div className="chessboard-wrapper">
              <div className="chinese-chessboard">
                {board.map((row, rowIndex) => (
                  row.map((piece, colIndex) => {
                    const isSelected = selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex
                    const isValidMove = validMoves.some(move => move.row === rowIndex && move.col === colIndex)
                    const isRiverRow = rowIndex === 4 || rowIndex === 5

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`chess-point ${isSelected ? 'selected' : ''} ${isValidMove ? 'valid-move' : ''}`}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                      >
                        {/* 棋盘线条 */}
                        <div className="point-lines">
                          {/* 横线 */}
                          {colIndex < 8 && <div className="line-h" />}
                          {/* 竖线（楚河汉界处理） */}
                          {rowIndex < 9 && !isRiverRow && <div className="line-v" />}
                          {/* 九宫格斜线 */}
                          {((rowIndex === 0 && colIndex === 3) || (rowIndex === 7 && colIndex === 3)) && (
                            <div className="line-diagonal-1" />
                          )}
                          {((rowIndex === 0 && colIndex === 5) || (rowIndex === 7 && colIndex === 5)) && (
                            <div className="line-diagonal-2" />
                          )}
                        </div>

                        {/* 楚河汉界 */}
                        {rowIndex === 4 && colIndex === 1 && (
                          <div className="river-text left">楚河</div>
                        )}
                        {rowIndex === 4 && colIndex === 6 && (
                          <div className="river-text right">汉界</div>
                        )}

                        {/* 棋子 */}
                        {piece && (
                          <div className={`chess-piece ${piece.color}`}>
                            <div className="piece-bg"></div>
                            <div className="piece-text">{piece.type}</div>
                          </div>
                        )}

                        {/* 移动指示器 */}
                        {isValidMove && !piece && <div className="move-indicator" />}
                        {isValidMove && piece && <div className="capture-indicator" />}
                      </div>
                    )
                  })
                ))}
              </div>
            </div>

            {/* 红方玩家信息 */}
            <div className="player-info red-player">
              <div className="player-label">
                <span className="player-icon">🔴</span>
                <span>红方</span>
              </div>
              {currentPlayer === 'red' && <div className="current-turn">当前回合</div>}
              <div className="captured-pieces">
                {capturedPieces.red.map((piece, index) => (
                  <span key={index} className="captured-piece">{piece.type}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 信息区域 */}
          <div className="chess-info-section">
            {/* 游戏状态 */}
            <div className="game-status">
              <h3>游戏状态</h3>
              <div className="status-item">
                <span className="status-label">当前回合</span>
                <span className={`status-value ${currentPlayer}`}>
                  {currentPlayer === 'red' ? '红方' : '黑方'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">回合数</span>
                <span className="status-value">{Math.floor(moveHistory.length / 2) + 1}</span>
              </div>
              {isCheck && (
                <div className="check-alert">
                  ⚠️ {currentPlayer === 'red' ? '红方' : '黑方'}被将军！
                </div>
              )}
            </div>

            {/* 移动历史 */}
            <div className="move-history">
              <h3>移动记录</h3>
              <div className="history-list">
                {moveHistory.length === 0 ? (
                  <div className="empty-history">暂无移动记录</div>
                ) : (
                  moveHistory.map((move, index) => (
                    <div key={index} className="history-item">
                      <span className="move-number">{move.moveNumber}.</span>
                      <span className="move-notation">{getMoveNotation(move)}</span>
                      {move.captured && <span className="captured-mark">✗{move.captured.type}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 游戏控制 */}
            <div className="game-controls">
              <button className="control-btn restart" onClick={restartGame}>
                🔄 重新开始
              </button>
            </div>

            {/* 游戏规则 */}
            <div className="game-rules">
              <h3>游戏规则</h3>
              <ul>
                <li>帅/将：只能在九宫内走一步</li>
                <li>仕/士：只能在九宫内斜走一步</li>
                <li>相/象：田字走法，不能过河</li>
                <li>马：日字走法，不能蹩马脚</li>
                <li>车：横竖走任意步</li>
                <li>炮：隔子吃子</li>
                <li>兵/卒：过河前只能前进，过河后可横走</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 游戏结束弹窗 */}
        {gameOver && (
          <div className="game-modal">
            <div className="modal-content checkmate">
              <div className="modal-emoji">🏆</div>
              <h2>游戏结束</h2>
              <div className="winner-announce">{gameOver.message}</div>
              <div className="modal-stats">
                <p>总回合数 <strong>{Math.floor(moveHistory.length / 2) + 1}</strong></p>
                <p>总移动数 <strong>{moveHistory.length}</strong></p>
                <p>红方吃子 <strong>{capturedPieces.black.length}</strong></p>
                <p>黑方吃子 <strong>{capturedPieces.red.length}</strong></p>
              </div>
              <button className="modal-btn" onClick={restartGame}>
                再来一局
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
