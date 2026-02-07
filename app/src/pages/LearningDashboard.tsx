import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Header } from '../components/layout';
import './LearningDashboard.css';

interface SubjectDistribution {
  subject: string;
  time: number;
  percentage: number;
  color: string;
}

interface EfficiencyTrend {
  date: string;
  efficiency: number;
}

interface KnowledgeMastery {
  subject: string;
  mastery: number;
}

interface DashboardData {
  totalTime: number;
  totalDays: number;
  continuousDays: number;
  subjectDistribution: SubjectDistribution[];
  efficiencyTrend: EfficiencyTrend[];
  knowledgeMastery: KnowledgeMastery[];
}

const LearningDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 模拟数据 - 实际应该从API获取
      const mockData: DashboardData = {
        totalTime: 1250, // 分钟
        totalDays: 45,
        continuousDays: 7,
        subjectDistribution: [
          { subject: '数学', time: 450, percentage: 36, color: '#667eea' },
          { subject: '语文', time: 350, percentage: 28, color: '#f093fb' },
          { subject: '英语', time: 250, percentage: 20, color: '#4facfe' },
          { subject: '科学', time: 200, percentage: 16, color: '#43e97b' }
        ],
        efficiencyTrend: [
          { date: '周一', efficiency: 75 },
          { date: '周二', efficiency: 82 },
          { date: '周三', efficiency: 78 },
          { date: '周四', efficiency: 85 },
          { date: '周五', efficiency: 88 },
          { date: '周六', efficiency: 92 },
          { date: '周日', efficiency: 90 }
        ],
        knowledgeMastery: [
          { subject: '数学', mastery: 85 },
          { subject: '语文', mastery: 78 },
          { subject: '英语', mastery: 82 },
          { subject: '科学', mastery: 75 },
          { subject: '编程', mastery: 70 }
        ]
      };

      setDashboardData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins}分钟`;
  };

  if (loading) {
    return (
      <Layout>
        <Header title="学习进度" showBack={true} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout>
        <Header title="学习进度" showBack={true} />
        <div className="error-container">
          <p>加载数据失败</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="学习进度" showBack={true} />
      <div className="main-content">
        {/* 总览卡片 */}
        <div className="overview-cards">
          <div className="overview-card">
            <div className="card-icon">⏱️</div>
            <div className="card-content">
              <div className="card-label">总学习时长</div>
              <div className="card-value">{formatTime(dashboardData.totalTime)}</div>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <div className="card-label">学习天数</div>
              <div className="card-value">{dashboardData.totalDays}天</div>
            </div>
          </div>
          <div className="overview-card">
            <div className="card-icon">🔥</div>
            <div className="card-content">
              <div className="card-label">连续学习</div>
              <div className="card-value">{dashboardData.continuousDays}天</div>
            </div>
          </div>
        </div>

        {/* 科目分布 */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>科目学习分布</h3>
          </div>
          <div className="subject-distribution">
            <div className="pie-chart">
              {dashboardData.subjectDistribution.map((item, index) => {
                const startAngle = dashboardData.subjectDistribution
                  .slice(0, index)
                  .reduce((sum, s) => sum + (s.percentage * 3.6), 0);
                const endAngle = startAngle + (item.percentage * 3.6);

                return (
                  <div
                    key={item.subject}
                    className="pie-slice"
                    style={{
                      background: `conic-gradient(${item.color} ${startAngle}deg ${endAngle}deg, transparent ${endAngle}deg)`
                    }}
                  />
                );
              })}
            </div>
            <div className="distribution-legend">
              {dashboardData.subjectDistribution.map(item => (
                <div key={item.subject} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                  <div className="legend-info">
                    <span className="legend-subject">{item.subject}</span>
                    <span className="legend-time">{formatTime(item.time)}</span>
                    <span className="legend-percentage">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 学习效率趋势 */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>本周学习效率</h3>
          </div>
          <div className="efficiency-chart">
            {dashboardData.efficiencyTrend.map((item, index) => (
              <div key={index} className="chart-bar">
                <div className="bar-container">
                  <div
                    className="bar-fill"
                    style={{ height: `${item.efficiency}%` }}
                  >
                    <span className="bar-value">{item.efficiency}%</span>
                  </div>
                </div>
                <div className="bar-label">{item.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 知识点掌握度 */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>知识点掌握度</h3>
          </div>
          <div className="mastery-chart">
            {dashboardData.knowledgeMastery.map(item => (
              <div key={item.subject} className="mastery-item">
                <div className="mastery-label">{item.subject}</div>
                <div className="mastery-bar">
                  <div
                    className="mastery-fill"
                    style={{ width: `${item.mastery}%` }}
                  >
                    <span className="mastery-value">{item.mastery}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="quick-actions">
          <button className="action-btn" onClick={() => navigate('/learning-calendar')}>
            <span className="btn-icon">📅</span>
            <span className="btn-text">学习日历</span>
          </button>
          <button className="action-btn" onClick={() => navigate('/learning-report')}>
            <span className="btn-icon">📊</span>
            <span className="btn-text">学习报告</span>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default LearningDashboard;
