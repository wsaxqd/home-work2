// 成就系统服务
import { query } from '../config/database';
import { pointsService } from './pointsService';

export class AchievementService {
  // 1. 获取所有成就列表
  async getAchievements(category?: string) {
    let sql = 'SELECT * FROM achievements_new WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ' ORDER BY category, sort_order ASC';

    const result = await query(sql, params);
    return result.rows;
  }

  // 2. 获取用户成就进度
  async getUserAchievements(userId: string, category?: string) {
    let sql = `
      SELECT
        a.*,
        ua.progress,
        ua.is_completed,
        ua.completed_at
      FROM achievements_new a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      WHERE 1=1
    `;
    const params: any[] = [userId];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND a.category = $${params.length}`;
    }

    sql += ' ORDER BY a.category, a.sort_order ASC';

    const result = await query(sql, params);
    return result.rows.map(row => ({
      ...row,
      progress: row.progress || 0,
      target: row.condition?.target || 0,
      is_completed: row.is_completed || false
    }));
  }

  // 3. 更新成就进度
  async updateAchievementProgress(userId: string, achievementId: string, progress: number) {
    // 获取成就信息
    const achievementResult = await query(
      'SELECT * FROM achievements_new WHERE id = $1',
      [achievementId]
    );

    if (achievementResult.rows.length === 0) {
      throw new Error('成就不存在');
    }

    const achievement = achievementResult.rows[0];
    const target = achievement.condition?.target || 0;
    const isCompleted = progress >= target;

    // 检查是否已有进度记录
    const userAchievementResult = await query(
      'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [userId, achievementId]
    );

    if (userAchievementResult.rows.length > 0) {
      // 已完成的成就不再更新
      if (userAchievementResult.rows[0].is_completed) {
        return { success: true, alreadyCompleted: true };
      }

      // 更新进度
      await query(`
        UPDATE user_achievements
        SET progress = $1, is_completed = $2, completed_at = $3, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $4 AND achievement_id = $5
      `, [progress, isCompleted, isCompleted ? new Date() : null, userId, achievementId]);
    } else {
      // 创建进度记录
      await query(`
        INSERT INTO user_achievements (user_id, achievement_id, progress, target, is_completed, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, achievementId, progress, target, isCompleted, isCompleted ? new Date() : null]);
    }

    // 如果完成成就，发放奖励
    if (isCompleted && userAchievementResult.rows.length === 0) {
      if (achievement.reward_points > 0) {
        await pointsService.addPoints(
          userId,
          achievement.reward_points,
          `完成成就：${achievement.name}`,
          '成就系统',
          achievementId
        );
      }

      return {
        success: true,
        completed: true,
        achievement,
        rewards: {
          points: achievement.reward_points
        }
      };
    }

    return { success: true, completed: false };
  }

  // 4. 检查并触发成就（由其他系统调用）
  async checkAndTriggerAchievement(userId: string, type: string, currentValue: number) {
    // 查找相关的未完成成就
    const achievements = await query(`
      SELECT a.*, ua.progress, ua.is_completed
      FROM achievements_new a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      WHERE a.type = $2 AND (ua.is_completed IS NULL OR ua.is_completed = false)
    `, [userId, type]);

    const results = [];

    for (const achievement of achievements.rows) {
      const target = achievement.condition?.target || 0;

      if (currentValue >= target) {
        const result = await this.updateAchievementProgress(userId, achievement.id, currentValue);
        if (result.completed) {
          results.push(result);
        }
      }
    }

    return results;
  }

  // 5. 获取成就统计
  async getUserAchievementStats(userId: string) {
    const result = await query(`
      SELECT
        COUNT(DISTINCT ua.achievement_id) as completed_count,
        (SELECT COUNT(*) FROM achievements_new) as total_count,
        SUM(a.reward_points) as total_points_earned
      FROM user_achievements ua
      JOIN achievements_new a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1 AND ua.is_completed = true
    `, [userId]);

    const stats = result.rows[0];

    // 按稀有度统计
    const rarityStats = await query(`
      SELECT
        a.rarity,
        COUNT(*) as count
      FROM user_achievements ua
      JOIN achievements_new a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1 AND ua.is_completed = true
      GROUP BY a.rarity
    `, [userId]);

    return {
      ...stats,
      completionRate: stats.total_count > 0
        ? (stats.completed_count / stats.total_count * 100).toFixed(1)
        : 0,
      byRarity: rarityStats.rows
    };
  }
}

export const achievementService = new AchievementService();
