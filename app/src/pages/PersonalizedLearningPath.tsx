import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PersonalizedLearningPath.css';

interface LearningStep {
  stepNumber: number;
  knowledgePointId: string;
  knowledgePointName: string;
  status: 'completed' | 'in_progress' | 'locked';
  userMastery?: {
    masteryLevel: number;
    accuracyRate: number;
    totalQuestions: number;
  };
  reason?: string;
  estimatedMinutes?: number;
  resources?: {
    videos?: string[];
    questions?: number[];
    games?: string[];
  };
}

interface LearningPathData {
  pathId: number;
  pathName: string;
  subject: string;
  grade: string;
  currentStep: number;
  totalSteps: number;
  progress: number;
  status: string;
  estimatedDays: number;
  steps: LearningStep[];
}

function PersonalizedLearningPath() {
  const navigate = useNavigate();
  const { pathId } = useParams<{ pathId: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LearningPathData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (pathId) {
      fetchLearningPath();
    }
  }, [pathId]);

  const fetchLearningPath = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/adaptive-learning/learning-path/${pathId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || '获取学习路径失败');
      }
    } catch (err) {
      console.error('获取学习路径失败:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (completedStep: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/adaptive-learning/learning-path/${pathId}/progress`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ completedStep })
        }
      );

      const result = await response.json();

      if (result.success) {
        // 刷新数据
        fetchLearningPath();
      }
    } catch (err) {
      console.error('更新进度失败:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '▶️';
      case 'locked':
        return '🔒';
      default:
        return '⭕';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#67C23A';
      case 'in_progress':
        return '#409EFF';
      case 'locked':
        return '#909399';
      default:
        return '#C0C4CC';
    }
  };

  const continueStep = (step: LearningStep) => {
    navigate(`/learning/practice/${step.id}`)
  };

  if (loading) {
    return (
      <div className="learning-path-page">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>我的学习路径</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载学习路径...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="learning-path-page">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>我的学习路径</h1>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchLearningPath} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const currentStepData = data.steps.find(s => s.status === 'in_progress');

  return (
    <div className="learning-path-page">
      {/* 页面头部 */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>我的学习路径</h1>
      </div>

      {/* 路径概览卡片 */}
      <div className="path-overview-card">
        <div className="path-title">
          <h2>📚 {data.pathName}</h2>
          <span className="subject-tag">
            {data.subject === 'math' ? '数学' :
             data.subject === 'chinese' ? '语文' : '英语'}
          </span>
        </div>

        <div className="progress-section">
          <div className="progress-text">
            <span>进度: {data.progress}%</span>
            <span>第{data.currentStep}步 / 共{data.totalSteps}步</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${data.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="path-stats">
          <div className="stat-item">
            <span className="stat-label">预计完成</span>
            <span className="stat-value">还需 {data.estimatedDays - Math.floor(data.progress / 100 * data.estimatedDays)} 天</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">状态</span>
            <span className="stat-value">
              {data.status === 'active' ? '进行中' :
               data.status === 'completed' ? '已完成' : '已暂停'}
            </span>
          </div>
        </div>
      </div>

      {/* 当前步骤详情 */}
      {currentStepData && (
        <div className="current-step-card">
          <div className="current-step-header">
            <span className="step-badge">当前步骤</span>
            <h3>第{currentStepData.stepNumber}步: {currentStepData.knowledgePointName}</h3>
          </div>

          <div className="step-info">
            <div className="info-item">
              <span className="icon">📖</span>
              <span>学习内容: {currentStepData.knowledgePointName}</span>
            </div>
            <div className="info-item">
              <span className="icon">🎯</span>
              <span>学习目标: 掌握该知识点核心概念</span>
            </div>
            {currentStepData.estimatedMinutes && (
              <div className="info-item">
                <span className="icon">⏱️</span>
                <span>预计时长: {currentStepData.estimatedMinutes}分钟</span>
              </div>
            )}
          </div>

          {currentStepData.resources && (
            <div className="resources-section">
              <h4>📚 学习资源</h4>
              <div className="resources-list">
                {currentStepData.resources.videos && currentStepData.resources.videos.length > 0 && (
                  <div className="resource-group">
                    <div className="resource-icon">📹</div>
                    <div className="resource-content">
                      <span className="resource-label">视频教程</span>
                      {currentStepData.resources.videos.map((video, idx) => (
                        <span key={idx} className="resource-item">{video}</span>
                      ))}
                    </div>
                  </div>
                )}

                {currentStepData.resources.questions && currentStepData.resources.questions.length > 0 && (
                  <div className="resource-group">
                    <div className="resource-icon">✏️</div>
                    <div className="resource-content">
                      <span className="resource-label">练习题目</span>
                      <span className="resource-item">{currentStepData.resources.questions.length}道题</span>
                    </div>
                  </div>
                )}

                {currentStepData.resources.games && currentStepData.resources.games.length > 0 && (
                  <div className="resource-group">
                    <div className="resource-icon">🎮</div>
                    <div className="resource-content">
                      <span className="resource-label">趣味游戏</span>
                      {currentStepData.resources.games.map((game, idx) => (
                        <span key={idx} className="resource-item">{game}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            className="continue-button"
            onClick={() => continueStep(currentStepData)}
          >
            继续学习 →
          </button>
        </div>
      )}

      {/* 学习路径时间线 */}
      <div className="timeline-section">
        <h3 className="timeline-title">学习路径</h3>

        <div className="timeline">
          {data.steps.map((step, index) => (
            <div
              key={step.stepNumber}
              className={`timeline-item ${step.status}`}
            >
              <div className="timeline-marker">
                <div
                  className="marker-dot"
                  style={{ backgroundColor: getStatusColor(step.status) }}
                >
                  {getStatusIcon(step.status)}
                </div>
                {index < data.steps.length - 1 && (
                  <div
                    className="marker-line"
                    style={{
                      backgroundColor: step.status === 'completed' ? '#67C23A' : '#E4E7ED'
                    }}
                  ></div>
                )}
              </div>

              <div className="timeline-content">
                <div className="step-header">
                  <span className="step-number">第{step.stepNumber}步</span>
                  <span className="step-title">{step.knowledgePointName}</span>
                </div>

                {step.status === 'completed' && step.userMastery && (
                  <div className="step-stats">
                    <span>✓ 已完成</span>
                    <span>掌握度: {step.userMastery.masteryLevel}/5</span>
                    <span>正确率: {step.userMastery.accuracyRate.toFixed(1)}%</span>
                  </div>
                )}

                {step.status === 'in_progress' && (
                  <div className="step-badge-group">
                    <span className="badge-current">进行中</span>
                  </div>
                )}

                {step.status === 'locked' && (
                  <div className="step-locked">
                    <span>🔒 完成上一步后解锁</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="bottom-actions">
        {data.status === 'active' && (
          <button className="pause-button">
            暂停路径
          </button>
        )}
        <button className="adjust-button" onClick={() => navigate('/weak-point-diagnosis')}>
          调整计划
        </button>
      </div>
    </div>
  );
}

export default PersonalizedLearningPath;
