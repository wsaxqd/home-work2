// 儿童端使用数据记录服务
// 用于记录孩子的学习、游戏、创作等活动数据

const API_BASE_URL = '/api';

// 从localStorage获取token
const getToken = () => {
  const userProfile = localStorage.getItem('userProfile');
  if (userProfile) {
    const data = JSON.parse(userProfile);
    return data.token;
  }
  return null;
};

// 从localStorage获取用户ID
const getUserId = () => {
  const userProfile = localStorage.getItem('userProfile');
  if (userProfile) {
    const data = JSON.parse(userProfile);
    return data.id;
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

  if (!data.success) {
    throw new Error(data.message || '请求失败');
  }

  return data.data;
};

// 活动类型定义
export type ActivityType = '阅读' | '游戏' | '创作' | '学习';

// 记录使用数据的接口
export interface UsageRecord {
  activityType: ActivityType;
  activityTitle: string;
  duration: number; // 秒
  score?: number;
  metadata?: any;
}

// 使用追踪工具类
export class UsageTracker {
  private startTime: number | null = null;
  private activityType: ActivityType;
  private activityTitle: string;
  private metadata: any = {};

  constructor(activityType: ActivityType, activityTitle: string, metadata?: any) {
    this.activityType = activityType;
    this.activityTitle = activityTitle;
    this.metadata = metadata || {};
  }

  // 开始计时
  start() {
    this.startTime = Date.now();
  }

  // 结束并记录
  async end(score?: number, additionalMetadata?: any) {
    if (!this.startTime) {
      console.warn('UsageTracker: 未调用start()就调用了end()');
      return;
    }

    const duration = Math.floor((Date.now() - this.startTime) / 1000); // 转换为秒

    // 合并元数据
    const finalMetadata = {
      ...this.metadata,
      ...additionalMetadata,
    };

    try {
      await recordUsage({
        activityType: this.activityType,
        activityTitle: this.activityTitle,
        duration,
        score,
        metadata: finalMetadata,
      });
    } catch (error) {
      console.error('记录使用数据失败:', error);
    }

    // 重置
    this.startTime = null;
  }

  // 取消记录
  cancel() {
    this.startTime = null;
  }
}

// 记录使用数据
export const recordUsage = async (record: UsageRecord): Promise<void> => {
  const userId = getUserId();

  if (!userId) {
    console.warn('未登录,无法记录使用数据');
    return;
  }

  try {
    await request('/usage/record', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        ...record,
      }),
    });

    console.log('✅ 使用数据记录成功:', {
      type: record.activityType,
      title: record.activityTitle,
      duration: `${record.duration}秒`,
    });
  } catch (error) {
    console.error('❌ 记录使用数据失败:', error);
    throw error;
  }
};

// 快捷记录函数
export const quickRecord = {
  // 记录阅读
  reading: async (title: string, duration: number, pages?: number) => {
    return recordUsage({
      activityType: '阅读',
      activityTitle: title,
      duration,
      metadata: { pages },
    });
  },

  // 记录游戏
  gaming: async (gameName: string, duration: number, score?: number, level?: number) => {
    return recordUsage({
      activityType: '游戏',
      activityTitle: gameName,
      duration,
      score,
      metadata: { level },
    });
  },

  // 记录创作
  creation: async (type: string, title: string, duration: number) => {
    return recordUsage({
      activityType: '创作',
      activityTitle: `${type} - ${title}`,
      duration,
      metadata: { creationType: type },
    });
  },

  // 记录学习
  learning: async (subject: string, duration: number, score?: number) => {
    return recordUsage({
      activityType: '学习',
      activityTitle: subject,
      duration,
      score,
    });
  },
};

// 默认导出
export default {
  UsageTracker,
  recordUsage,
  quickRecord,
};
