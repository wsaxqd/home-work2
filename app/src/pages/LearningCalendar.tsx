import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Header } from '../components/layout';
import './LearningCalendar.css';

interface DayData {
  date: string;
  hasLearning: boolean;
  duration: number; // 分钟
  subjects: string[];
}

const LearningCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]);

  const loadCalendarData = async () => {
    try {
      // 模拟数据 - 实际应该从API获取
      const mockData: DayData[] = generateMockCalendarData();
      setCalendarData(mockData);
    } catch (error) {
      console.error('加载日历数据失败:', error);
    }
  };

  const generateMockCalendarData = (): DayData[] => {
    const data: DayData[] = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasLearning = Math.random() > 0.3; // 70%的天数有学习

      data.push({
        date: date.toISOString().split('T')[0],
        hasLearning,
        duration: hasLearning ? Math.floor(Math.random() * 120) + 30 : 0,
        subjects: hasLearning ? ['数学', '语文', '英语'].slice(0, Math.floor(Math.random() * 3) + 1) : []
      });
    }

    return data;
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (DayData | null)[] = [];

    // 填充月初空白
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 填充实际日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toISOString().split('T')[0];
      const dayData = calendarData.find(d => d.date === dateStr);
      days.push(dayData || {
        date: dateStr,
        hasLearning: false,
        duration: 0,
        subjects: []
      });
    }

    return days;
  };

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  const getMonthStats = () => {
    const learningDays = calendarData.filter(d => d.hasLearning).length;
    const totalTime = calendarData.reduce((sum, d) => sum + d.duration, 0);

    // 计算连续学习天数
    let maxStreak = 0;
    let currentStreak = 0;
    const sortedData = [...calendarData].sort((a, b) => a.date.localeCompare(b.date));

    for (const day of sortedData) {
      if (day.hasLearning) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return { learningDays, totalTime, maxStreak };
  };

  const stats = getMonthStats();
  const days = getDaysInMonth();

  return (
    <Layout>
      <Header title="学习日历" showBack={true} />
      <div className="main-content">
        {/* 月度统计 */}
        <div className="month-stats">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.learningDays}天</div>
              <div className="stat-label">学习天数</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <div className="stat-value">{formatTime(stats.totalTime)}</div>
              <div className="stat-label">总时长</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-info">
              <div className="stat-value">{stats.maxStreak}天</div>
              <div className="stat-label">最长连续</div>
            </div>
          </div>
        </div>

        {/* 日历 */}
        <div className="calendar-container">
          <div className="calendar-header">
            <button className="month-nav" onClick={() => changeMonth(-1)}>
              ←
            </button>
            <h3 className="month-title">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </h3>
            <button className="month-nav" onClick={() => changeMonth(1)}>
              →
            </button>
          </div>

          <div className="calendar-weekdays">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-days">
            {days.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${!day ? 'empty' : ''} ${day?.hasLearning ? 'has-learning' : ''} ${selectedDay?.date === day?.date ? 'selected' : ''}`}
                onClick={() => day && setSelectedDay(day)}
              >
                {day && (
                  <>
                    <div className="day-number">
                      {new Date(day.date).getDate()}
                    </div>
                    {day.hasLearning && (
                      <div className="day-indicator">
                        <div className="learning-dot"></div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 选中日期详情 */}
        {selectedDay && selectedDay.hasLearning && (
          <div className="day-detail">
            <h4>
              {new Date(selectedDay.date).getMonth() + 1}月
              {new Date(selectedDay.date).getDate()}日 学习详情
            </h4>
            <div className="detail-content">
              <div className="detail-item">
                <span className="detail-label">学习时长:</span>
                <span className="detail-value">{formatTime(selectedDay.duration)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">学习科目:</span>
                <span className="detail-value">{selectedDay.subjects.join('、')}</span>
              </div>
            </div>
          </div>
        )}

        {/* 图例 */}
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-dot has-learning"></div>
            <span>有学习</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot no-learning"></div>
            <span>未学习</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LearningCalendar;
