// 每日任务系统服务
import { query } from '../config/database';
import { pointsService } from './pointsService';

export class DailyTaskService {
  // 1. 获取所有每日任务
  async getDailyTasks() {
    const result = await query(`
      SELECT * FROM daily_tasks
      WHERE is_active = true
      ORDER BY sort_order ASC
    `);

    return result.rows;
  }

  // 2. 获取用户今日任务
  async getUserDailyTasks(userId: string, date?: Date) {
    const taskDate = date || new Date();
    const dateStr = taskDate.toISOString().split('T')[0];

    const result = await query(`
      SELECT
        dt.*,
        udt.progress,
        udt.is_completed,
        udt.completed_at
      FROM daily_tasks dt
      LEFT JOIN user_daily_tasks udt ON dt.id = udt.task_id
        AND udt.user_id = $1
        AND udt.task_date = $2
      WHERE dt.is_active = true
      ORDER BY dt.sort_order ASC
    `, [userId, dateStr]);

    return result.rows.map(row => ({
      ...row,
      progress: row.progress || 0,
      target: row.condition?.target || 0,
      is_completed: row.is_completed || false,
      completion_rate: row.condition?.target > 0
        ? Math.min(100, ((row.progress || 0) / row.condition.target) * 100)
        : 0
    }));
  }

  // 3. 更新任务进度
  async updateTaskProgress(userId: string, taskId: string, progress: number, date?: Date) {
    const taskDate = date || new Date();
    const dateStr = taskDate.toISOString().split('T')[0];

    // 获取任务信息
    const taskResult = await query(
      'SELECT * FROM daily_tasks WHERE id = $1 AND is_active = true',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error('任务不存在');
    }

    const task = taskResult.rows[0];
    const target = task.condition?.target || 0;
    const isCompleted = progress >= target;

    // 检查是否已有今日记录
    const userTaskResult = await query(`
      SELECT * FROM user_daily_tasks
      WHERE user_id = $1 AND task_id = $2 AND task_date = $3
    `, [userId, taskId, dateStr]);

    if (userTaskResult.rows.length > 0) {
      const userTask = userTaskResult.rows[0];

      // 已完成的任务不再更新
      if (userTask.is_completed) {
        return { success: true, alreadyCompleted: true };
      }

      // 更新进度
      await query(`
        UPDATE user_daily_tasks
        SET progress = $1, is_completed = $2, completed_at = $3, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $4 AND task_id = $5 AND task_date = $6
      `, [progress, isCompleted, isCompleted ? new Date() : null, userId, taskId, dateStr]);
    } else {
      // 创建新记录
      await query(`
        INSERT INTO user_daily_tasks (user_id, task_id, task_date, progress, target, is_completed, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [userId, taskId, dateStr, progress, target, isCompleted, isCompleted ? new Date() : null]);
    }

    // 如果完成任务，发放奖励
    if (isCompleted && (userTaskResult.rows.length === 0 || !userTaskResult.rows[0].is_completed)) {
      if (task.reward_points > 0) {
        await pointsService.addPoints(
          userId,
          task.reward_points,
          `完成每日任务：${task.name}`,
          '每日任务',
          taskId
        );
      }

      return {
        success: true,
        completed: true,
        task,
        rewards: {
          points: task.reward_points
        }
      };
    }

    return { success: true, completed: false };
  }

  // 4. 自动触发任务进度（由其他系统调用）
  async triggerTaskProgress(userId: string, type: string, increment: number = 1, date?: Date) {
    const taskDate = date || new Date();
    const dateStr = taskDate.toISOString().split('T')[0];

    // 查找相关的未完成任务
    const tasks = await query(`
      SELECT dt.*, udt.progress, udt.is_completed
      FROM daily_tasks dt
      LEFT JOIN user_daily_tasks udt ON dt.id = udt.task_id
        AND udt.user_id = $1
        AND udt.task_date = $2
      WHERE dt.type = $3 AND dt.is_active = true
        AND (udt.is_completed IS NULL OR udt.is_completed = false)
    `, [userId, dateStr, type]);

    const results = [];

    for (const task of tasks.rows) {
      const currentProgress = (task.progress || 0) + increment;
      const result = await this.updateTaskProgress(userId, task.id, currentProgress, taskDate);

      if (result.completed) {
        results.push(result);
      }
    }

    return results;
  }

  // 5. 获取任务统计
  async getUserTaskStats(userId: string, date?: Date) {
    const taskDate = date || new Date();
    const dateStr = taskDate.toISOString().split('T')[0];

    const result = await query(`
      SELECT
        COUNT(dt.id) as total_tasks,
        COUNT(CASE WHEN udt.is_completed = true THEN 1 END) as completed_tasks,
        SUM(CASE WHEN udt.is_completed = true THEN dt.reward_points ELSE 0 END) as points_earned_today
      FROM daily_tasks dt
      LEFT JOIN user_daily_tasks udt ON dt.id = udt.task_id
        AND udt.user_id = $1
        AND udt.task_date = $2
      WHERE dt.is_active = true
    `, [userId, dateStr]);

    const stats = result.rows[0];

    // 获取连续完成天数
    const streakResult = await query(`
      WITH consecutive_days AS (
        SELECT
          task_date,
          LEAD(task_date) OVER (ORDER BY task_date DESC) as prev_date,
          COUNT(*) FILTER (WHERE is_completed = true) as completed_count,
          COUNT(*) as total_count
        FROM user_daily_tasks
        WHERE user_id = $1
          AND task_date <= CURRENT_DATE
        GROUP BY task_date
        HAVING COUNT(*) FILTER (WHERE is_completed = true) = COUNT(*)
      )
      SELECT COUNT(*) as streak
      FROM consecutive_days
      WHERE task_date - prev_date = INTERVAL '1 day' OR prev_date IS NULL
      ORDER BY task_date DESC
    `, [userId]);

    return {
      ...stats,
      completion_rate: stats.total_tasks > 0
        ? (stats.completed_tasks / stats.total_tasks * 100).toFixed(1)
        : 0,
      streak: streakResult.rows[0]?.streak || 0
    };
  }

  // 6. 重置过期任务（定时任务调用）
  async resetExpiredTasks() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 这里可以添加清理逻辑，但通常保留历史记录
    // 新的一天会自动创建新的任务记录

    return { success: true, message: '任务重置完成' };
  }
}

export const dailyTaskService = new DailyTaskService();
