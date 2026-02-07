import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EnglishSpellingGame.css';

interface Word {
  word: string;
  definition: string;
  example: string;
  hint: string;
}

// 单词题库
const wordDatabase = {
  easy: [
    { word: 'apple', definition: '苹果', example: 'I like to eat an apple.', hint: '一种红色的水果' },
    { word: 'book', definition: '书', example: 'I read a book every day.', hint: '用来阅读的东西' },
    { word: 'cat', definition: '猫', example: 'The cat is sleeping.', hint: '一种宠物' },
    { word: 'dog', definition: '狗', example: 'My dog is very friendly.', hint: '人类最好的朋友' },
    { word: 'egg', definition: '鸡蛋', example: 'I had an egg for breakfast.', hint: '早餐常吃的食物' },
    { word: 'fish', definition: '鱼', example: 'Fish live in water.', hint: '生活在水里的动物' },
    { word: 'girl', definition: '女孩', example: 'The girl is playing.', hint: '年轻的女性' },
    { word: 'hand', definition: '手', example: 'Wash your hands.', hint: '身体的一部分' },
    { word: 'ice', definition: '冰', example: 'The ice is cold.', hint: '冷冻的水' },
    { word: 'jump', definition: '跳', example: 'I can jump high.', hint: '一种动作' }
  ],
  medium: [
    { word: 'beautiful', definition: '美丽的', example: 'She is beautiful.', hint: '形容好看的' },
    { word: 'computer', definition: '电脑', example: 'I use a computer every day.', hint: '电子设备' },
    { word: 'delicious', definition: '美味的', example: 'The food is delicious.', hint: '形容食物好吃' },
    { word: 'elephant', definition: '大象', example: 'The elephant is big.', hint: '最大的陆地动物' },
    { word: 'fantastic', definition: '极好的', example: 'That\'s fantastic news!', hint: '表示非常好' },
    { word: 'guitar', definition: '吉他', example: 'He plays the guitar.', hint: '一种乐器' },
    { word: 'hospital', definition: '医院', example: 'She works in a hospital.', hint: '治病的地方' },
    { word: 'important', definition: '重要的', example: 'This is important.', hint: '很有意义的' },
    { word: 'journey', definition: '旅程', example: 'Life is a journey.', hint: '旅行的过程' },
    { word: 'knowledge', definition: '知识', example: 'Knowledge is power.', hint: '学到的东西' }
  ],
  hard: [
    { word: 'achievement', definition: '成就', example: 'This is a great achievement.', hint: '完成的目标' },
    { word: 'beautiful', definition: '美丽的', example: 'The scenery is beautiful.', hint: '形容景色' },
    { word: 'conscience', definition: '良心', example: 'Follow your conscience.', hint: '道德感' },
    { word: 'democracy', definition: '民主', example: 'Democracy is important.', hint: '政治制度' },
    { word: 'enthusiasm', definition: '热情', example: 'He has great enthusiasm.', hint: '积极的态度' },
    { word: 'fascinating', definition: '迷人的', example: 'The story is fascinating.', hint: '非常吸引人' },
    { word: 'government', definition: '政府', example: 'The government makes laws.', hint: '国家管理机构' },
    { word: 'hypothesis', definition: '假设', example: 'Test your hypothesis.', hint: '科学推测' },
    { word: 'intelligence', definition: '智力', example: 'He has high intelligence.', hint: '聪明程度' },
    { word: 'jurisdiction', definition: '管辖权', example: 'This is under our jurisdiction.', hint: '法律权限' }
  ]
};

