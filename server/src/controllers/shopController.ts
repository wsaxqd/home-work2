import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { shopService } from '../services/shopService';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';

/**
 * 获取商城商品列表
 */
export const getShopItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = req.query.category as string;

  const items = await shopService.getShopItems(category);

  sendSuccess(res, items);
});

/**
 * 获取商品详情
 */
export const getItemDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const itemId = req.params.id;

  const item = await shopService.getItemDetail(itemId);

  sendSuccess(res, item);
});

/**
 * 购买/兑换商品
 */
export const purchaseItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { itemId, quantity = 1 } = req.body;

  const result = await shopService.exchangeItem(userId, itemId, quantity);

  sendSuccess(res, result, '购买成功');
});

/**
 * 获取用户的物品列表
 */
export const getUserItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const category = req.query.category as string;

  const items = await shopService.getUserItems(userId, category);

  sendSuccess(res, items);
});

/**
 * 获取购买历史
 */
export const getPurchaseHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const history = await shopService.getUserExchanges(userId, limit, offset);

  sendSuccess(res, history);
});

/**
 * 使用道具
 */
export const useItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { exchangeId } = req.body;

  const result = await shopService.useItem(userId, exchangeId);

  sendSuccess(res, result);
});

/**
 * 获取热门商品
 */
export const getHotItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;

  const items = await shopService.getHotItems(limit);

  sendSuccess(res, items);
});

/**
 * 获取新品推荐
 */
export const getNewItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;

  const items = await shopService.getNewItems(limit);

  sendSuccess(res, items);
});
