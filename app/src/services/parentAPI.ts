// 家长端API调用工具
// 使用方法：在前端页面中import这个文件，调用相应的函数

const API_BASE_URL = '/api';

// 从localStorage获取token
const getToken = () => {
  const parentProfile = localStorage.getItem('parentProfile');
  if (parentProfile) {
    const data = JSON.parse(parentProfile);
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

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || '请求失败');
  }

  return data.data;
};

// ===== 认证相关 =====

export const parentAPI = {
  // 发送邮箱验证码
  sendVerifyCode: async (email: string) => {
    return request('/parent/send-verify-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // 家长注册
  register: async (data: {
    phone: string;
    password: string;
    name?: string;
    email?: string;
    verifyCode?: string;
    childAccount?: string;
  }) => {
    return request('/parent/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 家长登录
  login: async (data: { phone: string; password: string }) => {
    const result = await request('/parent/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // 保存token到localStorage
    if (result.token) {
      const parentProfile = {
        ...result.parent,
        token: result.token,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('parentProfile', JSON.stringify(parentProfile));
    }

    return result;
  },

  // 获取家长信息
  getProfile: async () => {
    return request('/parent/profile');
  },

  // 更新个人信息
  updateProfile: async (data: { name?: string; email?: string; avatar?: string }) => {
    return request('/parent/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 修改密码
  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    return request('/parent/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新通知设置
  updateNotificationSettings: async (settings: any) => {
    return request('/parent/notification-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // ===== 孩子管理 =====

  // 获取所有孩子
  getChildren: async () => {
    return request('/parent/children');
  },

  // 添加孩子
  addChild: async (data: {
    account: string;
    nickname: string;
    age: number;
    gender: '男' | '女';
    grade: string;
    avatar: string;
  }) => {
    return request('/parent/children', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新孩子信息
  updateChild: async (childId: number, data: {
    nickname?: string;
    age?: number;
    gender?: '男' | '女';
    grade?: string;
    avatar?: string;
  }) => {
    return request(`/parent/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 删除（解绑）孩子
  deleteChild: async (childId: number) => {
    return request(`/parent/children/${childId}`, {
      method: 'DELETE',
    });
  },

  // ===== 使用数据 =====

  // 获取使用统计
  getUsageStats: async (userId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/parent/usage-stats/${userId}${query}`);
  },

  // 获取今日使用时长
  getTodayUsage: async (userId: number) => {
    return request(`/parent/today-usage/${userId}`);
  },

  // 获取成长报告
  getGrowthReport: async (userId: number, type: 'week' | 'month' = 'week') => {
    return request(`/parent/growth-report/${userId}?type=${type}`);
  },

  // ===== 控制设置 =====

  // 获取控制设置
  getControlSettings: async (userId: number) => {
    return request(`/parent/control-settings/${userId}`);
  },

  // 更新控制设置
  updateControlSettings: async (userId: number, settings: {
    dailyLimit?: number;
    gameLimit?: number;
    startTime?: string;
    endTime?: string;
    timeControlEnabled?: boolean;
    contentControls?: {
      games?: boolean;
      creation?: boolean;
      reading?: boolean;
      aiEncyclopedia?: boolean;
    };
  }) => {
    return request(`/parent/control-settings/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // 检查时间限制
  checkTimeLimit: async (userId: number) => {
    return request(`/parent/check-limit/${userId}`);
  },
};

export default parentAPI;
