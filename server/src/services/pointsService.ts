// 积分系统服务
import { query } from '../config/database';

export class PointsService {
  // 1. 获取用户积分和等级信息
  async getUserPoints(userId: string) {
    const result = await query(
      'SELECT points, level FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('用户不存在');
    }

    const user = result.rows[0];

    // 获取等级配置
    const levelConfig = await query(
      'SELECT * FROM level_configs WHERE level = $1',
      [user.level]
    );

    // 获取下一等级配置
    const nextLevelConfig = await query(
      'SELECT * FROM level_configs WHERE level = $1',
      [user.level + 1]
    );

    return {
      currentPoints: user.points,
      level: user.level,
      levelConfig: levelConfig.rows[0] || null,
      nextLevelConfig: nextLevelConfig.rows[0] || null,
      progressToNext: nextLevelConfig.rows[0]
        ? Math.min(100, ((user.points - levelConfig.rows[0]?.min_points || 0) /
          ((nextLevelConfig.rows[0]?.min_points || 0) - (levelConfig.rows[0]?.min_points || 0))) * 100)
        : 100
    };
  }

  // 2. 增加积分
  async addPoints(userId: string, amount: number, reason: string, source: string, sourceId?: string, metadata?: any) {
    // 开始事务
    await query('BEGIN');

    try {
      // 更新用户积分
      const updateResult = await query(
        'UPDATE users SET points = points + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING points',
        [amount, userId]
      );

      const newBalance = updateResult.rows[0].points;

      // 记录积分变更
      await query(`
        INSERT INTO points_records (user_id, type, amount, balance, reason, source, source_id, metadata)
        VALUES ($1, 'earn', $2, $3, $4, $5, $6, $7)
      `, [userId, amount, newBalance, reason, source, sourceId, metadata ? JSON.stringify(metadata) : null]);

      // 检查是否需要升级
      await this.checkAndUpgradeLevel(userId, newBalance);

      await query('COMMIT');

      return { success: true, newBalance, amount };
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  // 3. 扣除积分
  async deductPoints(userId: string, amount: number, reason: string, source: string, sourceId?: string) {
    // 检查余额
    const userResult = await query('SELECT points FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new Error('用户不存在');
    }

    const currentPoints = userResult.rows[0].points;
    if (currentPoints < amount) {
      throw new Error('积分不足');
    }

    // 开始事务
    await query('BEGIN');

    try {
      // 更新用户积分
      const updateResult = await query(
        'UPDATE users SET points = points - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING points',
        [amount, userId]
      );

      const newBalance = updateResult.rows[0].points;

      // 记录积分变更
      await query(`
        INSERT INTO points_records (user_id, type, amount, balance, reason, source, source_id)
        VALUES ($1, 'spend', $2, $3, $4, $5, $6)
      `, [userId, amount, newBalance, reason, source, sourceId]);

      await query('COMMIT');

      return { success: true, newBalance, amount };
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  // 4. 获取积分记录
  async getPointsRecords(userId: string, filter?: 'earn' | 'spend', limit: number = 50, offset: number = 0) {
    let sql = `
      SELECT * FROM points_records
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (filter) {
      sql += ` AND type = $2`;
      params.push(filter);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // 获取统计信息
    const statsResult = await query(`
      SELECT
        SUM(CASE WHEN type = 'earn' THEN amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN type = 'spend' THEN amount ELSE 0 END) as total_spent,
        SUM(CASE WHEN type = 'earn' AND created_at >= CURRENT_DATE THEN amount ELSE 0 END) as today_earned
      FROM points_records
      WHERE user_id = $1
    `, [userId]);

    return {
      records: result.rows,
      stats: statsResult.rows[0],
      total: result.rowCount
    };
  }

  // 5. 检查并升级等级
  private async checkAndUpgradeLevel(userId: string, currentPoints: number) {
    // 获取当前用户等级
    const userResult = await query('SELECT level FROM users WHERE id = $1', [userId]);
    const currentLevel = userResult.rows[0].level;

    // 查找应该处于的等级
    const levelResult = await query(`
      SELECT level FROM level_configs
      WHERE min_points <= $1 AND (max_points IS NULL OR max_points >= $1)
      ORDER BY level DESC LIMIT 1
    `, [currentPoints]);

    if (levelResult.rows.length > 0) {
      const newLevel = levelResult.rows[0].level;

      if (newLevel > currentLevel) {
        // 升级
        await query('UPDATE users SET level = $1 WHERE id = $2', [newLevel, userId]);

        // 可以在这里触发升级奖励或通知
        return { upgraded: true, newLevel, oldLevel: currentLevel };
      }
    }

    return { upgraded: false };
  }

  // 6. 获取等级配置列表
  async getLevelConfigs() {
    const result = await query('SELECT * FROM level_configs ORDER BY level ASC');
    return result.rows;
  }
}

export const pointsService = new PointsService();
