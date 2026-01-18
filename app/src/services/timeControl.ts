// 时间控制服务
// 用于检查和执行家长设置的时间限制

const API_BASE_URL = '/api';

// 从localStorage获取用户ID
const getUserId = () => {
  const userProfile = localStorage.getItem('userProfile');
  if (userProfile) {
    const data = JSON.parse(userProfile);
    return data.id;
  }
  return null;
};

// 从localStorage获取token
const getToken = () => {
  const userProfile = localStorage.getItem('userProfile');
  if (userProfile) {
    const data = JSON.parse(userProfile);
    return data.token;
  }
  return null;
};

// 通用请求函数
const request = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

// 时间控制设置接口
export interface TimeControlSettings {
  dailyLimit: number;        // 每日时长限制(分钟)
  gameLimit: number;         // 游戏时长限制(分钟)
  startTime: string;         // 可用开始时间 (HH:mm)
  endTime: string;           // 可用结束时间 (HH:mm)
  enabled: boolean;          // 是否启用时间控制
}

// 时间限制检查结果
export interface TimeLimitCheck {
  allowed: boolean;          // 是否允许使用
  reason?: string;           // 不允许的原因
  remainingTime?: number;    // 剩余时间(秒)
  remainingGameTime?: number; // 剩余游戏时间(秒)
}

// 时间控制管理类
export class TimeControlManager {
  private settings: TimeControlSettings | null = null;
  private checkInterval: number | null = null;
  private onTimeUpCallback: (() => void) | null = null;

  // 加载时间控制设置
  async loadSettings(): Promise<TimeControlSettings | null> {
    const userId = getUserId();
    if (!userId) {
      console.warn('未登录,无法加载时间控制设置');
      return null;
    }

    try {
      const response = await request(`/parent/control-settings/${userId}`);
      if (response.success && response.data) {
        this.settings = response.data.timeControl || null;
        return this.settings;
      }
    } catch (error) {
      console.error('加载时间控制设置失败:', error);
    }

    return null;
  }

  // 检查当前是否允许使用
  async checkTimeLimit(): Promise<TimeLimitCheck> {
    const userId = getUserId();
    if (!userId) {
      return { allowed: true };
    }

    // 如果没有加载设置,先加载
    if (!this.settings) {
      await this.loadSettings();
    }

    // 如果未启用时间控制,直接允许
    if (!this.settings || !this.settings.enabled) {
      return { allowed: true };
    }

    try {
      const response = await request(`/parent/check-limit/${userId}`);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('检查时间限制失败:', error);
    }

    // 出错时默认允许,避免影响用户体验
    return { allowed: true };
  }

  // 检查是否在允许的时间段内
  isInAllowedTimeRange(): boolean {
    if (!this.settings || !this.settings.enabled) {
      return true;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return currentTime >= this.settings.startTime && currentTime <= this.settings.endTime;
  }

  // 启动定期检查
  startMonitoring(onTimeUp: () => void, intervalSeconds: number = 60) {
    this.onTimeUpCallback = onTimeUp;

    // 清除之前的定时器
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
    }

    // 每隔一段时间检查一次
    this.checkInterval = window.setInterval(async () => {
      const result = await this.checkTimeLimit();
      if (!result.allowed && this.onTimeUpCallback) {
        this.onTimeUpCallback();
      }
    }, intervalSeconds * 1000);
  }

  // 停止监控
  stopMonitoring() {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.onTimeUpCallback = null;
  }

  // 获取当前设置
  getSettings(): TimeControlSettings | null {
    return this.settings;
  }
}

// 创建全局单例
export const timeControlManager = new TimeControlManager();

// 工具函数：格式化剩余时间
export const formatRemainingTime = (seconds: number): string => {
  if (seconds <= 0) return '0分钟';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
};

// 默认导出
export default {
  TimeControlManager,
  timeControlManager,
  formatRemainingTime,
};
