import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveGameRecord } from '../services/api/gameRecords';
import './MemoryCardGame.css';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryCardGame: React.FC = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);

  // 不同难度的卡片数量
  const cardCounts = {
    easy: 8,    // 4对
    medium: 12, // 6对
    hard: 16    // 8对
  };

  // 卡片图案(使用emoji)
  const cardSymbols = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🍒', '🍑', '🥝', '🍍', '🥥', '🥭', '🍋', '🍈', '🫐', '🍏'];

  useEffect(() => {
    const saved = localStorage.getItem('memoryCardBestScore');
    if (saved) {
      setBestScore(parseInt(saved));
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && !gameOver) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  const initializeGame = () => {
    const pairCount = cardCounts[difficulty] / 2;
    const selectedSymbols = cardSymbols.slice(0, pairCount);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];

    // 洗牌
    const shuffled = cardPairs
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setTimeElapsed(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2 || cards[cardId].isFlipped || cards[cardId].isMatched) {
      return;
    }

    const newCards = [...cards];
    newCards[cardId].isFlipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      checkMatch(newFlippedCards);
    }
  };

  const checkMatch = (flippedIndices: number[]) => {
    const [first, second] = flippedIndices;

    if (cards[first].value === cards[second].value) {
      // 匹配成功
      setTimeout(() => {
        const newCards = [...cards];
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        setCards(newCards);
        setFlippedCards([]);

        const newMatchedPairs = matchedPairs + 1;
        setMatchedPairs(newMatchedPairs);

        // 检查是否游戏结束
        if (newMatchedPairs === cardCounts[difficulty] / 2) {
          endGame();
        }
      }, 500);
    } else {
      // 匹配失败,翻回去
      setTimeout(() => {
        const newCards = [...cards];
        newCards[first].isFlipped = false;
        newCards[second].isFlipped = false;
        setCards(newCards);
        setFlippedCards([]);
      }, 1000);
    }
  };

  const calculateScore = () => {
    // 分数计算: 基础分1000 - (移动次数 * 10) - (时间 * 2)
    const baseScore = 1000;
    const movePenalty = moves * 10;
    const timePenalty = timeElapsed * 2;
    return Math.max(0, baseScore - movePenalty - timePenalty);
  };

  const endGame = async () => {
    setGameOver(true);
    const finalScore = calculateScore();

    // 更新最佳分数
    if (!bestScore || finalScore > bestScore) {
      setBestScore(finalScore);
      localStorage.setItem('memoryCardBestScore', finalScore.toString());
    }

    // 保存游戏记录
    try {
      await saveGameRecord({
        game_type: 'memory_card',
        difficulty,
        score: finalScore,
        time_spent: timeElapsed,
        best_streak: matchedPairs,
        accuracy: (matchedPairs / moves) * 100,
        metadata: {
          moves,
          pairs: cardCounts[difficulty] / 2
        }
      });
    } catch (error) {
      console.error('保存游戏记录失败:', error);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setCards([]);
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setTimeElapsed(0);
    setGameOver(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameStarted) {
    return (
      <div className="memory-card-game">
        <div className="game-header">
          <button className="back-button" onClick={() => navigate('/games')}>
            ← 返回
          </button>
          <h1>记忆翻牌游戏</h1>
        </div>

        <div className="game-setup">
          <div className="setup-card">
            <h2>🎮 游戏规则</h2>
            <ul>
              <li>翻开两张卡片,如果图案相同则配对成功</li>
              <li>配对成功的卡片会保持翻开状态</li>
              <li>用最少的移动次数和时间完成所有配对</li>
              <li>分数 = 1000 - (移动次数×10) - (时间×2)</li>
            </ul>
          </div>

          <div className="setup-card">
            <h2>🎯 选择难度</h2>
            <div className="difficulty-buttons">
              <button
                className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
                onClick={() => setDifficulty('easy')}
              >
                简单 (4对)
              </button>
              <button
                className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
                onClick={() => setDifficulty('medium')}
              >
                中等 (6对)
              </button>
              <button
                className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
                onClick={() => setDifficulty('hard')}
              >
                困难 (8对)
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
    <div className="memory-card-game">
      <div className="game-header">
        <button className="back-button" onClick={resetGame}>
          ← 返回设置
        </button>
        <h1>记忆翻牌游戏</h1>
      </div>

      <div className="game-stats">
        <div className="stat-item">
          <span className="stat-label">移动次数:</span>
          <span className="stat-value">{moves}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已配对:</span>
          <span className="stat-value">{matchedPairs}/{cardCounts[difficulty] / 2}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">时间:</span>
          <span className="stat-value">{formatTime(timeElapsed)}</span>
        </div>
      </div>

      <div className={`card-grid grid-${difficulty}`}>
        {cards.map((card) => (
          <div
            key={card.id}
            className={`memory-card ${card.isFlipped || card.isMatched ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-inner">
              <div className="card-front">?</div>
              <div className="card-back">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="game-over-modal">
          <div className="modal-content">
            <h2>🎉 游戏完成!</h2>
            <div className="final-stats">
              <p>移动次数: {moves}</p>
              <p>用时: {formatTime(timeElapsed)}</p>
              <p>最终分数: <strong>{calculateScore()}</strong></p>
              {bestScore && calculateScore() > bestScore && (
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

export default MemoryCardGame;
