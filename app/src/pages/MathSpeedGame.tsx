import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MathSpeedGame.css';

interface Question {
  num1: number;
  num2: number;
  operator: string;
  answer: number;
}

const MathSpeedGame: React.FC = () => {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // 生成题目
  const generateQuestion = (): Question => {
    let num1, num2, operator, answer;

    switch (difficulty) {
      case 'easy':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        operator = Math.random() > 0.5 ? '+' : '-';
        if (operator === '-' && num1 < num2) [num1, num2] = [num2, num1];
        answer = operator === '+' ? num1 + num2 : num1 - num2;
        break;

      case 'medium':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        const ops = ['+', '-', '×'];
        operator = ops[Math.floor(Math.random() * ops.length)];
        if (operator === '-' && num1 < num2) [num1, num2] = [num2, num1];
        if (operator === '×') {
          num1 = Math.floor(Math.random() * 12) + 1;
          num2 = Math.floor(Math.random() * 12) + 1;
        }
        answer = operator === '+' ? num1 + num2 : operator === '-' ? num1 - num2 : num1 * num2;
        break;

      case 'hard':
        num1 = Math.floor(Math.random() * 100) + 1;
        num2 = Math.floor(Math.random() * 100) + 1;
        const allOps = ['+', '-', '×', '÷'];
        operator = allOps[Math.floor(Math.random() * allOps.length)];
        if (operator === '-' && num1 < num2) [num1, num2] = [num2, num1];
        if (operator === '÷') {
          num2 = Math.floor(Math.random() * 12) + 1;
          answer = Math.floor(Math.random() * 12) + 1;
          num1 = num2 * answer;
        } else if (operator === '×') {
          num1 = Math.floor(Math.random() * 20) + 1;
          num2 = Math.floor(Math.random() * 20) + 1;
          answer = num1 * num2;
        } else {
          answer = operator === '+' ? num1 + num2 : num1 - num2;
        }
        break;
    }

    return { num1, num2, operator, answer };
  };

  // 开始游戏
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(60);
    setStreak(0);
    setCurrentQuestion(generateQuestion());
    setUserAnswer('');
  };

  // 计时器
  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      setGameStarted(false);
    }
  }, [gameStarted, gameOver, timeLeft]);

  // 提交答案
  const submitAnswer = () => {
    if (!currentQuestion || userAnswer === '') return;

    const isCorrect = parseInt(userAnswer) === currentQuestion.answer;

    if (isCorrect) {
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      const bonusPoints = Math.floor(streak / 5) * 5; // 每5连击额外5分
      setScore(score + points + bonusPoints);
      setStreak(streak + 1);
      if (streak + 1 > bestStreak) setBestStreak(streak + 1);
    } else {
      setStreak(0);
    }

    setCurrentQuestion(generateQuestion());
    setUserAnswer('');
  };

  // 键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitAnswer();
    }
  };

  return (
    <div className="math-speed-game">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/games')}>
          ← 返回
        </button>
        <h1>数学速算挑战</h1>
      </div>

      {!gameStarted && !gameOver && (
        <div className="game-start">
          <div className="start-card">
            <div className="game-icon">🔢</div>
            <h2>数学速算挑战</h2>
            <p>在60秒内完成尽可能多的计算题!</p>

            <div className="difficulty-selector">
              <h3>选择难度:</h3>
              <div className="difficulty-buttons">
                <button
                  className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  <div className="diff-icon">😊</div>
                  <div className="diff-name">简单</div>
                  <div className="diff-desc">20以内加减法</div>
                </button>
                <button
                  className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  <div className="diff-icon">🤔</div>
                  <div className="diff-name">中等</div>
                  <div className="diff-desc">50以内加减乘</div>
                </button>
                <button
                  className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  <div className="diff-icon">😎</div>
                  <div className="diff-name">困难</div>
                  <div className="diff-desc">100以内四则运算</div>
                </button>
              </div>
            </div>

            <button className="start-button" onClick={startGame}>
              开始挑战
            </button>
          </div>
        </div>
      )}

      {gameStarted && currentQuestion && (
        <div className="game-playing">
          <div className="game-stats">
            <div className="stat-item">
              <div className="stat-label">得分</div>
              <div className="stat-value">{score}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">时间</div>
              <div className="stat-value timer">{timeLeft}s</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">连击</div>
              <div className="stat-value streak">{streak}🔥</div>
            </div>
          </div>

          <div className="question-card">
            <div className="question-text">
              <span className="number">{currentQuestion.num1}</span>
              <span className="operator">{currentQuestion.operator}</span>
              <span className="number">{currentQuestion.num2}</span>
              <span className="equals">=</span>
              <span className="question-mark">?</span>
            </div>

            <input
              type="number"
              className="answer-input"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入答案"
              autoFocus
            />

            <button className="submit-btn" onClick={submitAnswer}>
              提交答案
            </button>
          </div>

          {streak >= 5 && (
            <div className="streak-bonus">
              🔥 {streak}连击! 额外奖励 +{Math.floor(streak / 5) * 5}分
            </div>
          )}
        </div>
      )}

      {gameOver && (
        <div className="game-over">
          <div className="result-card">
            <div className="result-icon">🎉</div>
            <h2>挑战结束!</h2>
            <div className="final-stats">
              <div className="final-stat">
                <div className="final-label">最终得分</div>
                <div className="final-value">{score}</div>
              </div>
              <div className="final-stat">
                <div className="final-label">最高连击</div>
                <div className="final-value">{bestStreak}🔥</div>
              </div>
              <div className="final-stat">
                <div className="final-label">难度</div>
                <div className="final-value">
                  {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
                </div>
              </div>
            </div>

            <div className="result-buttons">
              <button className="retry-btn" onClick={startGame}>
                再玩一次
              </button>
              <button className="back-btn-result" onClick={() => navigate('/games')}>
                返回游戏列表
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathSpeedGame;
