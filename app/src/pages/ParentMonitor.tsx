import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ParentMonitor.css';

interface ChildLearningStatus {
  childId: string;
  childName: string;
  avatar: string;
  isOnline: boolean;
  currentActivity: string;
  todayTime: number; // 分钟
  todaySubjects: string[];
  lastActiveTime: string;
  weeklyProgress: {
    day: string;
    time: number;
  }[];
}

const ParentMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState<ChildLearningStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildrenStatus();
    // 每30秒刷新一次
    const interval = setInterval(loadChildrenStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadChildrenStatus = async () => {
    try {
      // 模拟数据 - 实际应该从API获取
      const mockData: ChildLearningStatus[] = [
        {
          childId: '1',
          childName: '小明',
          avatar: '👦',
          isOnline: true,
          currentActivity: '正在学习数学 - 二次方程',
          todayTime: 85,
          todaySubjects: ['数学', '语文'],
          lastActiveTime: new Date().toISOString(),
          weeklyProgress: [
            { day: '周一', time: 120 },
            { day: '周二', time: 95 },
            { day: '周三', time: 110 },
            { day: '周四', time: 88 },
            { day: '周五', time: 105 },
            { day: '周六', time: 130 },
            { day: '周日', time: 85 }
          ]
        },
        {
          childId: '2',
          childName: '小红',
          avatar: '👧',
          isOnline: false,
          currentActivity: '离线',
          todayTime: 45,
          todaySubjects: ['英语'],
          lastActiveTime: new Date(Date.now() - 3600000).toISOString(),
          weeklyProgress: [
            { day: '周一', time: 90 },
            { day: '周二', time: 75 },
            { day: '周三', time: 85 },
            { day: '周四', time: 70 },
            { day: '周五', time: 95 },
            { day: '周六', time: 100 },
            { day: '周日', time: 45 }
          ]
        }
      ];

      setChildren(mockData);
      setLoading(false);
    } catch (error) {
      console.error('加载孩子状态失败:', error);
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  const formatLastActive = (isoString: string): string => {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diff = Math.floor((now - then) / 60000); // 分钟

    if (diff < 1) return '刚刚';
    if (diff < 60) return `${diff}分钟前`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  if (loading) {
    return (
      <div className="parent-monitor">
        <div className="monitor-header">
          <button className="back-button" onClick={() => navigate('/parent')}>
            ← 返回
          </button>
          <h1>实时学习监控</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-monitor">
      <div className="monitor-header">
        <button className="back-button" onClick={() => navigate('/parent')}>
          ← 返回
        </button>
        <h1>实时学习监控</h1>
        <button className="refresh-button" onClick={loadChildrenStatus}>
          🔄 刷新
        </button>
      </div>

      <div className="monitor-content">
        {children.map(child => (
          <div key={child.childId} className="child-monitor-card">
            {/* 孩子信息头部 */}
            <div className="child-header">
              <div className="child-avatar">{child.avatar}</div>
              <div className="child-info">
                <h3>{child.childName}</h3>
                <div className={`status-badge ${child.isOnline ? 'online' : 'offline'}`}>
                  <span className="status-dot"></span>
                  {child.isOnline ? '在线学习中' : '离线'}
                </div>
              </div>
              <button
                className="detail-button"
                onClick={() => navigate(`/parent/child/${child.childId}/learning-data`)}
              >
                查看详情 →
              </button>
            </div>

            {/* 当前活动 */}
            <div className="current-activity">
              <div className="activity-label">当前活动</div>
              <div className="activity-content">
                {child.isOnline ? (
                  <>
                    <span className="activity-icon">📚</span>
                    <span className="activity-text">{child.currentActivity}</span>
                  </>
                ) : (
                  <>
                    <span className="activity-icon">💤</span>
                    <span className="activity-text">最后活跃: {formatLastActive(child.lastActiveTime)}</span>
                  </>
                )}
              </div>
            </div>

            {/* 今日学习统计 */}
            <div className="today-stats">
              <h4>今日学习</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">学习时长</div>
                  <div className="stat-value">{formatTime(child.todayTime)}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">学习科目</div>
                  <div className="stat-value">
                    {child.todaySubjects.length > 0
                      ? child.todaySubjects.join('、')
                      : '暂无'}
                  </div>
                </div>
              </div>
            </div>

            {/* 本周学习趋势 */}
            <div className="weekly-trend">
              <h4>本周学习趋势</h4>
              <div className="trend-chart">
                {child.weeklyProgress.map((item, index) => (
                  <div key={index} className="trend-bar">
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{ height: `${Math.min(item.time / 150 * 100, 100)}%` }}
                      >
                        <span className="bar-value">{item.time}分</span>
                      </div>
                    </div>
                    <div className="bar-label">{item.day}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="quick-actions">
              <button
                className="action-btn"
                onClick={() => navigate(`/parent/child/${child.childId}/reminders`)}
              >
                设置提醒
              </button>
              <button
                className="action-btn"
                onClick={() => navigate(`/parent/child/${child.childId}/report`)}
              >
                查看报告
              </button>
              <button
                className="action-btn"
                onClick={() => navigate(`/parent/child/${child.childId}/settings`)}
              >
                管理设置
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 全局统计 */}
      <div className="global-stats">
        <h3>家庭学习概况</h3>
        <div className="global-stats-grid">
          <div className="global-stat-item">
            <div className="global-stat-icon">👨‍👩‍👧‍👦</div>
            <div className="global-stat-info">
              <div className="global-stat-value">{children.length}</div>
              <div className="global-stat-label">孩子总数</div>
            </div>
          </div>
          <div className="global-stat-item">
            <div className="global-stat-icon">📚</div>
            <div className="global-stat-info">
              <div className="global-stat-value">
                {formatTime(children.reduce((sum, c) => sum + c.todayTime, 0))}
              </div>
              <div className="global-stat-label">今日总学习时长</div>
            </div>
          </div>
          <div className="global-stat-item">
            <div className="global-stat-icon">🔥</div>
            <div className="global-stat-info">
              <div className="global-stat-value">
                {children.filter(c => c.isOnline).length}
              </div>
              <div className="global-stat-label">正在学习</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentMonitor;
