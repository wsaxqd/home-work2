// 内容访问控制服务
// 用于检查和执行家长设置的内容访问权限

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

// 内容类型
export type ContentType = 'games' | 'creation' | 'reading' | 'aiEncyclopedia';

// 内容访问控制设置
export interface ContentControlSettings {
  games: boolean;           // 游戏中心
  creation: boolean;        // 创作工具
  reading: boolean;         // 阅读内容
  aiEncyclopedia: boolean;  // AI百科
}

// 内容访问控制管理类
export class ContentControlManager {
  private settings: ContentControlSettings | null = null;

  // 加载内容访问控制设置
  async loadSettings(): Promise<ContentControlSettings | null> {
    const userId = getUserId();
    if (!userId) {
      console.warn('未登录,无法加载内容访问控制设置');
      return null;
    }

    try {
      const response = await request(`/parent/control-settings/${userId}`);
      if (response.success && response.data) {
        this.settings = response.data.contentControl || null;
        return this.settings;
      }
    } catch (error) {
      console.error('加载内容访问控制设置失败:', error);
    }

    return null;
  }

  // 检查是否允许访问某个内容类型
  async canAccess(contentType: ContentType): Promise<boolean> {
    // 如果没有加载设置,先加载
    if (!this.settings) {
      await this.loadSettings();
    }

    // 如果没有设置,默认允许
    if (!this.settings) {
      return true;
    }

    return this.settings[contentType] !== false;
  }

  // 获取当前设置
  getSettings(): ContentControlSettings | null {
    return this.settings;
  }

  // 刷新设置
  async refresh(): Promise<void> {
    await this.loadSettings();
  }
}

// 创建全局单例
export const contentControlManager = new ContentControlManager();

// 内容类型映射
export const contentTypeMap: Record<ContentType, string> = {
  games: '游戏中心',
  creation: '创作工具',
  reading: '阅读内容',
  aiEncyclopedia: 'AI百科',
};

// 默认导出
export default {
  ContentControlManager,
  contentControlManager,
  contentTypeMap,
};
