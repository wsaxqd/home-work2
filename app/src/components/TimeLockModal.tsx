import { useState } from 'react';
import './TimeLockModal.css';

interface TimeLockModalProps {
  remainingTime?: number;
  reason?: string;
  onUnlock?: () => void;
}

export default function TimeLockModal({ remainingTime, reason, onUnlock }: TimeLockModalProps) {
  const [error, setError] = useState('');

  const handleUnlock = () => {
    // 这里可以调用家长验证API
    // 简化版本:检查本地存储的家长密码
    const parentProfile = localStorage.getItem('parentProfile');
    if (parentProfile) {
      if (onUnlock) {
        onUnlock();
      }
    } else {
      setError('请先登录家长账号');
    }
  };

  return (
    <div className="time-lock-overlay">
      <div className="time-lock-modal">
        <div className="lock-icon">🔒</div>
        <h2>使用时间已到</h2>
        <p className="lock-message">
          {reason || '今天的使用时间已经用完了'}
        </p>

        {remainingTime !== undefined && remainingTime <= 0 && (
          <p className="lock-info">
            明天可以继续使用哦！
          </p>
        )}

        <div className="unlock-section">
          <p className="unlock-hint">需要家长解锁才能继续使用</p>
          <button className="unlock-btn" onClick={handleUnlock}>
            家长解锁
          </button>
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
    </div>
  );
}
