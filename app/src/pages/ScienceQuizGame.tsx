import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ScienceQuizGame.css';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

// 科学题库
const questionDatabase = {
  easy: [
    {
      question: '地球围绕什么天体运转？',
      options: ['月球', '太阳', '火星', '金星'],
      correctAnswer: 1,
      explanation: '地球围绕太阳运转，这个过程叫做公转，一年公转一周。',
      category: '天文'
    },
    {
      question: '水的化学式是什么？',
      options: ['H2O', 'CO2', 'O2', 'N2'],
      correctAnswer: 0,
      explanation: '水的化学式是H2O，由两个氢原子和一个氧原子组成。',
      category: '化学'
    },
    {
      question: '人体最大的器官是什么？',
      options: ['心脏', '肝脏', '皮肤', '肺'],
      correctAnswer: 2,
      explanation: '皮肤是人体最大的器官，成人皮肤面积约为1.5-2平方米。',
      category: '生物'
    },
    {
      question: '光的传播速度约为多少？',
      options: ['30万公里/秒', '3万公里/秒', '300公里/秒', '3000公里/秒'],
      correctAnswer: 0,
      explanation: '光在真空中的传播速度约为30万公里/秒，这是宇宙中最快的速度。',
      category: '物理'
    },
    {
      question: '植物进行光合作用需要什么？',
      options: ['氧气', '二氧化碳', '氮气', '氢气'],
      correctAnswer: 1,
      explanation: '植物通过光合作用吸收二氧化碳，释放氧气，制造养分。',
      category: '生物'
    }
  ],
  medium: [
    {
      question: '牛顿第一定律又称为什么？',
      options: ['惯性定律', '加速度定律', '作用力定律', '万有引力定律'],
      correctAnswer: 0,
      explanation: '牛顿第一定律又称惯性定律：物体在不受外力作用时，保持静止或匀速直线运动状态。',
      category: '物理'
    },
    {
      question: 'DNA的中文名称是什么？',
      options: ['核糖核酸', '脱氧核糖核酸', '蛋白质', '氨基酸'],
      correctAnswer: 1,
      explanation: 'DNA是脱氧核糖核酸的缩写，是生物遗传信息的载体。',
      category: '生物'
    },
    {
      question: '元素周期表是谁发明的？',
      options: ['爱因斯坦', '牛顿', '门捷列夫', '居里夫人'],
      correctAnswer: 2,
      explanation: '俄国化学家门捷列夫在1869年发明了元素周期表。',
      category: '化学'
    },
    {
      question: '太阳系中最大的行星是？',
      options: ['土星', '木星', '天王星', '海王星'],
      correctAnswer: 1,
      explanation: '木星是太阳系中最大的行星，质量是地球的318倍。',
      category: '天文'
    },
    {
      question: '声音在什么介质中传播最快？',
      options: ['空气', '水', '固体', '真空'],
      correctAnswer: 2,
      explanation: '声音在固体中传播最快，在真空中无法传播。',
      category: '物理'
    }
  ],
  hard: [
    {
      question: '量子力学的创始人之一是谁？',
      options: ['爱因斯坦', '普朗克', '牛顿', '伽利略'],
      correctAnswer: 1,
      explanation: '普朗克在1900年提出量子假说，被认为是量子力学的创始人之一。',
      category: '物理'
    },
    {
      question: '人类基因组计划完成于哪一年？',
      options: ['1990年', '2000年', '2003年', '2010年'],
      correctAnswer: 2,
      explanation: '人类基因组计划于2003年完成，测定了人类全部基因序列。',
      category: '生物'
    },
    {
      question: '相对论是谁提出的？',
      options: ['牛顿', '爱因斯坦', '霍金', '费曼'],
      correctAnswer: 1,
      explanation: '爱因斯坦在1905年提出狭义相对论，1915年提出广义相对论。',
      category: '物理'
    },
    {
      question: '碳的同位素C-14常用于什么？',
      options: ['医学诊断', '考古测年', '核能发电', '食品保鲜'],
      correctAnswer: 1,
      explanation: 'C-14测年法是考古学中重要的年代测定方法，可测定5万年内的文物年代。',
      category: '化学'
    },
    {
      question: '黑洞的逃逸速度是多少？',
      options: ['等于光速', '小于光速', '大于光速', '无法确定'],
      correctAnswer: 2,
      explanation: '黑洞的逃逸速度大于光速，因此连光都无法逃脱，这就是黑洞名称的由来。',
      category: '天文'
    }
  ]
};

