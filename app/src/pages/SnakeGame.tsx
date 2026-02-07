import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveGameRecord } from '../services/api/gameRecords';
import './SnakeGame.css';

interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

const SnakeGame: React.FC = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [gameStarted, setGameStarted] = useState(false);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
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
    const saved = localStorage.getItem('snakeBestScore');
    if (saved) {
      setBestScore(parseInt(saved));
    }
  }, []);

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const initializeGame = () => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
    startTimeRef.current = Date.now();
  };

  const checkCollision = useCallback((head: Position, snakeBody: Position[]): boolean => {
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }

    // 检查自身碰撞
    return snakeBody.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setDirection(nextDirection);

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };

      // 根据方向移动头部
      switch (nextDirection) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // 检查碰撞
      if (checkCollision(head, prevSnake)) {
        endGame();
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // 检查是否吃到食物
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop(); // 移除尾部
      }

      return newSnake;
    });
  }, [nextDirection, food, gameOver, isPaused, checkCollision, generateFood]);

  const endGame = async () => {
    setGameOver(true);

    if (!bestScore || score > bestScore) {
      setBestScore(score);
      localStorage.setItem('snakeBestScore', score.toString());
    }

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      await saveGameRecord({
        game_type: 'snake',
        difficulty,
        score,
        time_spent: timeSpent,
        best_streak: snake.length,
        accuracy: 100,
        metadata: {
          length: snake.length
        }
      });
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }
  };

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const speed = INITIAL_SPEED / speedMultiplier[difficulty];
      gameLoopRef.current = setInterval(moveSnake, speed);

      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, isPaused, difficulty, moveSnake]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      if (e.key === 'p' || e.key === 'P') {
        setIsPaused(prev => !prev);
        return;
      }

      if (isPaused) return;

      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setNextDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setNextDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setNextDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setNextDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver, isPaused, direction]);

  const resetGame = () => {
    setGameStarted(false);
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnakeHead = snake[0].x === x && snake[0].y === y;
        const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;

        let cellClass = 'grid-cell';
        if (isSnakeHead) cellClass += ' snake-head';
        else if (isSnakeBody) cellClass += ' snake-body';
        else if (isFood) cellClass += ' food';

        grid.push(<div key={`${x}-${y}`} className={cellClass} />);
      }
    }
    return grid;
  };

  if (!gameStarted) {
    return (
      <div className="snake-game">
        <div className="game-header">
          <button className="back-button" onClick={() => navigate('/games')}>
            ← 返回
          </button>
          <h1>贪吃蛇</h1>
        </div>

        <div className="game-setup">
          <div className="setup-card">
            <h2>🎮 游戏规则</h2>
            <ul>
              <li>使用方向键控制蛇的移动方向</li>
              <li>吃到食物(红色方块)蛇会变长,得10分</li>
              <li>不能撞墙或撞到自己的身体</li>
              <li>蛇越长,分数越高</li>
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
    <div className="snake-game">
      <div className="game-header">
        <button className="back-button" onClick={resetGame}>
          ← 返回设置
        </button>
        <h1>贪吃蛇</h1>
      </div>

      <div className="game-container">
        <div className="game-info">
          <div className="info-card">
            <h3>分数</h3>
            <p className="score-value">{score}</p>
          </div>
          <div className="info-card">
            <h3>长度</h3>
            <p className="length-value">{snake.length}</p>
          </div>
          <div className="info-card">
            <h3>难度</h3>
            <p className="difficulty-value">
              {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
            </p>
          </div>
        </div>

        <div className="board-container">
          {isPaused && (
            <div className="pause-overlay">
              <h2>游戏暂停</h2>
              <p>按 P 键继续</p>
            </div>
          )}
          <div className="snake-board">
            {renderGrid()}
          </div>
        </div>

        <div className="game-controls">
          <h3>控制说明</h3>
          <div className="control-item">
            <span>↑</span>
            <span>向上</span>
          </div>
          <div className="control-item">
            <span>↓</span>
            <span>向下</span>
          </div>
          <div className="control-item">
            <span>←</span>
            <span>向左</span>
          </div>
          <div className="control-item">
            <span>→</span>
            <span>向右</span>
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
            <h2>🐍 游戏结束!</h2>
            <div className="final-stats">
              <p>最终分数: <strong>{score}</strong></p>
              <p>蛇的长度: {snake.length}</p>
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

export default SnakeGame;
