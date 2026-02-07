import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveGameRecord } from '../services/api/gameRecords';
import './TetrisGame.css';

// 方块形状定义
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
};

type ShapeType = keyof typeof SHAPES;

interface Position {
  x: number;
  y: number;
}

interface Piece {
  shape: number[][];
  type: ShapeType;
  position: Position;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 1000;

const TetrisGame: React.FC = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [gameStarted, setGameStarted] = useState(false);
  const [board, setBoard] = useState<(ShapeType | null)[][]>([]);
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<ShapeType | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const speedMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2
  };

  useEffect(() => {
    const saved = localStorage.getItem('tetrisBestScore');
    if (saved) {
      setBestScore(parseInt(saved));
    }
  }, []);

  const createEmptyBoard = (): (ShapeType | null)[][] => {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
  };

  const getRandomShape = (): ShapeType => {
    const shapes = Object.keys(SHAPES) as ShapeType[];
    return shapes[Math.floor(Math.random() * shapes.length)];
  };

  const createPiece = (type: ShapeType): Piece => {
    return {
      shape: SHAPES[type],
      type,
      position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }
    };
  };

  const initializeGame = () => {
    const newBoard = createEmptyBoard();
    const firstPiece = getRandomShape();
    const secondPiece = getRandomShape();

    setBoard(newBoard);
    setCurrentPiece(createPiece(firstPiece));
    setNextPiece(secondPiece);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
    startTimeRef.current = Date.now();
  };

  const checkCollision = useCallback((piece: Piece, board: (ShapeType | null)[][], offsetX = 0, offsetY = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.position.x + x + offsetX;
          const newY = piece.position.y + y + offsetY;

          if (
            newX < 0 ||
            newX >= BOARD_WIDTH ||
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const mergePiece = useCallback((piece: Piece, board: (ShapeType | null)[][]): (ShapeType | null)[][] => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.position.y + y;
          const boardX = piece.position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.type;
          }
        }
      }
    }
    return newBoard;
  }, []);

  const clearLines = useCallback((board: (ShapeType | null)[][]): { newBoard: (ShapeType | null)[][], linesCleared: number } => {
    let linesCleared = 0;
    const newBoard = board.filter(row => {
      if (row.every(cell => cell !== null)) {
        linesCleared++;
        return false;
      }
      return true;
    });

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }

    return { newBoard, linesCleared };
  }, []);

  const rotatePiece = useCallback((piece: Piece): number[][] => {
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map(row => row[i]).reverse()
    );
    return rotated;
  }, []);

  const movePiece = useCallback((direction: 'left' | 'right' | 'down' | 'rotate') => {
    if (!currentPiece || gameOver || isPaused) return;

    let newPiece = { ...currentPiece };

    if (direction === 'left') {
      newPiece.position = { ...newPiece.position, x: newPiece.position.x - 1 };
    } else if (direction === 'right') {
      newPiece.position = { ...newPiece.position, x: newPiece.position.x + 1 };
    } else if (direction === 'down') {
      newPiece.position = { ...newPiece.position, y: newPiece.position.y + 1 };
    } else if (direction === 'rotate') {
      newPiece.shape = rotatePiece(currentPiece);
    }

    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece);
    } else if (direction === 'down') {
      // 方块到底了,合并到棋盘
      const mergedBoard = mergePiece(currentPiece, board);
      const { newBoard, linesCleared } = clearLines(mergedBoard);

      setBoard(newBoard);
      setLines(prev => prev + linesCleared);

      // 计算分数
      const lineScore = [0, 100, 300, 500, 800][linesCleared];
      setScore(prev => prev + lineScore * level);

      // 更新等级
      const newLines = lines + linesCleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      setLevel(newLevel);

      // 生成新方块
      if (nextPiece) {
        const newPiece = createPiece(nextPiece);
        if (checkCollision(newPiece, newBoard)) {
          endGame(newBoard);
        } else {
          setCurrentPiece(newPiece);
          setNextPiece(getRandomShape());
        }
      }
    }
  }, [currentPiece, board, gameOver, isPaused, checkCollision, mergePiece, clearLines, rotatePiece, lines, level, nextPiece]);

  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    let newPiece = { ...currentPiece };
    while (!checkCollision(newPiece, board, 0, 1)) {
      newPiece.position.y++;
    }

    const mergedBoard = mergePiece(newPiece, board);
    const { newBoard, linesCleared } = clearLines(mergedBoard);

    setBoard(newBoard);
    setLines(prev => prev + linesCleared);

    const lineScore = [0, 100, 300, 500, 800][linesCleared];
    setScore(prev => prev + lineScore * level + 20); // 额外奖励快速下落

    const newLines = lines + linesCleared;
    const newLevel = Math.floor(newLines / 10) + 1;
    setLevel(newLevel);

    if (nextPiece) {
      const newPiece = createPiece(nextPiece);
      if (checkCollision(newPiece, newBoard)) {
        endGame(newBoard);
      } else {
        setCurrentPiece(newPiece);
        setNextPiece(getRandomShape());
      }
    }
  }, [currentPiece, board, gameOver, isPaused, checkCollision, mergePiece, clearLines, lines, level, nextPiece]);

  const endGame = async (finalBoard: (ShapeType | null)[][]) => {
    setGameOver(true);
    setBoard(finalBoard);

    if (!bestScore || score > bestScore) {
      setBestScore(score);
      localStorage.setItem('tetrisBestScore', score.toString());
    }

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      await saveGameRecord({
        game_type: 'tetris',
        difficulty,
        score,
        time_spent: timeSpent,
        best_streak: lines,
        accuracy: lines > 0 ? (score / lines) : 0,
        metadata: {
          level,
          lines
        }
      });
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }
  };

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const speed = Math.max(100, INITIAL_SPEED - (level - 1) * 50) / speedMultiplier[difficulty];
      gameLoopRef.current = setInterval(() => {
        movePiece('down');
      }, speed);

      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, isPaused, level, difficulty, movePiece]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      if (e.key === 'p' || e.key === 'P') {
        setIsPaused(prev => !prev);
        return;
      }

      if (isPaused) return;

      switch (e.key) {
        case 'ArrowLeft':
          movePiece('left');
          break;
        case 'ArrowRight':
          movePiece('right');
          break;
        case 'ArrowDown':
          movePiece('down');
          break;
        case 'ArrowUp':
          movePiece('rotate');
          break;
        case ' ':
          dropPiece();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver, isPaused, movePiece, dropPiece]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.type;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  const resetGame = () => {
    setGameStarted(false);
    setBoard([]);
    setCurrentPiece(null);
    setNextPiece(null);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
  };

  if (!gameStarted) {
    return (
      <div className="tetris-game">
        <div className="game-header">
          <button className="back-button" onClick={() => navigate('/games')}>
            ← 返回
          </button>
          <h1>俄罗斯方块</h1>
        </div>

        <div className="game-setup">
          <div className="setup-card">
            <h2>🎮 游戏规则</h2>
            <ul>
              <li>使用方向键控制方块移动和旋转</li>
              <li>← → 左右移动, ↑ 旋转, ↓ 加速下落</li>
              <li>空格键快速下落</li>
              <li>消除一行得分,同时消除多行得分更高</li>
              <li>每消除10行升一级,速度加快</li>
              <li>按P键暂停/继续游戏</li>
            </ul>
          </div>

          <div className="setup-card">
            <h2>🎯 选择难度</h2>
            <div className="difficulty-buttons">
              <button
                className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
                onClick={() => setDifficulty('easy')}
              >
                简单 (慢速)
              </button>
              <button
                className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
                onClick={() => setDifficulty('medium')}
              >
                中等 (中速)
              </button>
              <button
                className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
                onClick={() => setDifficulty('hard')}
              >
                困难 (快速)
              </button>
            </div>
          </div>

          {bestScore !== null && (
            <div className="best-score-display">
              <h3>🏆 最佳分数: {bestScore}</h3>
            </div>
          )}

          <button className="start-button" onClick={initializeGame}>
            开始游戏
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tetris-game">
      <div className="game-header">
        <button className="back-button" onClick={resetGame}>
          ← 返回设置
        </button>
        <h1>俄罗斯方块</h1>
      </div>

      <div className="game-container">
        <div className="game-info">
          <div className="info-card">
            <h3>分数</h3>
            <p className="score-value">{score}</p>
          </div>
          <div className="info-card">
            <h3>等级</h3>
            <p className="level-value">{level}</p>
          </div>
          <div className="info-card">
            <h3>消除行数</h3>
            <p className="lines-value">{lines}</p>
          </div>
          <div className="info-card next-piece-card">
            <h3>下一个</h3>
            <div className="next-piece-preview">
              {nextPiece && SHAPES[nextPiece].map((row, y) => (
                <div key={y} className="preview-row">
                  {row.map((cell, x) => (
                    <div
                      key={x}
                      className={`preview-cell ${cell ? 'filled' : ''}`}
                      style={{ backgroundColor: cell ? COLORS[nextPiece] : 'transparent' }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="board-container">
          {isPaused && (
            <div className="pause-overlay">
              <h2>游戏暂停</h2>
              <p>按 P 键继续</p>
            </div>
          )}
          <div className="tetris-board">
            {renderBoard().map((row, y) => (
              <div key={y} className="board-row">
                {row.map((cell, x) => (
                  <div
                    key={x}
                    className={`board-cell ${cell ? 'filled' : ''}`}
                    style={{ backgroundColor: cell ? COLORS[cell] : '#1a1a2e' }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="game-controls">
          <h3>控制说明</h3>
          <div className="control-item">
            <span>← →</span>
            <span>左右移动</span>
          </div>
          <div className="control-item">
            <span>↑</span>
            <span>旋转</span>
          </div>
          <div className="control-item">
            <span>↓</span>
            <span>加速下落</span>
          </div>
          <div className="control-item">
            <span>空格</span>
            <span>快速下落</span>
          </div>
          <div className="control-item">
            <span>P</span>
            <span>暂停/继续</span>
          </div>
        </div>
      </div>

      {gameOver && (
        <div className="game-over-modal">
          <div className="modal-content">
            <h2>🎮 游戏结束!</h2>
            <div className="final-stats">
              <p>最终分数: <strong>{score}</strong></p>
              <p>等级: {level}</p>
              <p>消除行数: {lines}</p>
              {bestScore && score > bestScore && (
                <p className="new-record">🏆 新纪录!</p>
              )}
            </div>
            <div className="modal-buttons">
              <button onClick={initializeGame}>再玩一次</button>
              <button onClick={resetGame}>返回设置</button>
              <button onClick={() => navigate('/games')}>返回游戏列表</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TetrisGame;
