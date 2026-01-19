/**
 * 收藏相关 API
 */

import { api } from '../../config/api';

export interface Favorite {
  id: string;
  userId: string;
  itemType: 'story' | 'poem' | 'music' | 'art' | 'picture_book';
  itemId: string;
  itemTitle: string;
  itemContent?: string;
  itemThumbnail?: string;
  createdAt: string;
}

export interface FavoriteCreateInput {
  itemType: string;
  itemId: string;
  itemTitle: string;
  itemContent?: string;
  itemThumbnail?: string;
}

export const favoritesApi = {
  /**
   * 获取收藏列表
   */
  getFavorites: (params?: { itemType?: string; page?: number; limit?: number }) =>
    api.get('/favorites', { params }),

  /**
   * 添加收藏
   */
  addFavorite: (data: FavoriteCreateInput) =>
    api.post('/favorites', data),

  /**
   * 取消收藏
   */
  removeFavorite: (favoriteId: string) =>
    api.delete(`/favorites/${favoriteId}`),

  /**
   * 检查是否已收藏
   */
  checkFavorite: (itemType: string, itemId: string) =>
    api.get('/favorites/check', { params: { itemType, itemId } })
};
