import express from 'express';
import * as shopController from '../controllers/shopController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 所有商城路由都需要认证
router.use(authMiddleware);

// 获取商城商品列表
router.get('/items', shopController.getShopItems);

// 获取热门商品
router.get('/items/hot', shopController.getHotItems);

// 获取新品推荐
router.get('/items/new', shopController.getNewItems);

// 获取商品详情
router.get('/items/:id', shopController.getItemDetail);

// 购买商品
router.post('/purchase', shopController.purchaseItem);

// 获取用户的物品列表
router.get('/my-items', shopController.getUserItems);

// 获取购买历史
router.get('/purchase-history', shopController.getPurchaseHistory);

// 使用道具
router.post('/use-item', shopController.useItem);

export default router;
