import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WeakPointDiagnosis.css';

interface WeakPoint {
  knowledgePointId: string;
  knowledgePointName: string;
  subject: string;
  grade: string;
  masteryLevel: number;
  accuracyRate: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  repeatedErrors: number;
  avgAnswerTime: number;
  lastPracticeAt: string;
  severity: 'high' | 'medium' | 'low';
  reason: string;
}

interface WeakPointsData {
  weakPoints: WeakPoint[];
  summary: {
    totalWeakPoints: number;
    mostUrgent: string | null;
    estimatedImprovementDays: number;
  };
}

function WeakPointDiagnosis() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeakPointsData | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchWeakPoints();
  }, [selectedSubject]);

  const fetchWeakPoints = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const url = selectedSubject === 'all'
        ? `${import.meta.env.VITE_API_URL}/api/adaptive-learning/weak-points`
        : `${import.meta.env.VITE_API_URL}/api/adaptive-learning/weak-points?subject=${selectedSubject}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || '获取薄弱点失败');
      }
    } catch (err) {
      console.error('获取薄弱点失败:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#F56C6C';
      case 'medium':
        return '#E6A23C';
      case 'low':
        return '#67C23A';
      default:
        return '#909399';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high':
        return '严重';
      case 'medium':
        return '中等';
      case 'low':
        return '轻度';
      default:
        return '未知';
    }
  };

  const getMasteryColor = (level: number) => {
    if (level >= 4) return '#67C23A';
    if (level >= 3) return '#409EFF';
    if (level >= 2) return '#E6A23C';
    if (level >= 1) return '#F56C6C';
    return '#909399';
  };

  const startPractice = async (weakPoint: WeakPoint) => {
    // TODO: 跳转到针对性练习页面
    // 或者生成个性化学习路径
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/adaptive-learning/generate-path`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            subject: weakPoint.subject,
            grade: weakPoint.grade,
            goal: 'improve_weak_points',
            timeConstraint: 7,
            dailyTimeLimit: 30
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        // 跳转到学习路径页面
        navigate(`/learning-path/${result.data.pathId}`);
      }
    } catch (err) {
      console.error('生成学习路径失败:', err);
      alert('生成学习路径失败，请稍后重试');
    }
  };

  if (loading) {
    return (
      <div className="weak-point-diagnosis">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>薄弱点诊断中心</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在分析学习数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weak-point-diagnosis">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>薄弱点诊断中心</h1>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchWeakPoints} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.weakPoints.length === 0) {
    return (
      <div className="weak-point-diagnosis">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>薄弱点诊断中心</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h2>太棒了！</h2>
          <p>目前没有发现薄弱知识点</p>
          <p className="hint">继续保持，多做练习题可以获得更全面的分析</p>
          <button onClick={() => navigate('/learning-map')} className="go-practice-button">
            去做题
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="weak-point-diagnosis">
      {/* 页面头部 */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>薄弱点诊断中心</h1>
        <div className="subject-filter">
          <button
            className={selectedSubject === 'all' ? 'active' : ''}
            onClick={() => setSelectedSubject('all')}
          >
            全学科
          </button>
          <button
            className={selectedSubject === 'math' ? 'active' : ''}
            onClick={() => setSelectedSubject('math')}
          >
            数学
          </button>
          <button
            className={selectedSubject === 'chinese' ? 'active' : ''}
            onClick={() => setSelectedSubject('chinese')}
          >
            语文
          </button>
          <button
            className={selectedSubject === 'english' ? 'active' : ''}
            onClick={() => setSelectedSubject('english')}
          >
            英语
          </button>
        </div>
      </div>

      {/* 摘要卡片 */}
      <div className="summary-card">
        <div className="summary-icon">🎯</div>
        <div className="summary-content">
          <h2>发现 {data.summary.totalWeakPoints} 个薄弱知识点</h2>
          <p>预计改善时间：约 {data.summary.estimatedImprovementDays} 天</p>
        </div>
      </div>

      {/* 薄弱点列表 */}
      <div className="weak-points-list">
        {data.weakPoints.map((weakPoint, index) => (
          <div
            key={weakPoint.knowledgePointId}
            className="weak-point-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* 严重程度标记 */}
            <div
              className="severity-badge"
              style={{ backgroundColor: getSeverityColor(weakPoint.severity) }}
            >
              ⚠️ {getSeverityText(weakPoint.severity)}
            </div>

            {/* 知识点信息 */}
            <div className="weak-point-header">
              <h3>{weakPoint.knowledgePointName}</h3>
              <span className="subject-tag">
                {weakPoint.subject === 'math' ? '数学' :
                 weakPoint.subject === 'chinese' ? '语文' : '英语'}
              </span>
            </div>

            {/* 数据统计 */}
            <div className="weak-point-stats">
              <div className="stat-item">
                <div className="stat-label">掌握度</div>
                <div className="stat-value">
                  <div className="mastery-bar">
                    <div
                      className="mastery-fill"
                      style={{
                        width: `${(weakPoint.masteryLevel / 5) * 100}%`,
                        backgroundColor: getMasteryColor(weakPoint.masteryLevel)
                      }}
                    ></div>
                  </div>
                  <span>{weakPoint.masteryLevel}/5</span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-label">正确率</div>
                <div className="stat-value" style={{ color: getSeverityColor(weakPoint.severity) }}>
                  {weakPoint.accuracyRate.toFixed(1)}%
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-label">已做题目</div>
                <div className="stat-value">
                  {weakPoint.totalQuestions}题
                  <span className="stat-detail">
                    （对{weakPoint.correctCount}错{weakPoint.wrongCount}）
                  </span>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-label">重复错误</div>
                <div className="stat-value" style={{ color: '#F56C6C' }}>
                  {weakPoint.repeatedErrors}次
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-label">平均用时</div>
                <div className="stat-value">
                  {weakPoint.avgAnswerTime}秒
                </div>
              </div>
            </div>

            {/* 诊断原因 */}
            <div className="diagnosis-section">
              <h4>📋 诊断原因</h4>
              <p className="diagnosis-reason">{weakPoint.reason}</p>
            </div>

            {/* 建议方案 */}
            <div className="suggestions-section">
              <h4>💡 改善建议</h4>
              <ul className="suggestions-list">
                <li>观看教学视频，巩固基础概念</li>
                <li>完成10道专项练习题</li>
                <li>使用游戏化学习工具加深记忆</li>
                {weakPoint.repeatedErrors >= 3 && (
                  <li style={{ color: '#F56C6C' }}>
                    重复错误较多，建议先复习前置知识点
                  </li>
                )}
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="action-buttons">
              <button
                className="primary-button"
                onClick={() => startPractice(weakPoint)}
              >
                🎯 开始强化
              </button>
              <button
                className="secondary-button"
                onClick={() => navigate(`/knowledge-point/${weakPoint.knowledgePointId}`)}
              >
                📊 查看详情
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="bottom-tip">
        <p>💪 坚持每天练习，薄弱点会逐渐消失的！</p>
      </div>
    </div>
  );
}

export default WeakPointDiagnosis;