const ScienceQuizGame: React.FC = () => {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [usedQuestions, setUsedQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // 获取随机题目
  const getRandomQuestion = (): Question => {
    const questions = questionDatabase[difficulty];
    const availableIndices = questions
      .map((_, index) => index)
      .filter(index => !usedQuestions.has(index));

    if (availableIndices.length === 0) {
      setUsedQuestions(new Set());
      return questions[Math.floor(Math.random() * questions.length)];
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    return questions[randomIndex];
  };

  // 开始游戏
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(120);
    setStreak(0);
    setUsedQuestions(new Set());
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsCorrect(null);
    setCurrentQuestion(getRandomQuestion());
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
  const submitAnswer = (answerIndex: number) => {
    if (!currentQuestion || selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    const correct = answerIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);

    if (correct) {
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      const bonusPoints = Math.floor(streak / 3) * 5;
      setScore(score + points + bonusPoints);
      setStreak(streak + 1);
      if (streak + 1 > bestStreak) setBestStreak(streak + 1);
    } else {
      setStreak(0);
    }

    // 记录已使用的题目
    const currentIndex = questionDatabase[difficulty].findIndex(
      q => q.question === currentQuestion.question
    );
    if (currentIndex !== -1) {
      setUsedQuestions(prev => new Set([...prev, currentIndex]));
    }

    // 3秒后显示下一题
    setTimeout(() => {
      setCurrentQuestion(getRandomQuestion());
      setSelectedAnswer(null);
      setShowExplanation(false);
      setIsCorrect(null);
    }, 3000);
  };

  return (
    <div className="science-quiz-game">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/games')}>
          ← 返回
        </button>
        <h1>科学知识问答</h1>
      </div>

      {!gameStarted && !gameOver && (
        <div className="game-start">
          <div className="start-card">
            <div className="game-icon">🔬</div>
            <h2>科学知识问答</h2>
            <p>挑战你的科学知识，探索奇妙的科学世界！</p>

            <div className="difficulty-selector">
              <h3>选择难度:</h3>
              <div className="difficulty-buttons">
                <button
                  className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  <div className="diff-icon">😊</div>
                  <div className="diff-name">简单</div>
                  <div className="diff-desc">生活常识</div>
                </button>
                <button
                  className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  <div className="diff-icon">🤔</div>
                  <div className="diff-name">中等</div>
                  <div className="diff-desc">科学原理</div>
                </button>
                <button
                  className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  <div className="diff-icon">😎</div>
                  <div className="diff-name">困难</div>
                  <div className="diff-desc">深度知识</div>
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
            <div className="category-badge">{currentQuestion.category}</div>
            <div className="question-text">{currentQuestion.question}</div>

            <div className="options-list">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${
                    selectedAnswer === index
                      ? isCorrect
                        ? 'correct'
                        : 'wrong'
                      : selectedAnswer !== null && index === currentQuestion.correctAnswer
                      ? 'correct-answer'
                      : ''
                  }`}
                  onClick={() => submitAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>

            {showExplanation && (
              <div className={`explanation ${isCorrect ? 'correct-exp' : 'wrong-exp'}`}>
                <div className="exp-header">
                  <span className="exp-icon">{isCorrect ? '✅' : '❌'}</span>
                  <span className="exp-title">{isCorrect ? '回答正确！' : '回答错误！'}</span>
                </div>
                <div className="exp-content">{currentQuestion.explanation}</div>
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

export default ScienceQuizGame;
