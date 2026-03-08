import { useState, useCallback, useRef, useEffect } from 'react';
import { Layout, Header } from '../components/layout';
import { UsageTracker } from '../services/usageTracking';
import './ChessGame.css';

// 棋子类型
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type PieceColor = 'white' | 'black';

interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

interface Position {
  row: number;
  col: number;
}

// 棋子Unicode符号
const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

// 初始棋盘布局
const INITIAL_BOARD: (Piece | null)[][] = [
  [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' },
  ],
  Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' })),
  [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' },
  ],
];

export default function ChessGame() {
  const [board, setBoard] = useState<(Piece | null)[][]>(JSON.parse(JSON.stringify(INITIAL_BOARD)));
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[]; black: Piece[] }>({
    white: [],
    black: [],
  });
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const usageTrackerRef = useRef<UsageTracker | null>(null);

  // 检查位置是否在棋盘内
  const isValidPosition = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  };

  // 获取棋子可能的移动位置
  const getPossibleMoves = useCallback((piece: Piece, from: Position, board: (Piece | null)[][]): Position[] => {
    const moves: Position[] = [];
    const { row, col } = from;

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        // 向前移动一格
        if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
          moves.push({ row: row + direction, col });
        }

        // 首次移动可以移动两格
        if (row === startRow && !board[row + direction][col] && !board[row + 2 * direction][col]) {
          moves.push({ row: row + 2 * direction, col });
        }

        // 斜向吃子
        [-1, 1].forEach(dc => {
          const newRow = row + direction;
          const newCol = col + dc;
          if (isValidPosition(newRow, newCol)) {
            const target = board[newRow][newCol];
            if (target && target.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        });
        break;

      case 'knight':
        const knightMoves = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1],
        ];
        knightMoves.forEach(([dr, dc]) => {
          const newRow = row + dr;
          const newCol = col + dc;
          if (isValidPosition(newRow, newCol)) {
            const target = board[newRow][newCol];
            if (!target || target.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        });
        break;

      case 'bishop':
        const bishopDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        bishopDirections.forEach(([dr, dc]) => {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (!isValidPosition(newRow, newCol)) break;
            const target = board[newRow][newCol];
            if (!target) {
              moves.push({ row: newRow, col: newCol });
            } else {
              if (target.color !== piece.color) {
                moves.push({ row: newRow, col: newCol });
              }
              break;
            }
          }
        });
        break;

      case 'rook':
        const rookDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        rookDirections.forEach(([dr, dc]) => {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (!isValidPosition(newRow, newCol)) break;
            const target = board[newRow][newCol];
            if (!target) {
              moves.push({ row: newRow, col: newCol });
            } else {
              if (target.color !== piece.color) {
                moves.push({ row: newRow, col: newCol });
              }
              break;
            }
          }
        });
        break;

      case 'queen':
        const queenDirections = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1], [0, 1],
          [1, -1], [1, 0], [1, 1],
        ];
        queenDirections.forEach(([dr, dc]) => {
          for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (!isValidPosition(newRow, newCol)) break;
            const target = board[newRow][newCol];
            if (!target) {
              moves.push({ row: newRow, col: newCol });
            } else {
              if (target.color !== piece.color) {
                moves.push({ row: newRow, col: newCol });
              }
              break;
            }
          }
        });
        break;

      case 'king':
        const kingMoves = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1], [0, 1],
          [1, -1], [1, 0], [1, 1],
        ];
        kingMoves.forEach(([dr, dc]) => {
          const newRow = row + dr;
          const newCol = col + dc;
          if (isValidPosition(newRow, newCol)) {
            const target = board[newRow][newCol];
            if (!target || target.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        });
        break;
    }

    return moves;
  }, []);

  // 检查国王是否被将军
  const isKingInCheck = (board: (Piece | null)[][], color: 'white' | 'black'): boolean => {
    let kingPos: { row: number; col: number } | null = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.type === 'king' && board[r][c]?.color === color) {
          kingPos = { row: r, col: c };
          break;
        }
      }
      if (kingPos) break;
    }
    if (!kingPos) return false;

    const opponentColor = color === 'white' ? 'black' : 'white';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === opponentColor) {
          const moves = getPossibleMoves(piece, { row: r, col: c }, board);
          if (moves.some(m => m.row === kingPos!.row && m.col === kingPos!.col)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // 检查是否将死
  const checkIsCheckmate = (board: (Piece | null)[][], color: 'white' | 'black'): boolean => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === color) {
          const moves = getPossibleMoves(piece, { row: r, col: c }, board);
          for (const move of moves) {
            const testBoard = board.map(row => [...row]);
            testBoard[move.row][move.col] = testBoard[r][c];
            testBoard[r][c] = null;
            if (!isKingInCheck(testBoard, color)) {
              return false;
            }
          }
        }
      }
    }
    return true;
  };

  // 处理方块点击
  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) return;

    const piece = board[row][col];

    // 如果已选择棋子，尝试移动
    if (selectedSquare) {
      const isValidMove = validMoves.some(move => move.row === row && move.col === col);

      if (isValidMove) {
        // 执行移动
        const newBoard = board.map(r => [...r]);
        const movingPiece = newBoard[selectedSquare.row][selectedSquare.col];
        const capturedPiece = newBoard[row][col];

        // 记录被吃掉的棋子
        if (capturedPiece) {
          setCapturedPieces(prev => ({
            ...prev,
            [capturedPiece.color]: [...prev[capturedPiece.color], capturedPiece],
          }));
        }

        // 移动棋子
        newBoard[row][col] = movingPiece;
        newBoard[selectedSquare.row][selectedSquare.col] = null;

        if (movingPiece) {
          movingPiece.hasMoved = true;
        }

        // 兵升变（到达底线变成皇后）
        if (movingPiece?.type === 'pawn') {
          if ((movingPiece.color === 'white' && row === 0) || (movingPiece.color === 'black' && row === 7)) {
            newBoard[row][col] = { type: 'queen', color: movingPiece.color, hasMoved: true };
          }
        }

        // 记录移动历史
        const from = String.fromCharCode(97 + selectedSquare.col) + (8 - selectedSquare.row);
        const to = String.fromCharCode(97 + col) + (8 - row);
        const notation = `${PIECE_SYMBOLS[currentPlayer][movingPiece?.type || 'pawn']} ${from}-${to}`;
        setMoveHistory(prev => [...prev, notation]);

        setBoard(newBoard);
        setSelectedSquare(null);
        setValidMoves([]);

        // 检查将军和将死
        const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
        const isCheck = isKingInCheck(newBoard, nextPlayer);
        if (isCheck) {
          const isCheckmateResult = checkIsCheckmate(newBoard, nextPlayer);
          if (isCheckmateResult) {
            setGameOver(true);
            toast.success(`${currentPlayer === 'white' ? '白方' : '黑方'}获胜！将死！`);
          } else {
            toast.info(`${nextPlayer === 'white' ? '白方' : '黑方'}被将军！`);
          }
        }

        setCurrentPlayer(nextPlayer);
      } else if (piece && piece.color === currentPlayer) {
        // 选择新的棋子
        setSelectedSquare({ row, col });
        setValidMoves(getPossibleMoves(piece, { row, col }, board));
      } else {
        // 取消选择
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else if (piece && piece.color === currentPlayer) {
      // 选择棋子
      setSelectedSquare({ row, col });
      setValidMoves(getPossibleMoves(piece, { row, col }, board));
    }
  };

  // 重新开始游戏
  const resetGame = () => {
    setBoard(JSON.parse(JSON.stringify(INITIAL_BOARD)));
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentPlayer('white');
    setCapturedPieces({ white: [], black: [] });
    setMoveHistory([]);
    setIsCheck(false);
    setIsCheckmate(false);
    setGameOver(false);
    // 重新开始追踪
    if (usageTrackerRef.current) {
      usageTrackerRef.current.cancel();
    }
    usageTrackerRef.current = new UsageTracker('游戏', '国际象棋');
    usageTrackerRef.current.start();
  };

  // 初始化游戏追踪
  useEffect(() => {
    usageTrackerRef.current = new UsageTracker('游戏', '国际象棋');
    usageTrackerRef.current.start();

    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.cancel();
      }
    };
  }, []);

  // 检查游戏结束并记录数据
  useEffect(() => {
    if (isCheckmate && usageTrackerRef.current) {
      const totalMoves = moveHistory.length;
      const winner = currentPlayer === 'white' ? '黑方' : '白方';
      usageTrackerRef.current.end(totalMoves, {
        winner,
        totalMoves,
        rounds: Math.ceil(totalMoves / 2),
        capturedWhite: capturedPieces.white.length,
        capturedBlack: capturedPieces.black.length
      });
      usageTrackerRef.current = null;
    }
  }, [isCheckmate, moveHistory, currentPlayer, capturedPieces]);

  return (
    <Layout>
      <Header title="♔ 国际象棋" gradient="linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)" />

      <div className="main-content chess-game-container">
        <div className="chess-layout">
          {/* 左侧：棋盘 */}
          <div className="chess-board-section">
            <div className="player-info black-player">
              <div className="player-label">
                <span className="player-icon">♚</span>
                <span>黑方</span>
                {currentPlayer === 'black' && <span className="current-turn">当前回合</span>}
              </div>
              <div className="captured-pieces">
                {capturedPieces.black.map((piece, idx) => (
                  <span key={idx} className="captured-piece">
                    {PIECE_SYMBOLS[piece.color][piece.type]}
                  </span>
                ))}
              </div>
            </div>

            <div className="chessboard-wrapper">
              <div className="chessboard">
                {board.map((row, rowIndex) => (
                  row.map((piece, colIndex) => {
                    const isLight = (rowIndex + colIndex) % 2 === 0;
                    const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
                    const isValidMove = validMoves.some(move => move.row === rowIndex && move.col === colIndex);

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`chess-square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isValidMove ? 'valid-move' : ''}`}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                      >
                        {/* 坐标标签 */}
                        {colIndex === 0 && (
                          <div className="row-label">{8 - rowIndex}</div>
                        )}
                        {rowIndex === 7 && (
                          <div className="col-label">{String.fromCharCode(97 + colIndex)}</div>
                        )}

                        {/* 棋子 */}
                        {piece && (
                          <div className={`chess-piece ${piece.color}`}>
                            {PIECE_SYMBOLS[piece.color][piece.type]}
                          </div>
                        )}

                        {/* 可移动提示 */}
                        {isValidMove && !piece && <div className="move-indicator" />}
                        {isValidMove && piece && <div className="capture-indicator" />}
                      </div>
                    );
                  })
                ))}
              </div>
            </div>

            <div className="player-info white-player">
              <div className="player-label">
                <span className="player-icon">♔</span>
                <span>白方</span>
                {currentPlayer === 'white' && <span className="current-turn">当前回合</span>}
              </div>
              <div className="captured-pieces">
                {capturedPieces.white.map((piece, idx) => (
                  <span key={idx} className="captured-piece">
                    {PIECE_SYMBOLS[piece.color][piece.type]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：游戏信息 */}
          <div className="chess-info-section">
            <div className="game-status">
              <h3>游戏状态</h3>
              <div className="status-item">
                <span className="status-label">当前回合:</span>
                <span className={`status-value ${currentPlayer}`}>
                  {currentPlayer === 'white' ? '白方 ♔' : '黑方 ♚'}
                </span>
              </div>
              {isCheck && (
                <div className="check-alert">⚠️ 将军!</div>
              )}
            </div>

            <div className="move-history">
              <h3>移动历史</h3>
              <div className="history-list">
                {moveHistory.length === 0 ? (
                  <div className="empty-history">暂无移动记录</div>
                ) : (
                  moveHistory.map((move, idx) => (
                    <div key={idx} className="history-item">
                      <span className="move-number">{idx + 1}.</span>
                      <span className="move-notation">{move}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="game-controls">
              <button className="control-btn restart" onClick={resetGame}>
                🔄 重新开始
              </button>
              <button className="control-btn hint" disabled>
                💡 提示 (开发中)
              </button>
            </div>

            <div className="game-rules">
              <h3>游戏说明</h3>
              <ul>
                <li>♙ 兵：向前走一格，首次可走两格</li>
                <li>♘ 马：走"日"字</li>
                <li>♗ 象：斜向移动任意格</li>
                <li>♖ 车：横竖移动任意格</li>
                <li>♕ 后：任意方向移动任意格</li>
                <li>♔ 王：任意方向移动一格</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 游戏结束弹窗 */}
        {isCheckmate && (
          <div className="game-modal">
            <div className="modal-content checkmate">
              <div className="modal-emoji">🏆</div>
              <h2>将死!</h2>
              <div className="winner-announce">
                {currentPlayer === 'white' ? '黑方' : '白方'} 获胜!
              </div>
              <div className="modal-stats">
                <p>总回合数: <strong>{Math.ceil(moveHistory.length / 2)}</strong></p>
                <p>移动次数: <strong>{moveHistory.length}</strong></p>
              </div>
              <button className="modal-btn" onClick={resetGame}>
                再来一局
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
