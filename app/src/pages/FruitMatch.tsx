import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Header } from '../components/layout';
import { UsageTracker } from '../services/usageTracking';
import './FruitMatch.css';

// 可爱的水果emoji列表
const FRUITS = [
  { id: 1, emoji: '🍎', name: '苹果' },
  { id: 2, emoji: '🍌', name: '香蕉' },
  { id: 3, emoji: '🍇', name: '葡萄' },
  { id: 4, emoji: '🍊', name: '橙子' },
  { id: 5, emoji: '🍓', name: '草莓' },
  { id: 6, emoji: '🍉', name: '西瓜' },
  { id: 7, emoji: '🍑', name: '桃子' },
  { id: 8, emoji: '🥝', name: '猕猴桃' },
];

interface Tile {
  id: string;
  fruitId: number;
  emoji: string;
  matched: boolean;
  position: { row: number; col: number };
}

// 难度配置
const DIFFICULTY = {
  easy: { rows: 4, cols: 4, pairs: 8 },
  medium: { rows: 6, cols: 6, pairs: 18 },
  hard: { rows: 8, cols: 8, pairs: 32 },
};

export default function FruitMatch() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const checkTimerRef = useRef<number | null>(null);
  const usageTrackerRef = useRef<UsageTracker | null>(null);

  // 初始化游戏
  const initGame = useCallback(() => {
    const config = DIFFICULTY[difficulty];
    const totalTiles = config.rows * config.cols;
    const pairsNeeded = Math.floor(totalTiles / 2);

    // 创建配对的水果
    const gameFruits: Tile[] = [];
    const availableFruits = [...FRUITS];

    for (let i = 0; i < pairsNeeded; i++) {
      const fruit = availableFruits[i % availableFruits.length];
      const baseId = `fruit-${i}`;

      gameFruits.push({
        id: `${baseId}-a`,
        fruitId: fruit.id,
        emoji: fruit.emoji,
        matched: false,
        position: { row: 0, col: 0 },
      });

      gameFruits.push({
        id: `${baseId}-b`,
        fruitId: fruit.id,
        emoji: fruit.emoji,
        matched: false,
        position: { row: 0, col: 0 },
      });
    }

    // 洗牌
    const shuffled = gameFruits.sort(() => Math.random() - 0.5);

    // 分配位置
    shuffled.forEach((tile, index) => {
      tile.position = {
        row: Math.floor(index / config.cols),
        col: index % config.cols,
      };
    });

    setTiles(shuffled);
    setSelectedTiles([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimeElapsed(0);
    setGameStarted(false);
    setGameWon(false);
    setIsChecking(false);
  }, [difficulty]);

  // 计时器
  useEffect(() => {
    let timer: number;
    if (gameStarted && !gameWon) {
      timer = window.setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameWon]);

  // 初始化游戏
  useEffect(() => {
    initGame();
  }, [initGame]);

  // 组件卸载时清理定时器和追踪器
  useEffect(() => {
    return () => {
      if (checkTimerRef.current !== null) {
        clearTimeout(checkTimerRef.current);
      }
      // 如果用户离开页面,取消追踪
      if (usageTrackerRef.current) {
        usageTrackerRef.current.cancel();
      }
    };
  }, []);

  // 检查选中的方块是否连续相邻(消消乐规则)
  const areSelectedTilesAdjacent = (selected: Tile[]): boolean => {
    if (selected.length < 3) return false;

    // 获取所有选中方块的位置
    const positions = selected.map(t => ({ row: t.position.row, col: t.position.col }));

    // 检查是否在同一行
    const rows = positions.map(p => p.row);
    const cols = positions.map(p => p.col);
    const uniqueRows = [...new Set(rows)];
    const uniqueCols = [...new Set(cols)];

    if (uniqueRows.length === 1) {
      // 同一行,检查列是否连续
      const sortedCols = [...cols].sort((a, b) => a - b);
      for (let i = 0; i < sortedCols.length - 1; i++) {
        if (sortedCols[i + 1] - sortedCols[i] !== 1) {
          return false;
        }
      }
      return true;
    } else if (uniqueCols.length === 1) {
      // 同一列,检查行是否连续
      const sortedRows = [...rows].sort((a, b) => a - b);
      for (let i = 0; i < sortedRows.length - 1; i++) {
        if (sortedRows[i + 1] - sortedRows[i] !== 1) {
          return false;
        }
      }
      return true;
    }

    return false;
  };

  // 处理方块点击
  const handleTileClick = (tile: Tile) => {
    if (!gameStarted) {
      setGameStarted(true);
      // 开始追踪游戏时间
      usageTrackerRef.current = new UsageTracker('游戏', '水果消消乐', { difficulty });
      usageTrackerRef.current.start();
    }

    if (isChecking || tile.matched) {
      return;
    }

    // 点击已选中的方块,取消选择
    if (selectedTiles.some(t => t.id === tile.id)) {
      setSelectedTiles(selectedTiles.filter(t => t.id !== tile.id));
      return;
    }

    const newSelected = [...selectedTiles, tile];

    // 检查新选择的方块是否与已选方块类型相同
    const allSameType = newSelected.every(t => t.fruitId === newSelected[0].fruitId);

    if (!allSameType) {
      // 如果类型不同,清空之前的选择,重新开始
      setSelectedTiles([tile]);
      return;
    }

    setSelectedTiles(newSelected);

    // 检查是否有3个或更多相同的方块
    if (newSelected.length >= 3) {
      // 检查这些方块是否连在一起
      const isAdjacent = areSelectedTilesAdjacent(newSelected);

      if (isAdjacent) {
        setIsChecking(true);
        setMoves(prev => prev + 1);

        // 清除之前的定时器
        if (checkTimerRef.current !== null) {
          clearTimeout(checkTimerRef.current);
        }

        // 匹配成功,消除方块
        const selectedIds = new Set(newSelected.map(t => t.id));
        checkTimerRef.current = window.setTimeout(() => {
          setTiles(prevTiles =>
            prevTiles.map(t =>
              selectedIds.has(t.id)
                ? { ...t, matched: true }
                : t
            )
          );
          setMatchedPairs(prev => prev + Math.floor(newSelected.length / 2));
          setSelectedTiles([]);
          setIsChecking(false);
          checkTimerRef.current = null;
        }, 600);
      }
    }
  };

  // 检查游戏是否获胜
  useEffect(() => {
    const totalPairs = Math.floor(tiles.length / 2);
    if (matchedPairs === totalPairs && matchedPairs > 0) {
      setGameWon(true);
      // 记录游戏数据
      if (usageTrackerRef.current) {
        const score = Math.max(0, 100 - moves + matchedPairs * 10);
        usageTrackerRef.current.end(score, {
          moves,
          timeElapsed,
          difficulty,
          matchedPairs,
        });
        usageTrackerRef.current = null;
      }
    }
  }, [matchedPairs, tiles.length, moves, timeElapsed, difficulty]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const config = DIFFICULTY[difficulty];

  return (
    <Layout>
      <Header title="🍎 水果消消乐" gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" />

      <div className="main-content fruit-match-container">
        {/* 游戏统计面板 */}
        <div className="game-stats">
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <div className="stat-label">时间</div>
              <div className="stat-value">{formatTime(timeElapsed)}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <div className="stat-label">步数</div>
              <div className="stat-value">{moves}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✨</div>
            <div className="stat-info">
              <div className="stat-label">匹配</div>
              <div className="stat-value">{matchedPairs}/{Math.floor(tiles.length / 2)}</div>
            </div>
          </div>
        </div>

        {/* 难度选择 */}
        <div className="difficulty-selector">
          <button
            className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
            onClick={() => setDifficulty('easy')}
          >
            简单 (4×4)
          </button>
          <button
            className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
            onClick={() => setDifficulty('medium')}
          >
            中等 (6×6)
          </button>
          <button
            className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
            onClick={() => setDifficulty('hard')}
          >
            困难 (8×8)
          </button>
        </div>

        {/* 游戏板 */}
        <div
          className="game-board"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
            gridTemplateRows: `repeat(${config.rows}, 1fr)`,
          }}
        >
          {tiles.map((tile) => {
            const isSelected = selectedTiles.some(t => t.id === tile.id);
            const isWrong = selectedTiles.length === 2 &&
                           isSelected &&
                           selectedTiles[0].fruitId !== selectedTiles[1].fruitId;

            return (
              <div
                key={tile.id}
                className={`fruit-tile ${tile.matched ? 'matched' : ''} ${isSelected ? 'selected' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => handleTileClick(tile)}
              >
                <div className="fruit-emoji">{tile.emoji}</div>
                {tile.matched && (
                  <>
                    <div className="match-overlay">💥</div>
                    <div className="explosion-particles">
                      <span>✨</span>
                      <span>⭐</span>
                      <span>✨</span>
                      <span>⭐</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 重新开始按钮 */}
        <button className="restart-btn" onClick={initGame}>
          🔄 重新开始
        </button>

        {/* 胜利弹窗 */}
        {gameWon && (
          <div className="victory-modal" onClick={() => setGameWon(false)}>
            <div className="victory-content" onClick={(e) => e.stopPropagation()}>
              <div className="victory-emoji">🎉</div>
              <h2>恭喜过关!</h2>
              <div className="victory-stats">
                <p>⏱️ 用时: <strong>{formatTime(timeElapsed)}</strong></p>
                <p>🎯 步数: <strong>{moves}</strong></p>
                <p>⭐ 评分: <strong>{moves <= matchedPairs * 1.5 ? '完美!' : moves <= matchedPairs * 2 ? '很棒!' : '继续加油!'}</strong></p>
              </div>
              <div className="victory-buttons">
                <button className="victory-btn" onClick={initGame}>
                  再玩一次
                </button>
                <button className="victory-btn secondary" onClick={() => setGameWon(false)}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
