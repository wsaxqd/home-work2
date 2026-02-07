import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './IdiomChainGame.css';

interface Idiom {
  idiom: string;
  pinyin: string;
  explanation: string;
  nextOptions: string[];
  correctNext: string;
}

// 成语题库
const idiomDatabase = {
  easy: [
    {
      idiom: '一心一意',
      pinyin: 'yī xīn yī yì',
      explanation: '形容做事专心一致，心无旁骛',
      nextOptions: ['意气风发', '意味深长', '意想不到', '意义重大'],
      correctNext: '意气风发'
    },
    {
      idiom: '意气风发',
      pinyin: 'yì qì fēng fā',
      explanation: '形容精神振奋，气概豪迈',
      nextOptions: ['发扬光大', '发愤图强', '发号施令', '发人深省'],
      correctNext: '发扬光大'
    },
    {
      idiom: '发扬光大',
      pinyin: 'fā yáng guāng dà',
      explanation: '使好的作风、传统等得到发展和提高',
      nextOptions: ['大显身手', '大功告成', '大吃一惊', '大同小异'],
      correctNext: '大显身手'
    },
    {
      idiom: '大显身手',
      pinyin: 'dà xiǎn shēn shǒu',
      explanation: '充分显示出本领和才能',
      nextOptions: ['手舞足蹈', '手忙脚乱', '手足无措', '手到擒来'],
      correctNext: '手舞足蹈'
    },
    {
      idiom: '手舞足蹈',
      pinyin: 'shǒu wǔ zú dǎo',
      explanation: '形容高兴到了极点',
      nextOptions: ['蹈火赴汤', '蹈常袭故', '蹈厉奋发', '蹈节死义'],
      correctNext: '蹈厉奋发'
    }
  ],
  medium: [
    {
      idiom: '胸有成竹',
      pinyin: 'xiōng yǒu chéng zhú',
      explanation: '比喻做事之前已有通盘考虑',
      nextOptions: ['竹报平安', '竹篮打水', '竹马之友', '竹苞松茂'],
      correctNext: '竹报平安'
    },
    {
      idiom: '竹报平安',
      pinyin: 'zhú bào píng ān',
      explanation: '比喻平安家信',
      nextOptions: ['安居乐业', '安然无恙', '安步当车', '安贫乐道'],
      correctNext: '安居乐业'
    },
    {
      idiom: '安居乐业',
      pinyin: 'ān jū lè yè',
      explanation: '安定地生活，愉快地工作',
      nextOptions: ['业精于勤', '业荒于嬉', '业业兢兢', '业峻鸿绩'],
      correctNext: '业精于勤'
    },
    {
      idiom: '业精于勤',
      pinyin: 'yè jīng yú qín',
      explanation: '学业的精进在于勤奋',
      nextOptions: ['勤能补拙', '勤俭持家', '勤学苦练', '勤勤恳恳'],
      correctNext: '勤能补拙'
    },
    {
      idiom: '勤能补拙',
      pinyin: 'qín néng bǔ zhuō',
      explanation: '勤奋能够弥补不足',
      nextOptions: ['拙口钝腮', '拙嘴笨舌', '拙贝罗香', '拙口笨腮'],
      correctNext: '拙口钝腮'
    }
  ],
  hard: [
    {
      idiom: '鞠躬尽瘁',
      pinyin: 'jū gōng jìn cuì',
      explanation: '指恭敬谨慎，竭尽心力',
      nextOptions: ['瘁心劳形', '瘁力殚精', '瘁身竭虑', '瘁志劳神'],
      correctNext: '瘁心劳形'
    },
    {
      idiom: '瘁心劳形',
      pinyin: 'cuì xīn láo xíng',
      explanation: '身心疲惫不堪',
      nextOptions: ['形影相吊', '形单影只', '形形色色', '形销骨立'],
      correctNext: '形影相吊'
    },
    {
      idiom: '形影相吊',
      pinyin: 'xíng yǐng xiāng diào',
      explanation: '形容孤独，没有伴侣',
      nextOptions: ['吊民伐罪', '吊古寻幽', '吊死问疾', '吊尔郎当'],
      correctNext: '吊民伐罪'
    },
    {
      idiom: '吊民伐罪',
      pinyin: 'diào mín fá zuì',
      explanation: '慰问受苦的人民，讨伐有罪的统治者',
      nextOptions: ['罪大恶极', '罪有应得', '罪魁祸首', '罪孽深重'],
      correctNext: '罪大恶极'
    },
    {
      idiom: '罪大恶极',
      pinyin: 'zuì dà è jí',
      explanation: '罪恶大到了极点',
      nextOptions: ['极目远眺', '极乐世界', '极往知来', '极天际地'],
      correctNext: '极目远眺'
    }
  ]
};

