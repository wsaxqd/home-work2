// 学习数据统计服务
import { query } from '../config/database';

export class LearningAnalyticsService {
  // 1. 获取用户学习概览(最近7天)
  async getUserLearningOverview(userId: string, days: number = 7) {
    const result = await query(`
      SELECT
        stat_date,
        total_learning_time,
        reading_time,
        game_time,
        ai_chat_time,
        creation_time,
        learning_sessions,
        questions_answered,
        questions_correct,
        points_earned,
        books_read,
        games_played,
        works_created
      FROM learning_statistics
      WHERE user_id = $1
        AND stat_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY stat_date DESC
    `, [userId]);

    return result.rows;
  }

  // 2. 获取今日学习统计
  async getTodayStatistics(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const result = await query(`
      SELECT * FROM learning_statistics
      WHERE user_id = $1 AND stat_date = $2
    `, [userId, today]);

    if (result.rows.length === 0) {
      // 如果今天还没有记录,创建一个空记录
      await this.initTodayStatistics(userId);
      return await this.getTodayStatistics(userId);
    }

    return result.rows[0];
  }

  // 3. 初始化今日统计
  async initTodayStatistics(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    await query(`
      INSERT INTO learning_statistics (user_id, stat_date)
      VALUES ($1, $2)
      ON CONFLICT (user_id, stat_date) DO NOTHING
    `, [userId, today]);
  }

  // 4. 更新学习时长
  async updateLearningTime(userId: string, activityType: string, duration: number) {
    const today = new Date().toISOString().split('T')[0];

    await this.initTodayStatistics(userId);

    const fieldMap: Record<string, string> = {
      'reading': 'reading_time',
      'game': 'game_time',
      'ai_chat': 'ai_chat_time',
      'creation': 'creation_time'
    };

    const field = fieldMap[activityType] || 'total_learning_time';

    await query(`
      UPDATE learning_statistics
      SET ${field} = ${field} + $1,
          total_learning_time = total_learning_time + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND stat_date = $3
    `, [duration, userId, today]);
  }

