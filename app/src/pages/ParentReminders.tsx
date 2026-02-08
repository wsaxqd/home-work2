import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ParentReminders.css';

interface Reminder {
  id: string;
  childId: string;
  type: 'daily' | 'weekly' | 'custom';
  time: string;
  days?: string[]; // 周几提醒
  message: string;
  enabled: boolean;
  createdAt: string;
}

const ParentReminders: React.FC = () => {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    type: 'daily',
    time: '19:00',
    days: [],
    message: '该学习啦!',
    enabled: true
  });

  useEffect(() => {
    loadReminders();
  }, [childId]);

  const loadReminders = async () => {
    try {
      // 模拟数据 - 实际应该从API获取
      const mockData: Reminder[] = [
        {
          id: '1',
          childId: childId || '1',
          type: 'daily',
          time: '19:00',
          message: '晚上学习时间到了!',
          enabled: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          childId: childId || '1',
          type: 'weekly',
          time: '09:00',
          days: ['周六', '周日'],
          message: '周末学习时间,加油!',
          enabled: true,
          createdAt: new Date().toISOString()
        }
      ];

      setReminders(mockData);
    } catch (error) {
      console.error('加载提醒失败:', error);
    }
  };

  const handleAddReminder = async () => {
    try {
      const reminder: Reminder = {
        id: Date.now().toString(),
        childId: childId || '1',
        type: newReminder.type || 'daily',
        time: newReminder.time || '19:00',
        days: newReminder.days,
        message: newReminder.message || '该学习啦!',
        enabled: true,
        createdAt: new Date().toISOString()
      };

      setReminders([...reminders, reminder]);
      setShowAddForm(false);
      setNewReminder({
        type: 'daily',
        time: '19:00',
        days: [],
        message: '该学习啦!',
        enabled: true
      });
    } catch (error) {
      console.error('添加提醒失败:', error);
    }
  };

  const handleToggleReminder = async (id: string) => {
    try {
      setReminders(reminders.map(r =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ));
    } catch (error) {
      console.error('切换提醒状态失败:', error);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      setReminders(reminders.filter(r => r.id !== id));
    } catch (error) {
      console.error('删除提醒失败:', error);
    }
  };

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <div className="parent-reminders">
      <div className="reminders-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>学习提醒</h1>
        <button className="add-button" onClick={() => setShowAddForm(true)}>
          + 添加提醒
        </button>
      </div>

      <div className="reminders-content">
        {reminders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⏰</div>
            <p>还没有设置提醒</p>
            <button className="empty-action" onClick={() => setShowAddForm(true)}>
              添加第一个提醒
            </button>
          </div>
        ) : (
          <div className="reminders-list">
            {reminders.map(reminder => (
              <div key={reminder.id} className={`reminder-card ${!reminder.enabled ? 'disabled' : ''}`}>
                <div className="reminder-header">
                  <div className="reminder-type-badge">
                    {reminder.type === 'daily' ? '每日' : reminder.type === 'weekly' ? '每周' : '自定义'}
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={reminder.enabled}
                      onChange={() => handleToggleReminder(reminder.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="reminder-time">
                  <span className="time-icon">🕐</span>
                  <span className="time-text">{reminder.time}</span>
                </div>

                {reminder.days && reminder.days.length > 0 && (
                  <div className="reminder-days">
                    {reminder.days.map(day => (
                      <span key={day} className="day-badge">{day}</span>
                    ))}
                  </div>
                )}

                <div className="reminder-message">
                  <span className="message-icon">💬</span>
                  <span className="message-text">{reminder.message}</span>
                </div>

                <button
                  className="delete-button"
                  onClick={() => handleDeleteReminder(reminder.id)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加提醒表单 */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>添加学习提醒</h2>

            <div className="form-group">
              <label>提醒类型</label>
              <div className="type-buttons">
                <button
                  className={`type-btn ${newReminder.type === 'daily' ? 'active' : ''}`}
                  onClick={() => setNewReminder({ ...newReminder, type: 'daily', days: [] })}
                >
                  每日
                </button>
                <button
                  className={`type-btn ${newReminder.type === 'weekly' ? 'active' : ''}`}
                  onClick={() => setNewReminder({ ...newReminder, type: 'weekly' })}
                >
                  每周
                </button>
              </div>
            </div>

            {newReminder.type === 'weekly' && (
              <div className="form-group">
                <label>选择星期</label>
                <div className="days-selector">
                  {weekDays.map(day => (
                    <button
                      key={day}
                      className={`day-btn ${newReminder.days?.includes(day) ? 'active' : ''}`}
                      onClick={() => {
                        const days = newReminder.days || [];
                        if (days.includes(day)) {
                          setNewReminder({
                            ...newReminder,
                            days: days.filter(d => d !== day)
                          });
                        } else {
                          setNewReminder({
                            ...newReminder,
                            days: [...days, day]
                          });
                        }
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>提醒时间</label>
              <input
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                className="time-input"
              />
            </div>

            <div className="form-group">
              <label>提醒内容</label>
              <textarea
                value={newReminder.message}
                onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                className="message-input"
                placeholder="输入提醒内容..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddForm(false)}>
                取消
              </button>
              <button className="confirm-btn" onClick={handleAddReminder}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentReminders;