const IdiomChainGame: React.FC = () => {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [currentQuestion, setCurrentQuestion] = useState<Idiom | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // 开始游戏
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(90);
    setStreak(0);
    setQuestionIndex(0);
    setShowExplanation(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCurrentQuestion(idiomDatabase[difficulty][0]);
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
  const submitAnswer = (answer: string) => {
    if (!currentQuestion || selectedAnswer) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctNext;
    setIsCorrect(correct);
    setShowExplanation(true);

    if (correct) {
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      const bonusPoints = Math.floor(streak / 3) * 5; // 每3连击额外5分
      setScore(score + points + bonusPoints);
      setStreak(streak + 1);
      if (streak + 1 > bestStreak) setBestStreak(streak + 1);
    } else {
      setStreak(0);
    }

    // 2秒后显示下一题
    setTimeout(() => {
      const nextIndex = (questionIndex + 1) % idiomDatabase[difficulty].length;
      setQuestionIndex(nextIndex);
      setCurrentQuestion(idiomDatabase[difficulty][nextIndex]);
      setShowExplanation(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }, 2000);
  };

  return (
    <div className="idiom-chain-game">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate('/games')}>
          ← 返回
        </button>
        <h1>成语接龙挑战</h1>
      </div>

      {!gameStarted && !gameOver && (
        <div className="game-start">
          <div className="start-card">
            <div className="game-icon">📚</div>
            <h2>成语接龙挑战</h2>
            <p>根据成语的最后一个字，选择正确的接龙成语！</p>

            <div className="difficulty-selector">
              <h3>选择难度:</h3>
              <div className="difficulty-buttons">
                <button
                  className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  <div className="diff-icon">😊</div>
                  <div className="diff-name">简单</div>
                  <div className="diff-desc">常见成语</div>
                </button>
                <button
                  className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  <div className="diff-icon">🤔</div>
                  <div className="diff-name">中等</div>
                  <div className="diff-desc">较难成语</div>
                </button>
                <button
                  className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  <div className="diff-icon">😎</div>
                  <div className="diff-name">困难</div>
                  <div className="diff-desc">生僻成语</div>
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
            <div className="idiom-display">
              <div className="idiom-text">{currentQuestion.idiom}</div>
              <div className="idiom-pinyin">{currentQuestion.pinyin}</div>
              <div className="idiom-explanation">{currentQuestion.explanation}</div>
            </div>

            <div className="question-prompt">
              <span className="prompt-icon">🤔</span>
              <span className="prompt-text">请选择正确的接龙成语：</span>
            </div>

            <div className="options-grid">
              {currentQuestion.nextOptions.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${
                    selectedAnswer === option
                      ? isCorrect
                        ? 'correct'
                        : 'wrong'
                      : selectedAnswer && option === currentQuestion.correctNext
                      ? 'correct-answer'
                      : ''
                  }`}
                  onClick={() => submitAnswer(option)}
                  disabled={!!selectedAnswer}
                >
                  {option}
                </button>
              ))}
            </div>

            {showExplanation && (
              <div className={`feedback ${isCorrect ? 'correct-feedback' : 'wrong-feedback'}`}>
                <div className="feedback-icon">{isCorrect ? '✅' : '❌'}</div>
                <div className="feedback-text">
                  {isCorrect ? '回答正确！' : `正确答案是：${currentQuestion.correctNext}`}
                </div>
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

export default IdiomChainGame;