  // 5. 记录学习行为
  async logBehavior(userId: string, behaviorData: {
    behavior_type: string;
    action: string;
    content_id?: string;
    content_type?: string;
    content_title?: string;
    duration?: number;
    progress?: number;
    result?: any;
  }) {
    await query(`
      INSERT INTO learning_behavior_logs (
        user_id, behavior_type, action, content_id, content_type,
        content_title, duration, progress, result
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      userId,
      behaviorData.behavior_type,
      behaviorData.action,
      behaviorData.content_id,
      behaviorData.content_type,
      behaviorData.content_title,
      behaviorData.duration,
      behaviorData.progress,
      behaviorData.result ? JSON.stringify(behaviorData.result) : null
    ]);
  }

  // 6. 获取学习报告
  async getLearningReport(userId: string, startDate: string, endDate: string) {
    // 总体统计
    const summaryResult = await query(`
      SELECT
        SUM(total_learning_time) as total_time,
        SUM(learning_sessions) as total_sessions,
        SUM(questions_answered) as total_questions,
        SUM(questions_correct) as total_correct,
        SUM(points_earned) as total_points,
        AVG(accuracy_rate) as avg_accuracy
      FROM learning_statistics
      WHERE user_id = $1
        AND stat_date BETWEEN $2 AND $3
    `, [userId, startDate, endDate]);

    // 每日数据
    const dailyResult = await query(`
      SELECT * FROM learning_statistics
      WHERE user_id = $1
        AND stat_date BETWEEN $2 AND $3
      ORDER BY stat_date ASC
    `, [userId, startDate, endDate]);

    return {
      summary: summaryResult.rows[0],
      dailyData: dailyResult.rows
    };
  }

  // 7. 获取学习排行(本周/本月)
  async getLeaderboard(period: 'week' | 'month', limit: number = 10) {
    const interval = period === 'week' ? '7 days' : '30 days';

    const result = await query(`
      SELECT
        u.id,
        u.username,
        u.avatar,
        SUM(ls.total_learning_time) as total_time,
        SUM(ls.points_earned) as total_points,
        COUNT(DISTINCT ls.stat_date) as active_days
      FROM learning_statistics ls
      JOIN users u ON ls.user_id = u.id
      WHERE ls.stat_date >= CURRENT_DATE - INTERVAL '${interval}'
      GROUP BY u.id, u.username, u.avatar
      ORDER BY total_time DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map((row, index) => ({
      ...row,
      rank: index + 1
    }));
  }

  // 8. 获取学习仪表盘数据(综合数据)
  async getDashboardData(userId: string) {
    // 今日数据
    const today = await this.getTodayStatistics(userId);

    // 最近7天趋势
    const weeklyTrend = await query(`
      SELECT
        stat_date,
        total_learning_time,
        points_earned,
        questions_answered,
        questions_correct
      FROM learning_statistics
      WHERE user_id = $1
        AND stat_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY stat_date ASC
    `, [userId]);

    // 连续学习天数
    const streakResult = await query(`
      WITH RECURSIVE date_series AS (
        SELECT CURRENT_DATE as check_date
        UNION ALL
        SELECT check_date - INTERVAL '1 day'
        FROM date_series
        WHERE check_date > CURRENT_DATE - INTERVAL '30 days'
      ),
      learning_dates AS (
        SELECT DISTINCT stat_date
        FROM learning_statistics
        WHERE user_id = $1
          AND total_learning_time > 0
          AND stat_date >= CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT COUNT(*) as streak_days
      FROM date_series ds
      WHERE EXISTS (
        SELECT 1 FROM learning_dates ld
        WHERE ld.stat_date = ds.check_date
      )
      AND ds.check_date <= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM date_series ds2
        WHERE ds2.check_date < ds.check_date
          AND ds2.check_date >= CURRENT_DATE - INTERVAL '30 days'
          AND NOT EXISTS (
            SELECT 1 FROM learning_dates ld2
            WHERE ld2.stat_date = ds2.check_date
          )
      )
    `, [userId]);

    // 用户等级和积分
    const pointsResult = await query(`
      SELECT
        u.points,
        lc.level,
        lc.name as level_name,
        lc.required_points,
        lc.next_level_points
      FROM users u
      LEFT JOIN level_configs lc ON u.points >= lc.required_points
        AND (lc.next_level_points IS NULL OR u.points < lc.next_level_points)
      WHERE u.id = $1
    `, [userId]);

    // 本周排名
    const myRank = await query(`
      WITH ranked_users AS (
        SELECT
          user_id,
          SUM(total_learning_time) as total_time,
          RANK() OVER (ORDER BY SUM(total_learning_time) DESC) as rank
        FROM learning_statistics
        WHERE stat_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY user_id
      )
      SELECT rank, total_time
      FROM ranked_users
      WHERE user_id = $1
    `, [userId]);

    // 今日任务完成情况
    const todayTasks = await query(`
      SELECT
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE udt.is_completed = true) as completed_tasks
      FROM daily_tasks dt
      LEFT JOIN user_daily_tasks udt ON dt.id = udt.task_id
        AND udt.user_id = $1
        AND udt.task_date = CURRENT_DATE
      WHERE dt.is_active = true
    `, [userId]);

    // 最近获得的成就
    const recentAchievements = await query(`
      SELECT
        a.name,
        a.icon,
        a.rarity,
        ua.unlocked_at
      FROM user_achievements ua
      JOIN achievements_new a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1
      ORDER BY ua.unlocked_at DESC
      LIMIT 3
    `, [userId]);

    return {
      today,
      weeklyTrend: weeklyTrend.rows,
      streakDays: streakResult.rows[0]?.streak_days || 0,
      points: pointsResult.rows[0] || { points: 0, level: 1, level_name: '初学者' },
      rank: myRank.rows[0] || { rank: null, total_time: 0 },
      tasks: todayTasks.rows[0] || { total_tasks: 0, completed_tasks: 0 },
      recentAchievements: recentAchievements.rows
    };
  }
}

export const learningAnalyticsService = new LearningAnalyticsService();
