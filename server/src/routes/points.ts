// 积分系统路由
import express, { Response } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { pointsService } from '../services/pointsService';
import { shopService } from '../services/shopService';
import { AuthRequest } from '../types/express';

const router = express.Router();

// ===== 积分管理 =====

// 1. 获取用户积分信息
router.get('/info', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const info = await pointsService.getUserPoints(userId);

    res.json({
      success: true,
      data: info
    });
  } catch (error: any) {
    console.error('获取积分信息失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取积分信息失败'
    });
  }
});

// 2. 获取积分记录
router.get('/records', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { filter, limit = 50, offset = 0 } = req.query;

    const records = await pointsService.getPointsRecords(
      userId,
      filter as 'earn' | 'spend' | undefined,
      Number(limit),
      Number(offset)
    );

    res.json({
      success: true,
      data: records
    });
  } catch (error: any) {
    console.error('获取积分记录失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取积分记录失败'
    });
  }
});

// 3. 获取等级配置
router.get('/levels', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const levels = await pointsService.getLevelConfigs();

    res.json({
      success: true,
      data: levels
    });
  } catch (error: any) {
    console.error('获取等级配置失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取等级配置失败'
    });
  }
});

// ===== 积分商城 =====

// 4. 获取商城商品列表
router.get('/shop/items', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;

    const items = await shopService.getShopItems(category as string);

    res.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取商品列表失败'
    });
  }
});

// 5. 获取商品详情
router.get('/shop/items/:itemId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const item = await shopService.getItemDetail(itemId);

    res.json({
      success: true,
      data: item
    });
  } catch (error: any) {
    console.error('获取商品详情失败:', error);
    res.status(404).json({
      success: false,
      message: error.message || '获取商品详情失败'
    });
  }
});

// 6. 兑换商品
router.post('/shop/exchange', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { itemId, quantity = 1 } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: '商品ID不能为空'
      });
    }

    const result = await shopService.exchangeItem(userId, itemId, quantity);

    res.json({
      success: true,
      data: result,
      message: '兑换成功!'
    });
  } catch (error: any) {
    console.error('兑换商品失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '兑换失败'
    });
  }
});

// 7. 获取用户兑换记录
router.get('/shop/exchanges', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { limit = 20, offset = 0 } = req.query;

    const exchanges = await shopService.getUserExchanges(
      userId,
      Number(limit),
      Number(offset)
    );

    res.json({
      success: true,
      data: exchanges
    });
  } catch (error: any) {
    console.error('获取兑换记录失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取兑换记录失败'
    });
  }
});

// 8. 使用道具
router.post('/shop/use/:exchangeId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { exchangeId } = req.params;

    const result = await shopService.useItem(userId, exchangeId);

    res.json({
      success: true,
      data: result,
      message: '使用成功!'
    });
  } catch (error: any) {
    console.error('使用道具失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '使用失败'
    });
  }
});

// 9. 获取商城统计
router.get('/shop/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await shopService.getShopStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('获取商城统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取统计失败'
    });
  }
});

// 10. 获取热门商品
router.get('/shop/hot', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const items = await shopService.getHotItems(Number(limit));

    res.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    console.error('获取热门商品失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取热门商品失败'
    });
  }
});

// 11. 获取新品推荐
router.get('/shop/new', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const items = await shopService.getNewItems(Number(limit));

    res.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    console.error('获取新品失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取新品失败'
    });
  }
});

export default router;
