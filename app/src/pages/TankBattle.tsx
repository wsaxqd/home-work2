import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Header } from '../components/layout';
import { UsageTracker } from '../services/usageTracking';
import './TankBattle.css';

// 游戏配置
const GRID_SIZE = 20; // 网格大小
const CELL_SIZE = 25; // 每个格子的像素大小
const TANK_SPEED = 200; // 坦克移动速度(ms)
const BULLET_SPEED = 100; // 子弹速度(ms)
const ENEMY_SPAWN_INTERVAL = 5000; // 敌人生成间隔(ms)
const MAX_ENEMIES = 5; // 最大敌人数量

// 方向常量
const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

// 方向向量
const DIRECTION_VECTORS: Record<string, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

interface Position {
  x: number;
  y: number;
}

interface Tank extends Position {
  id: string;
  direction: string;
  health: number;
  isPlayer: boolean;
}

interface Bullet extends Position {
  id: string;
  direction: string;
  ownerId: string;
}

interface Wall extends Position {
  id: string;
  destructible: boolean;
}

export default function TankBattle() {
  const [playerTank, setPlayerTank] = useState<Tank>({
    id: 'player',
    x: 10,
    y: 18,
    direction: DIRECTIONS.UP,
    health: 3,
    isPlayer: true,
  });

  const [enemies, setEnemies] = useState<Tank[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [level, setLevel] = useState(1);
  const [enemiesDestroyed, setEnemiesDestroyed] = useState(0);

  const gameLoopRef = useRef<number | undefined>(undefined);
  const bulletLoopRef = useRef<number | undefined>(undefined);
  const enemySpawnRef = useRef<number | undefined>(undefined);
  const keysPressed = useRef<Set<string>>(new Set());
  const usageTrackerRef = useRef<UsageTracker | null>(null);

  // 初始化关卡
  const initLevel = useCallback(() => {
    // 创建玩家坦克
    setPlayerTank({
      id: 'player',
      x: 10,
      y: 18,
      direction: DIRECTIONS.UP,
      health: 3,
      isPlayer: true,
    });

    // 创建墙壁
    const newWalls: Wall[] = [];

    // 边界墙
    for (let i = 0; i < GRID_SIZE; i++) {
      newWalls.push({ id: `wall-top-${i}`, x: i, y: 0, destructible: false });
      newWalls.push({ id: `wall-bottom-${i}`, x: i, y: GRID_SIZE - 1, destructible: false });
      newWalls.push({ id: `wall-left-${i}`, x: 0, y: i, destructible: false });
      newWalls.push({ id: `wall-right-${i}`, x: GRID_SIZE - 1, y: i, destructible: false });
    }

    // 随机障碍物
    for (let i = 0; i < 15 + level * 3; i++) {
      const x = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
      const y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
      if (x !== 10 || y !== 18) { // 避免在玩家位置
        newWalls.push({ id: `wall-${i}`, x, y, destructible: true });
      }
    }

    setWalls(newWalls);
    setEnemies([]);
    setBullets([]);
    setGameOver(false);
    setGameWon(false);
    setIsPaused(false);
    setEnemiesDestroyed(0);
  }, [level]);

  // 生成敌人
  const spawnEnemy = useCallback(() => {
    if (enemies.length >= MAX_ENEMIES || gameOver || isPaused) return;

    const spawnPoints = [
      { x: 2, y: 2 },
      { x: GRID_SIZE - 3, y: 2 },
      { x: GRID_SIZE / 2, y: 2 },
    ];

    const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

    const newEnemy: Tank = {
      id: `enemy-${Date.now()}`,
      x: spawnPoint.x,
      y: spawnPoint.y,
      direction: DIRECTIONS.DOWN,
      health: 1,
      isPlayer: false,
    };

    setEnemies(prev => [...prev, newEnemy]);
  }, [enemies.length, gameOver, isPaused]);

  // 移动坦克
  const moveTank = useCallback((tank: Tank, direction: string): Tank | null => {
    const vector = DIRECTION_VECTORS[direction];
    const newX = tank.x + vector.x;
    const newY = tank.y + vector.y;

    // 检查边界
    if (newX < 1 || newX >= GRID_SIZE - 1 || newY < 1 || newY >= GRID_SIZE - 1) {
      return null;
    }

    // 检查墙壁碰撞
    const hitWall = walls.some(wall => wall.x === newX && wall.y === newY);
    if (hitWall) return null;

    // 检查坦克碰撞
    if (tank.isPlayer) {
      const hitEnemy = enemies.some(enemy => enemy.x === newX && enemy.y === newY);
      if (hitEnemy) return null;
    }

    return { ...tank, x: newX, y: newY, direction };
  }, [walls, enemies]);

  // 发射子弹
  const shoot = useCallback((tank: Tank) => {
    const vector = DIRECTION_VECTORS[tank.direction];
    const newBullet: Bullet = {
      id: `bullet-${Date.now()}-${Math.random()}`,
      x: tank.x + vector.x,
      y: tank.y + vector.y,
      direction: tank.direction,
      ownerId: tank.id,
    };

    setBullets(prev => [...prev, newBullet]);
  }, []);

  // 敌人AI
  const updateEnemyAI = useCallback(() => {
    if (gameOver || isPaused) return;

    setEnemies(prevEnemies => {
      return prevEnemies.map(enemy => {
        // 随机移动和射击
        if (Math.random() < 0.3) {
          shoot(enemy);
        }

        if (Math.random() < 0.5) {
          const directions = Object.values(DIRECTIONS);
          const randomDirection = directions[Math.floor(Math.random() * directions.length)];
          const moved = moveTank(enemy, randomDirection);
          return moved || enemy;
        }

        return enemy;
      });
    });
  }, [gameOver, isPaused, moveTank, shoot]);

  // 更新子弹
  const updateBullets = useCallback(() => {
    if (gameOver || isPaused) return;

    setBullets(prevBullets => {
      const updatedBullets = prevBullets
        .map(bullet => {
          const vector = DIRECTION_VECTORS[bullet.direction];
          return {
            ...bullet,
            x: bullet.x + vector.x,
            y: bullet.y + vector.y,
          };
        })
        .filter(bullet => {
          // 移除出界的子弹
          if (bullet.x < 0 || bullet.x >= GRID_SIZE || bullet.y < 0 || bullet.y >= GRID_SIZE) {
            return false;
          }

          // 检查墙壁碰撞
          const hitWallIndex = walls.findIndex(wall => wall.x === bullet.x && wall.y === bullet.y);
          if (hitWallIndex !== -1) {
            if (walls[hitWallIndex].destructible) {
              setWalls(prev => prev.filter((_, idx) => idx !== hitWallIndex));
            }
            return false;
          }

          // 检查玩家碰撞
          if (bullet.ownerId !== 'player' && bullet.x === playerTank.x && bullet.y === playerTank.y) {
            setPlayerTank(prev => {
              const newHealth = prev.health - 1;
              if (newHealth <= 0) {
                setGameOver(true);
              }
              return { ...prev, health: newHealth };
            });
            return false;
          }

          // 检查敌人碰撞
          if (bullet.ownerId === 'player') {
            const hitEnemyIndex = enemies.findIndex(
              enemy => enemy.x === bullet.x && enemy.y === bullet.y
            );
            if (hitEnemyIndex !== -1) {
              setEnemies(prev => prev.filter((_, idx) => idx !== hitEnemyIndex));
              setScore(prev => prev + 100);
              setEnemiesDestroyed(prev => prev + 1);
              return false;
            }
          }

          return true;
        });

      return updatedBullets;
    });
  }, [gameOver, isPaused, walls, playerTank, enemies]);

  // 键盘控制
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysPressed.current.add(e.key);

    if (e.key === ' ' && !gameOver && !isPaused) {
      shoot(playerTank);
      e.preventDefault();
    }

    if (e.key === 'p' || e.key === 'P') {
      setIsPaused(prev => !prev);
      e.preventDefault();
    }
  }, [playerTank, shoot, gameOver, isPaused]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.key);
  }, []);

  // 游戏主循环
  useEffect(() => {
    if (gameOver || isPaused) return;

    const gameLoop = () => {
      // 处理玩家移动
      if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) {
        const moved = moveTank(playerTank, DIRECTIONS.UP);
        if (moved) setPlayerTank(moved);
      }
      if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s')) {
        const moved = moveTank(playerTank, DIRECTIONS.DOWN);
        if (moved) setPlayerTank(moved);
      }
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
        const moved = moveTank(playerTank, DIRECTIONS.LEFT);
        if (moved) setPlayerTank(moved);
      }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
        const moved = moveTank(playerTank, DIRECTIONS.RIGHT);
        if (moved) setPlayerTank(moved);
      }

      updateEnemyAI();
    };

    gameLoopRef.current = window.setInterval(gameLoop, TANK_SPEED);

    return () => {
      if (gameLoopRef.current !== undefined) clearInterval(gameLoopRef.current);
    };
  }, [playerTank, moveTank, updateEnemyAI, gameOver, isPaused]);

  // 子弹循环
  useEffect(() => {
    if (gameOver || isPaused) return;

    bulletLoopRef.current = window.setInterval(updateBullets, BULLET_SPEED);

    return () => {
      if (bulletLoopRef.current !== undefined) clearInterval(bulletLoopRef.current);
    };
  }, [updateBullets, gameOver, isPaused]);

  // 敌人生成循环
  useEffect(() => {
    if (gameOver || isPaused) return;

    enemySpawnRef.current = window.setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL);

    return () => {
      if (enemySpawnRef.current !== undefined) clearInterval(enemySpawnRef.current);
    };
  }, [spawnEnemy, gameOver, isPaused]);

  // 键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // 初始化游戏
  useEffect(() => {
    initLevel();
    // 开始追踪使用情况
    usageTrackerRef.current = new UsageTracker('游戏', '坦克大战');
    usageTrackerRef.current.start();
  }, [initLevel]);

  // 检查胜利条件
  useEffect(() => {
    if (enemiesDestroyed >= 10 * level && !gameOver) {
      setGameWon(true);
    }
  }, [enemiesDestroyed, level, gameOver]);

  // 检查游戏结束并记录数据
  useEffect(() => {
    if (gameOver && usageTrackerRef.current) {
      usageTrackerRef.current.end(score, { level, enemiesDestroyed });
      usageTrackerRef.current = null;
    }
  }, [gameOver, score, level, enemiesDestroyed]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (usageTrackerRef.current) {
        usageTrackerRef.current.cancel();
      }
    };
  }, []);

  // 重新开始
  const restartGame = () => {
    setScore(0);
    setLevel(1);
    initLevel();
  };

  // 下一关
  const nextLevel = () => {
    setLevel(prev => prev + 1);
    setGameWon(false);
    initLevel();
  };

  return (
    <Layout>
      <Header title="🚀 坦克大战" gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />

      <div className="main-content tank-battle-container">
        {/* 游戏信息面板 */}
        <div className="game-info-panel">
          <div className="info-item">
            <span className="info-label">关卡:</span>
            <span className="info-value">{level}</span>
          </div>
          <div className="info-item">
            <span className="info-label">得分:</span>
            <span className="info-value">{score}</span>
          </div>
          <div className="info-item">
            <span className="info-label">生命:</span>
            <span className="info-value">
              {'❤️'.repeat(playerTank.health)}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">消灭:</span>
            <span className="info-value">{enemiesDestroyed}/{10 * level}</span>
          </div>
          <div className="info-item">
            <span className="info-label">敌人:</span>
            <span className="info-value">{enemies.length}</span>
          </div>
        </div>

        {/* 游戏画布 */}
        <div className="game-canvas-wrapper">
          <div
            className="game-canvas"
            style={{
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
            }}
          >
            {/* 墙壁 */}
            {walls.map(wall => (
              <div
                key={wall.id}
                className={`wall ${wall.destructible ? 'destructible' : 'indestructible'}`}
                style={{
                  left: wall.x * CELL_SIZE,
                  top: wall.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              />
            ))}

            {/* 玩家坦克 */}
            <div
              className={`tank player ${playerTank.direction}`}
              style={{
                left: playerTank.x * CELL_SIZE,
                top: playerTank.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            >
              🟢
            </div>

            {/* 敌人坦克 */}
            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className={`tank enemy ${enemy.direction}`}
                style={{
                  left: enemy.x * CELL_SIZE,
                  top: enemy.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              >
                🔴
              </div>
            ))}

            {/* 子弹 */}
            {bullets.map(bullet => (
              <div
                key={bullet.id}
                className={`bullet ${bullet.ownerId === 'player' ? 'player-bullet' : 'enemy-bullet'}`}
                style={{
                  left: bullet.x * CELL_SIZE + CELL_SIZE / 2 - 3,
                  top: bullet.y * CELL_SIZE + CELL_SIZE / 2 - 3,
                }}
              />
            ))}

            {/* 暂停提示 */}
            {isPaused && (
              <div className="pause-overlay">
                <div className="pause-text">⏸️ 游戏暂停</div>
                <div className="pause-hint">按 P 继续</div>
              </div>
            )}
          </div>
        </div>

        {/* 控制说明 */}
        <div className="controls-guide">
          <div className="control-item">
            <span className="control-key">↑ ↓ ← → 或 WASD</span>
            <span className="control-desc">移动坦克</span>
          </div>
          <div className="control-item">
            <span className="control-key">空格</span>
            <span className="control-desc">发射子弹</span>
          </div>
          <div className="control-item">
            <span className="control-key">P</span>
            <span className="control-desc">暂停/继续</span>
          </div>
        </div>

        {/* 游戏结束弹窗 */}
        {gameOver && (
          <div className="game-modal" onClick={() => {}}>
            <div className="modal-content game-over" onClick={(e) => e.stopPropagation()}>
              <div className="modal-emoji">💥</div>
              <h2>游戏结束!</h2>
              <div className="modal-stats">
                <p>最终得分: <strong>{score}</strong></p>
                <p>到达关卡: <strong>{level}</strong></p>
                <p>消灭敌人: <strong>{enemiesDestroyed}</strong></p>
              </div>
              <button className="modal-btn" onClick={restartGame}>
                重新开始
              </button>
            </div>
          </div>
        )}

        {/* 胜利弹窗 */}
        {gameWon && (
          <div className="game-modal" onClick={() => {}}>
            <div className="modal-content game-won" onClick={(e) => e.stopPropagation()}>
              <div className="modal-emoji">🎉</div>
              <h2>关卡通过!</h2>
              <div className="modal-stats">
                <p>当前得分: <strong>{score}</strong></p>
                <p>完成关卡: <strong>{level}</strong></p>
                <p>消灭敌人: <strong>{enemiesDestroyed}</strong></p>
              </div>
              <div className="modal-buttons">
                <button className="modal-btn" onClick={nextLevel}>
                  下一关
                </button>
                <button className="modal-btn secondary" onClick={restartGame}>
                  重新开始
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
