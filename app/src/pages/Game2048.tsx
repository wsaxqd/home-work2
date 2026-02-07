import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveGameRecord } from '../services/api/gameRecords';
import './Game2048.css';

type Board = (number | null)[][];

const Game2048: React.FC = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [gameStarted, setGameStarted] = useState(false);
  const [board, setBoard] = useState<Board>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const startTimeRef = React.useRef<number>(0);

  const gridSize = {
    easy: 4,
    medium: 5,
    hard: 6
  };

  const winTarget = {
    easy: 2048,
    medium: 4096,
    hard: 8192
  };

  useEffect(() => {
    const saved = localStorage.getItem('game2048BestScore');
    if (saved) {
      setBestScore(parseInt(saved));
    }
  }, []);

  const createEmptyBoard = (size: number): Board => {
    return Array(size).fill(null).map(() => Array(size).fill(null));
  };

  const addRandomTile = (board: Board): Board => {
    const emptyTiles: [number, number][] = [];
    board.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell === null) {
          emptyTiles.push([i, j]);
        }
      });
    });

    if (emptyTiles.length === 0) return board;

    const [row, col] = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const initializeGame = () => {
    const size = gridSize[difficulty];
    let newBoard = createEmptyBoard(size);
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);

    setBoard(newBoard);
    setScore(0);
    setMoves(0);
    setGameOver(false);
    setGameWon(false);
    setGameStarted(true);
    startTimeRef.current = Date.now();
  };

  const moveLeft = (board: Board): { board: Board; scoreGained: number; moved: boolean } => {
    let scoreGained = 0;
    let moved = false;
    const newBoard = board.map(row => {
      // 移除空格
      const filtered = row.filter(cell => cell !== null);

      // 合并相同的数字
      const merged: (number | null)[] = [];
      let i = 0;
      while (i < filtered.length) {
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
          const value = filtered[i]! * 2;
          merged.push(value);
          scoreGained += value;
          i += 2;
        } else {
          merged.push(filtered[i]);
          i++;
        }
      }

      // 填充空格
      while (merged.length < board.length) {
        merged.push(null);
      }

      // 检查是否有移动
      if (JSON.stringify(row) !== JSON.stringify(merged)) {
        moved = true;
      }

      return merged;
    });

    return { board: newBoard, scoreGained, moved };
  };

  const rotateBoard = (board: Board): Board => {
    const size = board.length;
    return board[0].map((_, i) => board.map(row => row[i]).reverse());
  };

  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver || gameWon) return;

    let currentBoard = board.map(row => [...row]);
    let rotations = 0;

    // 旋转棋盘使所有方向都变成向左移动
    if (direction === 'right') rotations = 2;
    else if (direction === 'up') rotations = 1;
    else if (direction === 'down') rotations = 3;

    for (let i = 0; i < rotations; i++) {
      currentBoard = rotateBoard(currentBoard);
    }

    const { board: movedBoard, scoreGained, moved } = moveLeft(currentBoard);

    if (!moved) return;

    // 旋转回来
    let finalBoard = movedBoard;
    for (let i = 0; i < (4 - rotations) % 4; i++) {
      finalBoard = rotateBoard(finalBoard);
    }

    // 添加新方块
    finalBoard = addRandomTile(finalBoard);

    setBoard(finalBoard);
    setScore(prev => prev + scoreGained);
    setMoves(prev => prev + 1);

    // 检查是否达到目标
    const hasWinTile = finalBoard.some(row => row.some(cell => cell === winTarget[difficulty]));
    if (hasWinTile && !gameWon) {
      setGameWon(true);
      endGame(finalBoard, score + scoreGained, true);
    }

    // 检查是否游戏结束
    if (!canMove(finalBoard)) {
      setGameOver(true);
      endGame(finalBoard, score + scoreGained, false);
    }
  }, [board, gameOver, gameWon, score, difficulty]);

  const canMove = (board: Board): boolean => {
    // 检查是否有空格
    if (board.some(row => row.some(cell => cell === null))) {
      return true;
    }

    // 检查是否有相邻的相同数字
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const current = board[i][j];
        if (j < board[i].length - 1 && current === board[i][j + 1]) return true;
        if (i < board.length - 1 && current === board[i + 1][j]) return true;
      }
    }

    return false;
  };

  const endGame = async (finalBoard: Board, finalScore: number, won: boolean) => {
    if (!bestScore || finalScore > bestScore) {
      setBestScore(finalScore);
      localStorage.setItem('game2048BestScore', finalScore.toString());
    }

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const maxTile = Math.max(...finalBoard.flat().filter(n => n !== null) as number[]);

    try {
      await saveGameRecord({
        game_type: '2048',
        difficulty,
        score: finalScore,
        time_spent: timeSpent,
        best_streak: maxTile,
        accuracy: won ? 100 : (maxTile / winTarget[difficulty]) * 100,
        metadata: {
          moves,
          maxTile,
          won
        }
      });
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          move('right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          move('down');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver, move]);

  const resetGame = () => {
    setGameStarted(false);
    setBoard([]);
    setScore(0);
    setMoves(0);
    setGameOver(false);
    setGameWon(false);
  };

  const getTileColor = (value: number | null): string => {
    if (!value) return '#cdc1b4';
    const colors: { [key: number]: string } = {
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e',
      4096: '#3c3a32',
      8192: '#3c3a32'
    };
    return colors[value] || '#3c3a32';
  };

  const getTileTextColor = (value: number | null): string => {
    if (!value || value <= 4) return '#776e65';
    return '#f9f6f2';
  };

  if (!gameStarted) {
    return (
      <div className="game-2048">
        <div className="game-header">
          <button className="back-button" onClick={() => navigate('/games')}>
            ← 返回
          </button>
          <h1>2048游戏</h1>
        </div>

        <div className="game-setup">
          <div className="setup-card">
            <h2>🎮 游戏规则</h2>
            <ul>
              <li>使用方向键移动方块</li>
              <li>相同数字的方块会合并成一个</li>
              <li>合并后的数字是原来的两倍</li>
              <li>达到目标数字即可获胜</li>
              <li>无法移动时游戏结束</li>
            </ul>
          </div>

          <div className="setup-card">
            <h2>🎯 选择难度</h2>
            <div className="difficulty-buttons">
              <button
                className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
                onClick={() => setDifficulty('easy')}
              >
                简单 (4×4, 目标2048)
              </button>
              <button
                className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
                onClick={() => setDifficulty('medium')}
              >
                中等 (5×5, 目标4096)
              </button>
              <button
                className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
                onClick={() => setDifficulty('hard')}
              >
                困难 (6×6, 目标8192)
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
    <div className="game-2048">
      <div className="game-header">
        <button className="back-button" onClick={resetGame}>
          ← 返回设置
        </button>
        <h1>2048游戏</h1>
      </div>

      <div className="game-container">
        <div className="game-info">
          <div className="info-card">
            <h3>分数</h3>
            <p className="score-value">{score}</p>
          </div>
          <div className="info-card">
            <h3>移动次数</h3>
            <p className="moves-value">{moves}</p>
          </div>
          <div className="info-card">
            <h3>目标</h3>
            <p className="target-value">{winTarget[difficulty]}</p>
          </div>
        </div>

        <div className={`board-2048 grid-${difficulty}`}>
          {board.map((row, i) => (
            <React.Fragment key={i}>
              {row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`tile-2048 ${cell ? 'filled' : ''}`}
                  style={{
                    backgroundColor: getTileColor(cell),
                    color: getTileTextColor(cell)
                  }}
                >
                  {cell || ''}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div className="game-controls">
          <h3>控制说明</h3>
          <div className="control-item">
            <span>↑ ↓ ← →</span>
            <span>移动方块</span>
          </div>
          <p className="control-hint">使用方向键控制方块移动</p>
        </div>
      </div>

      {(gameOver || gameWon) && (
        <div className="game-over-modal">
          <div className="modal-content">
            <h2>{gameWon ? '🎉 恭喜获胜!' : '🎮 游戏结束!'}</h2>
            <div className="final-stats">
              <p>最终分数: <strong>{score}</strong></p>
              <p>移动次数: {moves}</p>
              <p>最大方块: {Math.max(...board.flat().filter(n => n !== null) as number[])}</p>
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

export default Game2048;
