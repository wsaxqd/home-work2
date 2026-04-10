import React, { useState, useEffect } from 'react';
import { achievementApi } from '../services/api/features';
import './Achievements.css';

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  requirement: {
    type: string;
    value: number;
  };
  unlocked?: boolean;
  unlockedAt?: string;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  totalPoints: number;
  earnedPoints: number;
  completionRate: number;
}

const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    { key: 'all', name: '全部', icon: '🏆' },
    { key: 'learning', name: '学习', icon: '📚' },
    { key: 'creation', name: '创作', icon: '🎨' },
    { key: 'game', name: '游戏', icon: '🎮' },
    { key: 'social', name: '社交', icon: '👥' },
    { key: 'points', name: '积分', icon: '💰' },
    { key: 'special', name: '特殊', icon: '⭐' }
  ];

  useEffect(() => {
    loadAchievements();
    loadStats();
  }, [activeCategory]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const category = activeCategory === 'all' ? undefined : activeCategory;
      const response = await achievementApi.getUserAchievements(category);

      // @ts-ignore - API 响应类型待优化
      if (response.data.success) {
        // @ts-ignore
        setAchievements(response.data.data);
      }
    } catch (error) {
      console.error('加载成就失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await achievementApi.getAchievementStats();
      // @ts-ignore - API 响应类型待优化
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('加载成就统计失败:', error);
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      learning: '#4CAF50',
      creation: '#FF9800',
      game: '#9C27B0',
      social: '#2196F3',
      points: '#FFC107',
      special: '#E91E63'
    };
    return colors[category] || '#757575';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="achievements-page">
      {/* 统计概览 */}
      {stats && (
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-value">{stats.unlockedAchievements}/{stats.totalAchievements}</div>
              <div className="stat-label">已解锁成就</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{stats.earnedPoints}</div>
              <div className="stat-label">成就点数</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completionRate.toFixed(1)}%</div>
              <div className="stat-label">完成度</div>
            </div>
          </div>
        </div>
      )}

      {/* 分类筛选 */}
      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`category-btn ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span className="category-icon">{cat.icon}</span>
            <span className="category-name">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 成就列表 */}
      <div className="achievements-list">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : achievements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <div className="empty-text">暂无成就</div>
          </div>
        ) : (
          achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon-wrapper">
                <div
                  className="achievement-icon"
                  style={{ borderColor: getCategoryColor(achievement.category) }}
                >
                  {achievement.icon}
                </div>
                {achievement.unlocked && (
                  <div className="unlock-badge">✓</div>
                )}
              </div>

              <div className="achievement-content">
                <div className="achievement-header">
                  <h3 className="achievement-name">{achievement.name}</h3>
                  <span
                    className="achievement-category"
                    style={{ backgroundColor: getCategoryColor(achievement.category) }}
                  >
                    {categories.find(c => c.key === achievement.category)?.name}
                  </span>
                </div>

                <p className="achievement-description">{achievement.description}</p>

                {achievement.progress && !achievement.unlocked && (
                  <div className="achievement-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${achievement.progress.percentage}%`,
                          backgroundColor: getCategoryColor(achievement.category)
                        }}
                      />
                    </div>
                    <div className="progress-text">
                      {achievement.progress.current} / {achievement.progress.target}
                      <span className="progress-percentage">
                        ({achievement.progress.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )}

                <div className="achievement-footer">
                  <div className="achievement-points">
                    <span className="points-icon">⭐</span>
                    <span className="points-value">{achievement.points} 点</span>
                  </div>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="unlock-date">
                      解锁于 {formatDate(achievement.unlockedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Achievements;
