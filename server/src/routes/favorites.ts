/**
 * 收藏路由
 */

import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * 获取收藏列表
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { itemType, page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (itemType) {
      whereClause += ` AND item_type = $${paramIndex++}`;
      params.push(itemType);
    }

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) FROM favorites ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取列表
    params.push(Number(limit), offset);
    const result = await query(
      `SELECT * FROM favorites ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    res.json({
      success: true,
      data: {
        items: result.rows,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 添加收藏
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { itemType, itemId, itemTitle, itemContent, itemThumbnail } = req.body;

    if (!itemType || !itemId || !itemTitle) {
      throw new AppError('缺少必要参数', 400);
    }

    const result = await query(
      `INSERT INTO favorites (user_id, item_type, item_id, item_title, item_content, item_thumbnail)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, itemType, itemId, itemTitle, itemContent || null, itemThumbnail || null]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 删除收藏
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await query(
      'DELETE FROM favorites WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({
      success: true,
      message: '取消收藏成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 检查是否已收藏
 */
router.get('/check', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { itemType, itemId } = req.query;

    const result = await query(
      'SELECT id FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
      [userId, itemType, itemId]
    );

    res.json({
      success: true,
      data: {
        isFavorited: result.rows.length > 0,
        favoriteId: result.rows[0]?.id || null
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
