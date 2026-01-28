import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Practice.css';

interface Question {
  id: string;
  subject: string;
  grade: string;
  knowledge_point_id: string;
  question_type: 'single_choice' | 'multiple_choice' | 'fill_blank' | 'true_false' | 'subjective';
  question_text: string;
  question_image?: string;
  correct_answer: string;
  explanation: string;
  difficulty: number;
  tags?: string[];
  options?: Array<{
    id: string;
    option_label: string;
    option_text: string;
  }>;
}

interface PracticeSession {
  sessionId: string;
  questions: Question[];
  currentIndex: number;
  answers: Map<string, string>;
  startTime: number;
  knowledgePointName?: string;
}

function Practice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const knowledgePointId = searchParams.get('knowledgePoint');

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [practiceComplete, setPracticeComplete] = useState(false);

  useEffect(() => {
    startPractice();
  }, [knowledgePointId]);

  const startPractice = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // 从API获取推荐题目
      const apiUrl = knowledgePointId
        ? `${import.meta.env.VITE_API_URL}/api/adaptive-learning/recommended-questions?knowledgePointId=${knowledgePointId}&count=5`
        : `${import.meta.env.VITE_API_URL}/api/adaptive-learning/questions?subject=math&grade=grade_3&limit=5`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取题目失败');
      }

      const data = await response.json();
      const questions = data.data.questions;

      if (!questions || questions.length === 0) {
        setError('暂无练习题,请稍后再试');
        setLoading(false);
        return;
      }

      // 如果有知识点ID,获取知识点名称
      let knowledgePointName = '练习';
      if (knowledgePointId) {
        try {
          const kpResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/api/adaptive-learning/knowledge-point/${knowledgePointId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          if (kpResponse.ok) {
            const kpData = await kpResponse.json();
            knowledgePointName = kpData.data.name || '练习';
          }
        } catch (err) {
          console.error('获取知识点名称失败:', err);
        }
      }

      setSession({
        sessionId: `session_${Date.now()}`,
        questions,
        currentIndex: 0,
        answers: new Map(),
        startTime: Date.now(),
        knowledgePointName
      });
    } catch (err) {
      console.error('获取练习题失败:', err);
      setError('获取练习题失败,请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !session) return;

    const currentQuestion = session.questions[session.currentIndex];
    const correct = selectedAnswer === currentQuestion.correct_answer;

    setIsCorrect(correct);
    setShowExplanation(true);

    // 记录答案
    const newAnswers = new Map(session.answers);
    newAnswers.set(currentQuestion.id, selectedAnswer);
    setSession({ ...session, answers: newAnswers });

    // 提交到后端
    try {
      const token = localStorage.getItem('token');
      const answerTime = Math.floor((Date.now() - session.startTime) / 1000);

      await fetch(
        `${import.meta.env.VITE_API_URL}/api/adaptive-learning/submit-answer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            knowledgePointId: currentQuestion.knowledge_point_id,
            questionId: currentQuestion.id,
            isCorrect: correct,
            answerTime,
            difficulty: currentQuestion.difficulty,
            answer: selectedAnswer
          })
        }
      );
    } catch (err) {
      console.error('提交答案失败:', err);
    }
  };

  const nextQuestion = () => {
    if (!session) return;

    if (session.currentIndex < session.questions.length - 1) {
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1,
        startTime: Date.now()
      });
      setSelectedAnswer('');
      setShowExplanation(false);
      setIsCorrect(null);
    } else {
      // 练习完成
      setPracticeComplete(true);
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  const calculateScore = () => {
    if (!session) return { correct: 0, total: 0, percentage: 0 };

    let correct = 0;
    session.questions.forEach(q => {
      const answer = session.answers.get(q.id);
      if (answer === q.correct_answer) {
        correct++;
      }
    });

    return {
      correct,
      total: session.questions.length,
      percentage: Math.round((correct / session.questions.length) * 100)
    };
  };

  if (loading) {
    return (
      <div className="practice-page">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>练习</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载练习题...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="practice-page">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>练习</h1>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={startPractice} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (practiceComplete) {
    const score = calculateScore();
    return (
      <div className="practice-page">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>练习完成</h1>
        </div>

        <div className="completion-card">
          <div className="completion-icon">
            {score.percentage >= 80 ? '🎉' : score.percentage >= 60 ? '👍' : '💪'}
          </div>
          <h2>
            {score.percentage >= 80 ? '太棒了!' :
             score.percentage >= 60 ? '不错哦!' : '继续加油!'}
          </h2>
          <p className="score-text">
            本次练习得分: <span className="score-value">{score.percentage}分</span>
          </p>
          <p className="score-detail">
            答对 {score.correct} 题,共 {score.total} 题
          </p>

          <div className="completion-stats">
            <div className="stat-item">
              <span className="stat-label">正确率</span>
              <span className="stat-value" style={{
                color: score.percentage >= 80 ? '#67C23A' :
                       score.percentage >= 60 ? '#E6A23C' : '#F56C6C'
              }}>
                {score.percentage}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">练习时长</span>
              <span className="stat-value">
                {Math.floor((Date.now() - session.startTime) / 60000)}分钟
              </span>
            </div>
          </div>

          <div className="completion-actions">
            <button
              className="primary-button"
              onClick={() => navigate('/weak-point-diagnosis')}
            >
              查看薄弱点分析
            </button>
            <button
              className="secondary-button"
              onClick={startPractice}
            >
              再练一组
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.questions.length) * 100;

  return (
    <div className="practice-page">
      {/* 页面头部 */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>练习</h1>
      </div>

      {/* 进度条 */}
      <div className="progress-section">
        <div className="progress-info">
          <span>题目 {session.currentIndex + 1} / {session.questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* 题目卡片 */}
      <div className="question-card">
        <div className="question-header">
          <span className="knowledge-tag">📚 {session.knowledgePointName || '练习'}</span>
          <span className="difficulty-tag">
            {getDifficultyStars(currentQuestion.difficulty)}
          </span>
        </div>

        <div className="question-content">
          <h2>{currentQuestion.question_text}</h2>
          {currentQuestion.question_image && (
            <img src={currentQuestion.question_image} alt="题目图片" className="question-image" />
          )}
        </div>

        {/* 选项 - 仅单选和多选题显示 */}
        {(currentQuestion.question_type === 'single_choice' || currentQuestion.question_type === 'multiple_choice') && currentQuestion.options && (
          <div className="options-list">
            {currentQuestion.options.map((option, index) => (
              <button
                key={option.id}
                className={`option-button ${
                  selectedAnswer === option.option_text ? 'selected' : ''
                } ${
                  showExplanation
                    ? option.option_text === currentQuestion.correct_answer
                      ? 'correct'
                      : option.option_text === selectedAnswer
                      ? 'wrong'
                      : ''
                    : ''
                }`}
                onClick={() => !showExplanation && setSelectedAnswer(option.option_text)}
                disabled={showExplanation}
              >
                <span className="option-label">{option.option_label}</span>
                <span className="option-text">{option.option_text}</span>
                {showExplanation && option.option_text === currentQuestion.correct_answer && (
                  <span className="check-icon">✓</span>
                )}
                {showExplanation && option.option_text === selectedAnswer && option.option_text !== currentQuestion.correct_answer && (
                  <span className="check-icon">✗</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 填空题输入框 */}
        {currentQuestion.question_type === 'fill_blank' && !showExplanation && (
          <div className="fill-blank-input">
            <input
              type="text"
              placeholder="请输入答案"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              className="answer-input"
            />
          </div>
        )}

        {/* 判断题 */}
        {currentQuestion.question_type === 'true_false' && (
          <div className="options-list">
            {['true', 'false'].map((value) => (
              <button
                key={value}
                className={`option-button ${
                  selectedAnswer === value ? 'selected' : ''
                } ${
                  showExplanation
                    ? value === currentQuestion.correct_answer
                      ? 'correct'
                      : value === selectedAnswer
                      ? 'wrong'
                      : ''
                    : ''
                }`}
                onClick={() => !showExplanation && setSelectedAnswer(value)}
                disabled={showExplanation}
              >
                <span className="option-text">{value === 'true' ? '正确 ✓' : '错误 ✗'}</span>
                {showExplanation && value === currentQuestion.correct_answer && (
                  <span className="check-icon">✓</span>
                )}
                {showExplanation && value === selectedAnswer && value !== currentQuestion.correct_answer && (
                  <span className="check-icon">✗</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 解析 */}
        {showExplanation && (
          <div className={`explanation ${isCorrect ? 'correct' : 'wrong'}`}>
            <div className="explanation-header">
              {isCorrect ? (
                <><span className="icon">✅</span> 回答正确!</>
              ) : (
                <><span className="icon">❌</span> 回答错误</>
              )}
            </div>
            <p className="explanation-text">{currentQuestion.explanation}</p>
            {!isCorrect && (
              <p className="correct-answer-hint">
                正确答案: <strong>{currentQuestion.correct_answer}</strong>
              </p>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="action-buttons">
          {!showExplanation ? (
            <button
              className="submit-button"
              onClick={submitAnswer}
              disabled={!selectedAnswer}
            >
              提交答案
            </button>
          ) : (
            <button className="next-button" onClick={nextQuestion}>
              {session.currentIndex < session.questions.length - 1
                ? '下一题 →'
                : '完成练习'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Practice;
