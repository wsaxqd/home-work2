import api from './index';

// 反馈相关API
export const feedbackApi = {
  // 提交反馈
  submitFeedback: (data: {
    type: 'bug' | 'feature' | 'other';
    content: string;
    images?: string[];
    contact?: string;
  }) => api.post('/feedback', data),

  // 获取我的反馈列表
  getMyFeedback: (page: number = 1, limit: number = 20) =>
    api.get(`/feedback/my?page=${page}&limit=${limit}`),

  // 获取反馈详情
  getFeedbackDetail: (id: number) => api.get(`/feedback/${id}`),

  // 删除反馈
  deleteFeedback: (id: number) => api.delete(`/feedback/${id}`)
};

// 商城相关API
export const shopApi = {
  // 获取商品列表
  getShopItems: (category?: string) =>
    api.get(`/shop/items${category ? `?category=${category}` : ''}`),

  // 获取商品详情
  getItemDetail: (id: string) => api.get(`/shop/items/${id}`),

  // 购买商品
  purchaseItem: (itemId: string, quantity: number = 1) =>
    api.post('/shop/purchase', { itemId, quantity }),

  // 获取我的物品
  getMyItems: (category?: string) =>
    api.get(`/shop/my-items${category ? `?category=${category}` : ''}`),

  // 获取购买历史
  getPurchaseHistory: (limit: number = 20, offset: number = 0) =>
    api.get(`/shop/purchase-history?limit=${limit}&offset=${offset}`),

  // 使用道具
  useItem: (exchangeId: string) => api.post('/shop/use-item', { exchangeId }),

  // 获取热门商品
  getHotItems: (limit: number = 10) => api.get(`/shop/items/hot?limit=${limit}`),

  // 获取新品推荐
  getNewItems: (limit: number = 10) => api.get(`/shop/items/new?limit=${limit}`)
};

// 用户关系相关API
export const userApi = {
  // 获取用户信息
  getUserInfo: (userId: string) => api.get(`/users/${userId}`),

  // 关注用户
  followUser: (userId: string) => api.post(`/users/${userId}/follow`),

  // 取消关注
  unfollowUser: (userId: string) => api.delete(`/users/${userId}/follow}`),

  // 获取粉丝列表
  getFollowers: (page: number = 1, pageSize: number = 20) =>
    api.get(`/users/followers?page=${page}&pageSize=${pageSize}`),

  // 获取关注列表
  getFollowing: (page: number = 1, pageSize: number = 20) =>
    api.get(`/users/following?page=${page}&pageSize=${pageSize}`)
};

// 书签相关API
export const bookmarkApi = {
  // 添加书签
  createBookmark: (data: {
    resourceType: 'story' | 'article' | 'video' | 'knowledge';
    resourceId: string;
    resourceTitle?: string;
    position?: number;
    notes?: string;
  }) => api.post('/bookmarks', data),

  // 获取书签列表
  getBookmarks: (resourceType?: string, page: number = 1, limit: number = 20) =>
    api.get(`/bookmarks?${resourceType ? `resourceType=${resourceType}&` : ''}page=${page}&limit=${limit}`),

  // 检查书签是否存在
  checkBookmark: (resourceType: string, resourceId: string) =>
    api.get(`/bookmarks/check?resourceType=${resourceType}&resourceId=${resourceId}`),

  // 更新书签
  updateBookmark: (id: number, data: { position?: number; notes?: string }) =>
    api.put(`/bookmarks/${id}`, data),

  // 删除书签
  deleteBookmark: (id: number) => api.delete(`/bookmarks/${id}`)
};

// 笔记相关API
export const noteApi = {
  // 创建笔记
  createNote: (data: {
    title: string;
    content: string;
    resourceType?: string;
    resourceId?: string;
    tags?: string[];
  }) => api.post('/notes', data),

  // 获取笔记列表
  getNotes: (options?: {
    search?: string;
    tags?: string[];
    isFavorite?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.tags) params.append('tags', options.tags.join(','));
    if (options?.isFavorite) params.append('isFavorite', 'true');
    params.append('page', String(options?.page || 1));
    params.append('limit', String(options?.limit || 20));
    return api.get(`/notes?${params.toString()}`);
  },

  // 获取笔记详情
  getNoteDetail: (id: number) => api.get(`/notes/${id}`),

  // 更新笔记
  updateNote: (id: number, data: {
    title?: string;
    content?: string;
    resourceType?: string;
    resourceId?: string;
    tags?: string[];
    isFavorite?: boolean;
  }) => api.put(`/notes/${id}`, data),

  // 删除笔记
  deleteNote: (id: number) => api.delete(`/notes/${id}`),

  // 获取所有标签
  getAllTags: () => api.get('/notes/tags')
};

// 成就相关API
export const achievementApi = {
  // 获取所有成就
  getAllAchievements: (category?: string) =>
    api.get(`/achievements${category ? `?category=${category}` : ''}`),

  // 获取用户成就
  getUserAchievements: (category?: string) =>
    api.get(`/achievements/user${category ? `?category=${category}` : ''}`),

  // 获取成就统计
  getAchievementStats: () => api.get('/achievements/stats'),

  // 获取成就进度
  getAchievementProgress: () => api.get('/achievements/progress')
};

// 排位系统API
export const rankingApi = {
  // 获取用户段位信息
  getUserRank: (gameType: string, season?: string) =>
    api.get(`/ranking/rank/${gameType}${season ? `?season=${season}` : ''}`),

  // 获取排行榜
  getLeaderboard: (gameType: string, season?: string, limit?: number) =>
    api.get(`/ranking/leaderboard/${gameType}?${season ? `season=${season}&` : ''}${limit ? `limit=${limit}` : ''}`),

  // 获取段位分布
  getRankDistribution: (gameType: string, season?: string) =>
    api.get(`/ranking/distribution/${gameType}${season ? `?season=${season}` : ''}`),

  // 快速匹配
  quickMatch: (gameType: string) =>
    api.post('/ranking/quick-match', { gameType }),

  // 获取段位配置
  getRankTiers: () => api.get('/ranking/tiers')
};

// 推荐系统API
export const recommendationApi = {
  // 获取个性化推荐
  getPersonalizedRecommendations: (limit?: number) =>
    api.get(`/recommendations/personalized${limit ? `?limit=${limit}` : ''}`),

  // 获取用户画像
  getUserProfile: () => api.get('/recommendations/profile'),

  // 协同过滤推荐
  getCollaborativeRecommendations: (limit?: number) =>
    api.get(`/recommendations/collaborative${limit ? `?limit=${limit}` : ''}`),

  // 基于内容的推荐
  getContentBasedRecommendations: (limit?: number) =>
    api.get(`/recommendations/content-based${limit ? `?limit=${limit}` : ''}`),

  // 学习路径推荐
  getLearningPathRecommendations: () =>
    api.get('/recommendations/learning-path'),

  // 首页推荐
  getHomeRecommendations: () =>
    api.get('/recommendations/home')
};