const EnglishSpellingGame: React.FC = () => {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [userInput, setUserInput] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean; message: string }>({
    show: false,
    correct: false,
    message: ''
  });

  // 获取随机单词
  const getRandomWord = (): Word => {
    const words = wordDatabase[difficulty];
    const availableWords = words.filter(w => !usedWords.has(w.word));

    if (availableWords.length === 0) {
      setUsedWords(new Set());
      return words[Math.floor(Math.random() * words.length)];
    }

    return availableWords[Math.floor(Math.random() * availableWords.length)];
  };

  // 开始游戏
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(90);
    setStreak(0);
    setUsedWords(new Set());
    setShowHint(false);
    setUserInput('');
    setFeedback({ show: false, correct: false, message: '' });
    setCurrentWord(getRandomWord());
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
    if (!currentWord || userInput.trim() === '' || feedback.show) return;

    const correct = userInput.trim().toLowerCase() === currentWord.word.toLowerCase();

    if (correct) {
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      const bonusPoints = Math.floor(streak / 3) * 5;
      const hintPenalty = showHint ? 5 : 0;
      const finalPoints = Math.max(points + bonusPoints - hintPenalty, 5);

      setScore(score + finalPoints);
      setStreak(streak + 1);
      if (streak + 1 > bestStreak) setBestStreak(streak + 1);
      setFeedback({ show: true, correct: true, message: `正确! +${finalPoints}分` });
    } else {
      setStreak(0);
      setFeedback({ show: true, correct: false, message: `错误! 正确答案是: ${currentWord.word}` });
    }

    // 记录已使用的单词
    setUsedWords(prev => new Set([...prev, currentWord.word]));

    // 2秒后显示下一题
    setTimeout(() => {
      setCurrentWord(getRandomWord());
      setUserInput('');
      setShowHint(false);
      setFeedback({ show: false, correct: false, message: '' });
    }, 2000);
  };

  // 键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitAnswer();
    }
  };

  return (
    <div className="english-spelling-game">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/games')}>
          ← 返回
        </button>
        <h1>单词拼写大师</h1>
      </div>

      {!gameStarted && !gameOver && (
        <div className="game-start">
          <div className="start-card">
            <div className="game-icon">📝</div>
            <h2>单词拼写大师</h2>
            <p>根据中文释义和例句，拼写出正确的英文单词！</p>

            <div className="difficulty-selector">
              <h3>选择难度:</h3>
              <div className="difficulty-buttons">
                <button
                  className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  <div className="diff-icon">😊</div>
                  <div className="diff-name">简单</div>
                  <div className="diff-desc">小学词汇</div>
                </button>
                <button
                  className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  <div className="diff-icon">🤔</div>
                  <div className="diff-name">中等</div>
                  <div className="diff-desc">初中词汇</div>
                </button>
                <button
                  className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  <div className="diff-icon">😎</div>
                  <div className="diff-name">困难</div>
                  <div className="diff-desc">高中词汇</div>
                </button>
              </div>
            </div>

            <button className="start-button" onClick={startGame}>
              开始挑战
            </button>
          </div>
        </div>
      )}

      {gameStarted && currentWord && (
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
            <div className="word-info">
              <div className="definition">
                <span className="label">中文释义:</span>
                <span className="value">{currentWord.definition}</span>
              </div>
              <div className="example">
                <span className="label">例句:</span>
                <span className="value">{currentWord.example}</span>
              </div>
              {showHint && (
                <div className="hint">
                  <span className="label">💡 提示:</span>
                  <span className="value">{currentWord.hint}</span>
                </div>
              )}
            </div>

            <div className="input-section">
              <input
                type="text"
                className="spelling-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="请输入英文单词"
                autoFocus
                disabled={feedback.show}
              />
              <div className="action-buttons">
                <button
                  className="hint-btn"
                  onClick={() => setShowHint(true)}
                  disabled={showHint || feedback.show}
                >
                  💡 提示 (-5分)
                </button>
                <button className="submit-btn" onClick={submitAnswer} disabled={feedback.show}>
                  提交答案
                </button>
              </div>
            </div>

            {feedback.show && (
              <div className={`feedback ${feedback.correct ? 'correct-feedback' : 'wrong-feedback'}`}>
                <div className="feedback-icon">{feedback.correct ? '✅' : '❌'}</div>
                <div className="feedback-text">{feedback.message}</div>
              </div>
            )}
          </div>

          {streak >= 3 && (
            <div className="streak-bonus">
              🔥 {streak}连击! 额外奖励 +{Math.floor(streak / 3) * 5}分
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

export default EnglishSpellingGame;
