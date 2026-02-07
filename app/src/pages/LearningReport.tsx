import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Header } from '../components/layout';
import './LearningReport.css';

type ReportPeriod = 'week' | 'month';

interface ReportData {
  period: string;
  totalTime: number;
  totalDays: number;
  subjects: {
    name: string;
    time: number;
    progress: number;
    improvement: number;
  }[];
  achievements: string[];
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
}

const LearningReport: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [period]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // 模拟数据 - 实际应该从API获取
      const mockData: ReportData = {
        period: period === 'week' ? '本周' : '本月',
        totalTime: period === 'week' ? 850 : 3200,
        totalDays: period === 'week' ? 6 : 24,
        subjects: [
          { name: '数学', time: 320, progress: 85, improvement: 12 },
          { name: '语文', time: 280, progress: 78, improvement: 8 },
          { name: '英语', time: 150, progress: 82, improvement: -3 },
          { name: '科学', time: 100, progress: 75, improvement: 15 }
        ],
        achievements: [
          '连续学习6天',
          '完成数学单元测试',
          '英语词汇量提升50个',
          '科学实验报告获得优秀'
        ],
        suggestions: [
          '建议增加英语口语练习时间',
          '数学应用题需要加强',
          '保持良好的学习习惯',
          '可以尝试更多科学实验'
        ],
        strengths: [
          '数学逻辑思维能力强',
          '学习态度认真',
          '能够坚持每日学习'
        ],
        weaknesses: [
          '英语听力需要加强',
          '语文阅读理解有待提高'
        ]
      };

      setTimeout(() => {
        setReportData(mockData);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('加载报告数据失败:', error);
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
        <Header title="学习报告" showBack={true} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>生成报告中...</p>
        </div>
      </Layout>
    );
  }

  if (!reportData) {
    return (
      <Layout>
        <Header title="学习报告" showBack={true} />
        <div className="error-container">
          <p>加载报告失败</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="学习报告" showBack={true} />
      <div className="main-content">
        {/* 周期选择 */}
        <div className="period-selector">
          <button
            className={`period-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            周报告
          </button>
          <button
            className={`period-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            月报告
          </button>
        </div>

        {/* 报告标题 */}
        <div className="report-header">
          <h2>{reportData.period}学习报告</h2>
          <p className="report-date">{new Date().toLocaleDateString('zh-CN')}</p>
        </div>

        {/* 总览 */}
        <div className="report-section">
          <h3 className="section-title">📊 学习总览</h3>
          <div className="overview-grid">
            <div className="overview-item">
              <div className="overview-label">总学习时长</div>
              <div className="overview-value">{formatTime(reportData.totalTime)}</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">学习天数</div>
              <div className="overview-value">{reportData.totalDays}天</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">日均时长</div>
              <div className="overview-value">
                {formatTime(Math.floor(reportData.totalTime / reportData.totalDays))}
              </div>
            </div>
          </div>
        </div>

        {/* 科目分析 */}
        <div className="report-section">
          <h3 className="section-title">📚 科目分析</h3>
          <div className="subjects-list">
            {reportData.subjects.map(subject => (
              <div key={subject.name} className="subject-card">
                <div className="subject-header">
                  <span className="subject-name">{subject.name}</span>
                  <span className="subject-time">{formatTime(subject.time)}</span>
                </div>
                <div className="subject-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${subject.progress}%` }}
                    >
                      <span className="progress-text">{subject.progress}%</span>
                    </div>
                  </div>
                </div>
                <div className="subject-improvement">
                  <span className={`improvement ${subject.improvement >= 0 ? 'positive' : 'negative'}`}>
                    {subject.improvement >= 0 ? '↑' : '↓'} {Math.abs(subject.improvement)}%
                  </span>
                  <span className="improvement-label">
                    {subject.improvement >= 0 ? '进步' : '需加强'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 成就 */}
        <div className="report-section">
          <h3 className="section-title">🏆 本期成就</h3>
          <div className="achievements-list">
            {reportData.achievements.map((achievement, index) => (
              <div key={index} className="achievement-item">
                <span className="achievement-icon">✓</span>
                <span className="achievement-text">{achievement}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 优势与不足 */}
        <div className="report-section">
          <h3 className="section-title">💪 优势与不足</h3>
          <div className="strengths-weaknesses">
            <div className="sw-column">
              <h4 className="sw-title">优势</h4>
              <ul className="sw-list">
                {reportData.strengths.map((item, index) => (
                  <li key={index} className="sw-item positive">{item}</li>
                ))}
              </ul>
            </div>
            <div className="sw-column">
              <h4 className="sw-title">需改进</h4>
              <ul className="sw-list">
                {reportData.weaknesses.map((item, index) => (
                  <li key={index} className="sw-item negative">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 学习建议 */}
        <div className="report-section">
          <h3 className="section-title">💡 学习建议</h3>
          <div className="suggestions-list">
            {reportData.suggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                <span className="suggestion-number">{index + 1}</span>
                <span className="suggestion-text">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="report-actions">
          <button className="action-button primary" onClick={() => window.print()}>
            打印报告
          </button>
          <button className="action-button secondary" onClick={() => navigate('/learning-dashboard')}>
            返回仪表盘
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default LearningReport;
