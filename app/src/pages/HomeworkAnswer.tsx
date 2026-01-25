import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast'
import './HomeworkAnswer.css';

interface LocationState {
  questionId: string;
  ocrText: string;
  confidence: number;
  image: string;
}

const HomeworkAnswer: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const state = location.state as LocationState;

  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<any>(null);
  const [showSteps, setShowSteps] = useState(true);

  useEffect(() => {
    if (questionId) {
      getAnswer();
    }
  }, [questionId]);

  // 获取AI解答
  const getAnswer = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/homework/answer/${questionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setAnswer(data.data);
      } else {
        toast.error(data.message || '获取解答失败');
      }
    } catch (error) {
      console.error('获取解答失败:', error);
      toast.error('获取解答失败,请重试');
    } finally {
      setLoading(false);
    }
  };

  // 收藏题目
  const handleFavorite = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/homework/favorite/${questionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: ['重要'],
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('收藏成功!');
      } else {
        toast.error(data.message || '收藏失败');
      }
    } catch (error) {
      console.error('收藏失败:', error);
      toast.error('收藏失败,请重试');
    }
  };

  // 返回
  const goBack = () => {
    navigate('/homework');
  };

  if (loading) {
    return (
      <div className="answer-container">
        <header className="answer-header">
          <button className="back-button" onClick={goBack}>
            <span className="icon">←</span>
          </button>
          <h1 className="page-title">AI解答</h1>
          <div style={{ width: '40px' }}></div>
        </header>
        <div className="loading-spinner">
          <div className="spinner-large"></div>
          <p>AI正在分析题目...</p>
          <p className="loading-tip">请稍候,这可能需要几秒钟</p>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-container">
      {/* 头部导航 */}
      <header className="answer-header">
        <button className="back-button" onClick={goBack}>
          <span className="icon">←</span>
        </button>
        <h1 className="page-title">AI解答</h1>
        <button className="favorite-button" onClick={handleFavorite}>
          <span className="icon">⭐</span>
        </button>
      </header>

      {/* 题目图片 */}
      {state?.image && (
        <div className="question-image-section">
          <img src={state.image} alt="题目" />
          <div className="ocr-confidence-badge">
            识别准确度: {Math.round((state.confidence || 0) * 100)}%
          </div>
        </div>
      )}

      {/* OCR识别文本 */}
      {state?.ocrText && (
        <div className="content-card ocr-text-section">
          <h3 className="section-title">
            <span className="icon">📝</span>
            识别的题目
          </h3>
          <div className="ocr-text">{state.ocrText}</div>
        </div>
      )}

      {/* AI解答 */}
      {answer && (
        <>
          {/* 答案 */}
          <div className="content-card answer-section">
            <h3 className="section-title">
              <span className="icon">💡</span>
              AI解答
            </h3>
            <div className="answer-text">
              {answer.answerText || answer.answer}
            </div>
          </div>

          {/* 解题步骤 */}
          {answer.steps && answer.steps.length > 0 && (
            <div className="content-card steps-section">
              <h3
                className="section-title clickable"
                onClick={() => setShowSteps(!showSteps)}
              >
                <span className="icon">📋</span>
                解题步骤
                <span className="toggle-icon">{showSteps ? '▼' : '▶'}</span>
              </h3>
              {showSteps && (
                <ol className="steps-list">
                  {answer.steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* 知识点 */}
          {answer.knowledgePoints && answer.knowledgePoints.length > 0 && (
            <div className="content-card knowledge-section">
              <h3 className="section-title">
                <span className="icon">🎯</span>
                相关知识点
              </h3>
              <div className="knowledge-tags">
                {answer.knowledgePoints.map((point: string, index: number) => (
                  <span key={index} className="knowledge-tag">{point}</span>
                ))}
              </div>
            </div>
          )}

          {/* 温馨提示 */}
          <div className="content-card tips-section">
            <h3 className="section-title">
              <span className="icon">💝</span>
              学习建议
            </h3>
            <p>理解解题思路比记住答案更重要哦!</p>
            <p>遇到类似的题目,试着自己独立完成</p>
          </div>
        </>
      )}

      {/* 操作按钮 */}
      <div className="answer-actions">
        <button className="action-btn primary-btn" onClick={() => navigate('/homework')}>
          <span className="icon">📸</span>
          继续搜题
        </button>
        <button className="action-btn secondary-btn" onClick={() => navigate('/homework/history')}>
          <span className="icon">📝</span>
          查看历史
        </button>
      </div>
    </div>
  );
};

export default HomeworkAnswer;
