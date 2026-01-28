// 积分商城服务
import { query } from '../config/database';
import { pointsService } from './pointsService';

export class ShopService {
  // 1. 获取商城商品列表
  async getShopItems(category?: string, isActive: boolean = true) {
    let sql = 'SELECT * FROM shop_items WHERE 1=1';
    const params: any[] = [];

    if (isActive) {
      sql += ' AND is_active = true';
    }

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    // 检查时间限制
    sql += ` AND (start_at IS NULL OR start_at <= CURRENT_TIMESTAMP)`;
    sql += ` AND (end_at IS NULL OR end_at >= CURRENT_TIMESTAMP)`;

    sql += ' ORDER BY sort_order ASC, created_at DESC';

    const result = await query(sql, params);

    return result.rows;
  }

  // 2. 获取商品详情
  async getItemDetail(itemId: string) {
    const result = await query(
      'SELECT * FROM shop_items WHERE id = $1',
      [itemId]
    );

    if (result.rows.length === 0) {
      throw new Error('商品不存在');
    }

    return result.rows[0];
  }

  // 3. 兑换商品
  async exchangeItem(userId: string, itemId: string, quantity: number = 1) {
    // 获取商品信息
    const item = await this.getItemDetail(itemId);

    if (!item.is_active) {
      throw new Error('商品已下架');
    }

    // 检查库存
    if (item.stock > 0 && item.stock < quantity) {
      throw new Error('库存不足');
    }

    const totalPrice = item.price * quantity;

    // 开始事务
    await query('BEGIN');

    try {
      // 扣除积分
      await pointsService.deductPoints(
        userId,
        totalPrice,
        `兑换商品：${item.name}`,
        '积分商城',
        itemId
      );

      // 更新商品库存和销量
      if (item.stock > 0) {
        await query(
          'UPDATE shop_items SET stock = stock - $1, sold_count = sold_count + $2 WHERE id = $3',
          [quantity, quantity, itemId]
        );
      } else {
        await query(
          'UPDATE shop_items SET sold_count = sold_count + $1 WHERE id = $2',
          [quantity, itemId]
        );
      }

      // 记录兑换记录
      const exchangeResult = await query(`
        INSERT INTO user_exchanges (user_id, item_id, item_name, item_price, quantity, total_price, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'completed')
        RETURNING *
      `, [userId, itemId, item.name, item.price, quantity, totalPrice]);

      await query('COMMIT');

      return {
        success: true,
        exchange: exchangeResult.rows[0],
        item
      };
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  // 4. 获取用户兑换记录
  async getUserExchanges(userId: string, limit: number = 20, offset: number = 0) {
    const result = await query(`
      SELECT ue.*, si.icon, si.image_url, si.type
      FROM user_exchanges ue
      LEFT JOIN shop_items si ON ue.item_id = si.id
      WHERE ue.user_id = $1
      ORDER BY ue.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return result.rows;
  }

  // 5. 使用已兑换的道具
  async useItem(userId: string, exchangeId: string) {
    const result = await query(
      'SELECT * FROM user_exchanges WHERE id = $1 AND user_id = $2',
      [exchangeId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('兑换记录不存在');
    }

    const exchange = result.rows[0];

    if (exchange.status === 'used') {
      throw new Error('该道具已使用');
    }

    if (exchange.status === 'expired') {
      throw new Error('该道具已过期');
    }

    // 更新状态为已使用
    await query(
      'UPDATE user_exchanges SET status = $1, used_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['used', exchangeId]
    );

    return { success: true, message: '道具使用成功' };
  }

  // 6. 获取商城统计信息
  async getShopStats() {
    const result = await query(`
      SELECT
        COUNT(*) as total_items,
        COUNT(CASE WHEN is_hot = true THEN 1 END) as hot_items,
        COUNT(CASE WHEN is_new = true THEN 1 END) as new_items,
        SUM(sold_count) as total_sold
      FROM shop_items
      WHERE is_active = true
    `);

    return result.rows[0];
  }

  // 7. 获取热门商品
  async getHotItems(limit: number = 10) {
    const result = await query(`
      SELECT * FROM shop_items
      WHERE is_active = true AND (is_hot = true OR sold_count > 10)
      ORDER BY sold_count DESC, is_hot DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  // 8. 获取新品推荐
  async getNewItems(limit: number = 10) {
    const result = await query(`
      SELECT * FROM shop_items
      WHERE is_active = true AND is_new = true
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }
}

export const shopService = new ShopService();
