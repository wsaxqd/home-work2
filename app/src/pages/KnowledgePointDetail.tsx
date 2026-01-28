import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './KnowledgePointDetail.css';

interface KnowledgePoint {
  knowledgePointId: string;
  knowledgePointName: string;
  subject: string;
  grade: string;
  description: string;
  difficulty: number;
  prerequisites?: {
    id: string;
    name: string;
  }[];
  dependents?: {
    id: string;
    name: string;
  }[];
  userMastery?: {
    masteryLevel: number;
    accuracyRate: number;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    lastPracticeAt: string;
  };
  resources?: {
    videos?: string[];
    articles?: string[];
    games?: string[];
  };
  relatedQuestions?: number;
}

function KnowledgePointDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KnowledgePoint | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchKnowledgePoint();
    }
  }, [id]);

  const fetchKnowledgePoint = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/adaptive-learning/knowledge-point/${id}`,
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
        setError(result.message || '获取知识点详情失败');
      }
    } catch (err) {
      console.error('获取知识点详情失败:', err);
      setError('网络错误,请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (level: number) => {
    if (level >= 4) return '#67C23A';
    if (level >= 3) return '#409EFF';
    if (level >= 2) return '#E6A23C';
    if (level >= 1) return '#F56C6C';
    return '#909399';
  };

  const getMasteryText = (level: number) => {
    if (level >= 4) return '精通';
    if (level >= 3) return '熟练';
    if (level >= 2) return '一般';
    if (level >= 1) return '薄弱';
    return '未学习';
  };

  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  const startPractice = () => {
    // 跳转到练习页面
    navigate(`/practice?knowledgePoint=${id}`);
  };

  const generateLearningPath = async () => {
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
            subject: data?.subject,
            grade: data?.grade,
            goal: 'master_specific_point',
            focusKnowledgePoint: id,
            timeConstraint: 7,
            dailyTimeLimit: 30
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        navigate(`/learning-path/${result.data.pathId}`);
      }
    } catch (err) {
      console.error('生成学习路径失败:', err);
      alert('生成学习路径失败,请稍后重试');
    }
  };

  if (loading) {
    return (
      <div className="knowledge-point-detail">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>知识点详情</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载知识点详情...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="knowledge-point-detail">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>知识点详情</h1>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchKnowledgePoint} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="knowledge-point-detail">
      {/* 页面头部 */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>知识点详情</h1>
      </div>

      {/* 知识点基本信息 */}
      <div className="info-card">
        <div className="info-header">
          <h2>📚 {data.knowledgePointName}</h2>
          <span className="subject-tag">
            {data.subject === 'math' ? '数学' :
             data.subject === 'chinese' ? '语文' : '英语'}
          </span>
        </div>

        <div className="info-meta">
          <div className="meta-item">
            <span className="meta-label">年级</span>
            <span className="meta-value">{data.grade.replace('grade_', '')}年级</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">难度</span>
            <span className="meta-value">{getDifficultyStars(data.difficulty)}</span>
          </div>
        </div>

        <div className="description">
          <h3>📝 知识点说明</h3>
          <p>{data.description}</p>
        </div>
      </div>

      {/* 学习进度卡片 */}
      {data.userMastery && (
        <div className="mastery-card">
          <h3>📊 我的学习进度</h3>

          <div className="mastery-level">
            <div className="level-info">
              <span className="level-label">掌握度</span>
              <span
                className="level-value"
                style={{ color: getMasteryColor(data.userMastery.masteryLevel) }}
              >
                {getMasteryText(data.userMastery.masteryLevel)}
              </span>
            </div>
            <div className="level-bar">
              <div
                className="level-fill"
                style={{
                  width: `${(data.userMastery.masteryLevel / 5) * 100}%`,
                  backgroundColor: getMasteryColor(data.userMastery.masteryLevel)
                }}
              ></div>
            </div>
          </div>

          <div className="mastery-stats">
            <div className="stat-item">
              <span className="stat-label">正确率</span>
              <span className="stat-value">{data.userMastery.accuracyRate.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">已做题目</span>
              <span className="stat-value">{data.userMastery.totalQuestions}题</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">做对</span>
              <span className="stat-value" style={{ color: '#67C23A' }}>
                {data.userMastery.correctCount}题
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">做错</span>
              <span className="stat-value" style={{ color: '#F56C6C' }}>
                {data.userMastery.wrongCount}题
              </span>
            </div>
          </div>

          {data.userMastery.lastPracticeAt && (
            <div className="last-practice">
              上次练习: {new Date(data.userMastery.lastPracticeAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* 知识关系图 */}
      {(data.prerequisites && data.prerequisites.length > 0) && (
        <div className="relations-card">
          <h3>🔗 前置知识点</h3>
          <p className="hint">需要先掌握以下知识点:</p>
          <div className="knowledge-list">
            {data.prerequisites.map(prereq => (
              <button
                key={prereq.id}
                className="knowledge-item"
                onClick={() => navigate(`/knowledge-point/${prereq.id}`)}
              >
                {prereq.name}
                <span className="arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(data.dependents && data.dependents.length > 0) && (
        <div className="relations-card">
          <h3>🚀 后续知识点</h3>
          <p className="hint">掌握本知识点后,可以学习:</p>
          <div className="knowledge-list">
            {data.dependents.map(dep => (
              <button
                key={dep.id}
                className="knowledge-item"
                onClick={() => navigate(`/knowledge-point/${dep.id}`)}
              >
                {dep.name}
                <span className="arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 学习资源 */}
      {data.resources && (
        <div className="resources-card">
          <h3>📚 学习资源</h3>

          {data.resources.videos && data.resources.videos.length > 0 && (
            <div className="resource-section">
              <h4>📹 视频教程</h4>
              <div className="resource-list">
                {data.resources.videos.map((video, idx) => (
                  <div key={idx} className="resource-item">
                    <span className="resource-icon">▶️</span>
                    <span className="resource-name">{video}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.resources.articles && data.resources.articles.length > 0 && (
            <div className="resource-section">
              <h4>📄 学习资料</h4>
              <div className="resource-list">
                {data.resources.articles.map((article, idx) => (
                  <div key={idx} className="resource-item">
                    <span className="resource-icon">📖</span>
                    <span className="resource-name">{article}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.resources.games && data.resources.games.length > 0 && (
            <div className="resource-section">
              <h4>🎮 趣味游戏</h4>
              <div className="resource-list">
                {data.resources.games.map((game, idx) => (
                  <div key={idx} className="resource-item">
                    <span className="resource-icon">🎯</span>
                    <span className="resource-name">{game}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 练习题信息 */}
      {data.relatedQuestions !== undefined && data.relatedQuestions > 0 && (
        <div className="practice-info-card">
          <div className="practice-icon">✏️</div>
          <div className="practice-content">
            <h3>相关练习题</h3>
            <p>共有 {data.relatedQuestions} 道题目可供练习</p>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="action-buttons">
        <button className="primary-button" onClick={startPractice}>
          🎯 开始练习
        </button>
        <button className="secondary-button" onClick={generateLearningPath}>
          📖 生成学习路径
        </button>
      </div>
    </div>
  );
}

export default KnowledgePointDetail;
