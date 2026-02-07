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
