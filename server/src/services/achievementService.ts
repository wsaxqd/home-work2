// 成就系统服务
import { query } from '../config/database';
import { pointsService } from './pointsService';

export class AchievementService {
  // 1. 获取所有成就列表
  async getAchievements(category?: string) {
    let sql = 'SELECT * FROM achievements WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ' ORDER BY category, created_at ASC';

    const result = await query(sql, params);
    return result.rows;
  }

  // 2. 获取用户成就进度
  async getUserAchievements(userId: string, category?: string) {
    let sql = `
      SELECT
        a.*,
        ua.unlocked_at,
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as unlocked,
        ap.current_value,
        ap.target_value,
        CASE
          WHEN ap.target_value > 0 THEN (ap.current_value::float / ap.target_value * 100)::int
          ELSE 0
        END as percentage
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      LEFT JOIN achievement_progress ap ON a.code = ap.achievement_code AND ap.user_id = $1
      WHERE 1=1
    `;
    const params: any[] = [userId];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND a.category = $${params.length}`;
    }

    sql += ' ORDER BY a.category, a.created_at ASC';

    const result = await query(sql, params);
    return result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      category: row.category,
      icon: row.icon,
      points: row.points,
      requirement: row.requirement,
      unlocked: row.unlocked,
      unlockedAt: row.unlocked_at,
      progress: row.current_value && row.target_value ? {
        current: row.current_value,
        target: row.target_value,
        percentage: row.percentage
      } : null
    }));
  }

  // 3. 更新成就进度
  async updateAchievementProgress(userId: string, achievementId: string, progress: number) {
    // 获取成就信息
    const achievementResult = await query(
      'SELECT * FROM achievements WHERE id = $1',
      [achievementId]
    );

    if (achievementResult.rows.length === 0) {
      throw new Error('成就不存在');
    }

    const achievement = achievementResult.rows[0];
    const target = achievement.requirement?.value || 0;
    const isCompleted = progress >= target;

    // 检查是否已有进度记录
    const userAchievementResult = await query(
      'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [userId, achievementId]
    );

    if (userAchievementResult.rows.length > 0) {
      // 已完成的成就不再更新
      return { success: true, alreadyCompleted: true };
    }

    // 更新或创建进度记录
    await query(`
      INSERT INTO achievement_progress (user_id, achievement_code, current_value, target_value)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, achievement_code)
      DO UPDATE SET current_value = $3, last_updated = CURRENT_TIMESTAMP
    `, [userId, achievement.code, progress, target]);

    // 如果完成成就,创建解锁记录
    if (isCompleted) {
      await query(`
        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, achievement_id) DO NOTHING
      `, [userId, achievementId]);

      // 发放积分奖励
      if (achievement.points > 0) {
        await pointsService.addPoints(
          userId,
          achievement.points,
          `完成成就:${achievement.name}`,
          '成就系统',
          achievementId
        );
      }

      return {
        success: true,
        completed: true,
        achievement,
        rewards: {
          points: achievement.points
        }
      };
    }

    return { success: true, completed: false };
  }

  // 4. 检查并触发成就(由其他系统调用)
  async checkAndTriggerAchievement(userId: string, type: string, currentValue: number) {
    // 查找相关的未完成成就
    const achievements = await query(`
      SELECT a.*
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      WHERE a.requirement->>'type' = $2 AND ua.id IS NULL
    `, [userId, type]);

    const results = [];

    for (const achievement of achievements.rows) {
      const target = achievement.requirement?.value || 0;

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
        COUNT(DISTINCT ua.achievement_id) as unlocked_achievements,
        (SELECT COUNT(*) FROM achievements) as total_achievements,
        COALESCE(SUM(a.points), 0) as total_points,
        COALESCE(SUM(a.points), 0) as earned_points
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1
    `, [userId]);

    const stats = result.rows[0];

    return {
      totalAchievements: parseInt(stats.total_achievements) || 0,
      unlockedAchievements: parseInt(stats.unlocked_achievements) || 0,
      totalPoints: parseInt(stats.total_points) || 0,
      earnedPoints: parseInt(stats.earned_points) || 0,
      completionRate: stats.total_achievements > 0
        ? ((stats.unlocked_achievements / stats.total_achievements) * 100)
        : 0
    };
  }

  // 6. 获取成就进度详情
  async getAchievementProgress(userId: string) {
    const result = await query(`
      SELECT
        ap.*,
        a.name,
        a.description,
        a.icon,
        a.category
      FROM achievement_progress ap
      JOIN achievements a ON ap.achievement_code = a.code
      WHERE ap.user_id = $1
      ORDER BY ap.last_updated DESC
    `, [userId]);

    return result.rows;
  }
}

export const achievementService = new AchievementService();
