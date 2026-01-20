import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeworkHistory.css';

interface Question {
  id: string;
  image_url: string;
  ocr_text: string;
  question_type: string;
  subject: string;
  status: string;
  created_at: string;
  answer_text?: string;
  answer_id?: string;
}

const HomeworkHistory: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'answered' | 'pending'>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  // 加载历史记录
  const loadHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/homework/history?page=1&limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setQuestions(data.data.questions);
      } else {
        alert(data.message || '加载失败');
      }
    } catch (error) {
      console.error('加载历史失败:', error);
      alert('加载失败,请重试');
    } finally {
      setLoading(false);
    }
  };

  // 查看详情
  const viewAnswer = (question: Question) => {
    if (question.status === 'answered' && question.answer_id) {
      navigate(`/homework/answer/${question.id}`, {
        state: {
          questionId: question.id,
          ocrText: question.ocr_text,
          image: `http://localhost:3000${question.image_url}`,
        },
      });
    } else {
      // 重新获取解答
      navigate(`/homework/answer/${question.id}`, {
        state: {
          questionId: question.id,
          ocrText: question.ocr_text,
          image: `http://localhost:3000${question.image_url}`,
        },
      });
    }
  };

  // 筛选题目
  const filteredQuestions = questions.filter(q => {
    if (filter === 'all') return true;
    if (filter === 'answered') return q.status === 'answered';
    if (filter === 'pending') return q.status === 'pending';
    return true;
  });

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      if (hours < 1) return '刚刚';
      return `${hours}小时前`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;

    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="history-container">
      {/* 头部导航 */}
      <header className="history-header">
        <button className="back-button" onClick={() => navigate('/homework')}>
          <span className="icon">←</span>
        </button>
        <h1 className="page-title">历史记录</h1>
        <div style={{ width: '40px' }}></div>
      </header>

      {/* 筛选器 */}
      <div className="filter-section">
        <button
          className={`filter-tag ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部 ({questions.length})
        </button>
        <button
          className={`filter-tag ${filter === 'answered' ? 'active' : ''}`}
          onClick={() => setFilter('answered')}
        >
          已解答 ({questions.filter(q => q.status === 'answered').length})
        </button>
        <button
          className={`filter-tag ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          待解答 ({questions.filter(q => q.status === 'pending').length})
        </button>
      </div>

      {/* 题目列表 */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无记录</p>
          <button className="start-btn" onClick={() => navigate('/homework')}>
            开始搜题
          </button>
        </div>
      ) : (
        <div className="questions-list">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="question-card"
              onClick={() => viewAnswer(question)}
            >
              <div className="question-image">
                <img
                  src={`http://localhost:3000${question.image_url}`}
                  alt="题目"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                  }}
                />
                {question.status === 'answered' && (
                  <div className="answered-badge">✓ 已解答</div>
                )}
              </div>
              <div className="question-info">
                <div className="question-text">
                  {question.ocr_text?.substring(0, 100)}
                  {question.ocr_text?.length > 100 ? '...' : ''}
                </div>
                <div className="question-meta">
                  <span className="subject-tag">{question.subject}</span>
                  <span className="time-tag">{formatDate(question.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeworkHistory;
