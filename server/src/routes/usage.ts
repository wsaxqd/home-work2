import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 记录使用数据
router.post('/record', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      activityType,
      activityTitle,
      duration,
      score,
      metadata,
    } = req.body;

    // 验证必填字段
    if (!userId || !activityType || !activityTitle || duration === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    // 验证活动类型
    const validTypes = ['阅读', '游戏', '创作', '学习'];
    if (!validTypes.includes(activityType)) {
      return res.status(400).json({
        success: false,
        message: '无效的活动类型',
      });
    }

    // 插入使用记录
    const result = await pool.query(
      `INSERT INTO usage_logs
        (user_id, activity_type, activity_title, duration, score, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [userId, activityType, activityTitle, duration, score || null, metadata ? JSON.stringify(metadata) : null]
    );

    res.json({
      success: true,
      message: '记录成功',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('记录使用数据失败:', error);
    res.status(500).json({
      success: false,
      message: '记录失败',
      error: error.message,
    });
  }
});

// 获取用户的使用记录
router.get('/records/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, type, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM usage_logs
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    // 添加日期过滤
    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // 添加类型过滤
    if (type) {
      query += ` AND activity_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error: any) {
    console.error('获取使用记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败',
      error: error.message,
    });
  }
});

// 获取今日使用统计
router.get('/today-stats/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT
        activity_type,
        COUNT(*) as count,
        SUM(duration) as total_duration,
        AVG(score) as avg_score
       FROM usage_logs
       WHERE user_id = $1
         AND DATE(created_at) = CURRENT_DATE
       GROUP BY activity_type`,
      [userId]
    );

    // 转换为更友好的格式
    const stats: any = {
      total: 0,
      learning: 0,
      gaming: 0,
      reading: 0,
      creation: 0,
    };

    result.rows.forEach((row) => {
      const duration = parseInt(row.total_duration) || 0;
      stats.total += duration;

      switch (row.activity_type) {
        case '学习':
          stats.learning += duration;
          break;
        case '游戏':
          stats.gaming += duration;
          break;
        case '阅读':
          stats.reading += duration;
          break;
        case '创作':
          stats.creation += duration;
          break;
      }
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('获取今日统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败',
      error: error.message,
    });
  }
});

// 删除使用记录
router.delete('/records/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM usage_logs WHERE id = $1', [id]);

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error: any) {
    console.error('删除使用记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message,
    });
  }
});

export default router;
