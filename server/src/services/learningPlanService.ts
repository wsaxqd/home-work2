// 智能学习计划服务
import { query } from '../config/database';

export class LearningPlanService {
  // 1. 创建学习计划
  async createPlan(userId: string, planData: {
    title: string;
    description?: string;
    plan_type?: 'auto' | 'manual';
    start_date: string;
    end_date: string;
    target_subjects?: string[];
    target_skills?: string[];
    daily_learning_time?: number;
    difficulty_level?: number;
    learning_pace?: 'slow' | 'normal' | 'fast';
  }) {
    const result = await query(`
      INSERT INTO learning_plans (
        user_id, title, description, plan_type,
        start_date, end_date, target_subjects, target_skills,
        daily_learning_time, difficulty_level, learning_pace
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      userId,
      planData.title,
      planData.description,
      planData.plan_type || 'manual',
      planData.start_date,
      planData.end_date,
      JSON.stringify(planData.target_subjects || []),
      JSON.stringify(planData.target_skills || []),
      planData.daily_learning_time || 30,
      planData.difficulty_level || 3,
      planData.learning_pace || 'normal'
    ]);

    return result.rows[0];
  }

  // 2. 获取用户的学习计划列表
  async getUserPlans(userId: string, status?: string) {
    let sql = `
      SELECT * FROM learning_plans
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (status) {
      sql += ` AND status = $2`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  // 3. 获取计划详情
  async getPlanDetail(planId: string, userId: string) {
    const result = await query(`
      SELECT * FROM learning_plans
      WHERE id = $1 AND user_id = $2
    `, [planId, userId]);

    if (result.rows.length === 0) {
      throw new Error('计划不存在或无权访问');
    }

    return result.rows[0];
  }

  // 4. 添加计划任务
  async addPlanTask(planId: string, userId: string, taskData: {
    title: string;
    description?: string;
    task_type: string;
    content_id?: string;
    content_type?: string;
    subject?: string;
    scheduled_date: string;
    scheduled_time?: string;
    estimated_duration?: number;
    order_index?: number;
  }) {
    const result = await query(`
      INSERT INTO learning_plan_tasks (
        plan_id, user_id, title, description, task_type,
        content_id, content_type, subject, scheduled_date,
        scheduled_time, estimated_duration, order_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      planId,
      userId,
      taskData.title,
      taskData.description,
      taskData.task_type,
      taskData.content_id,
      taskData.content_type,
      taskData.subject,
      taskData.scheduled_date,
      taskData.scheduled_time,
      taskData.estimated_duration,
      taskData.order_index || 0
    ]);

    return result.rows[0];
  }

  // 5. 获取计划任务列表
  async getPlanTasks(planId: string, userId: string, date?: string) {
    let sql = `
      SELECT * FROM learning_plan_tasks
      WHERE plan_id = $1 AND user_id = $2
    `;
    const params: any[] = [planId, userId];

    if (date) {
      sql += ` AND scheduled_date = $3`;
      params.push(date);
    }

    sql += ` ORDER BY scheduled_date ASC, order_index ASC`;

    const result = await query(sql, params);
    return result.rows;
  }

  // 6. 获取今日任务
  async getTodayTasks(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const result = await query(`
      SELECT
        t.*,
        p.title as plan_title
      FROM learning_plan_tasks t
      JOIN learning_plans p ON t.plan_id = p.id
      WHERE t.user_id = $1
        AND t.scheduled_date = $2
        AND p.status = 'active'
      ORDER BY t.order_index ASC
    `, [userId, today]);

    return result.rows;
  }

  // 7. 完成任务
  async completeTask(taskId: string, userId: string, completionData: {
    actual_duration?: number;
    score?: number;
    accuracy?: number;
  }) {
    const result = await query(`
      UPDATE learning_plan_tasks
      SET
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        actual_duration = $3,
        score = $4,
        accuracy = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [
      taskId,
      userId,
      completionData.actual_duration,
      completionData.score,
      completionData.accuracy
    ]);

    if (result.rows.length === 0) {
      throw new Error('任务不存在或无权访问');
    }

    // 更新计划完成率
    const task = result.rows[0];
    await this.updatePlanProgress(task.plan_id);

    return task;
  }

  // 8. 更新计划进度
  async updatePlanProgress(planId: string) {
    const result = await query(`
      SELECT
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks
      FROM learning_plan_tasks
      WHERE plan_id = $1
    `, [planId]);

    const { total_tasks, completed_tasks } = result.rows[0];
    const completion_rate = total_tasks > 0
      ? Math.round((completed_tasks / total_tasks) * 100)
      : 0;

    await query(`
      UPDATE learning_plans
      SET completion_rate = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [planId, completion_rate]);

    return completion_rate;
  }

  // 9. 获取能力评估
  async getAbilityAssessment(userId: string, subject?: string) {
    let sql = `
      SELECT * FROM learning_ability_assessment
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (subject) {
      sql += ` AND subject = $2`;
      params.push(subject);
    }

    sql += ` ORDER BY mastery_level DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  // 10. 更新能力评估
  async updateAbilityAssessment(
    userId: string,
    subject: string,
    skillName: string,
    assessmentData: {
      practice_count?: number;
      success_count?: number;
      accuracy?: number;
    }
  ) {
    // 检查是否存在
    const existing = await query(`
      SELECT * FROM learning_ability_assessment
      WHERE user_id = $1 AND subject = $2 AND skill_name = $3
    `, [userId, subject, skillName]);

    if (existing.rows.length === 0) {
      // 创建新记录
      const result = await query(`
        INSERT INTO learning_ability_assessment (
          user_id, subject, skill_name,
          practice_count, success_count, avg_accuracy,
          last_assessed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        userId,
        subject,
        skillName,
        assessmentData.practice_count || 1,
        assessmentData.success_count || 0,
        assessmentData.accuracy || 0
      ]);
      return result.rows[0];
    } else {
      // 更新现有记录
      const current = existing.rows[0];
      const newPracticeCount = current.practice_count + (assessmentData.practice_count || 1);
      const newSuccessCount = current.success_count + (assessmentData.success_count || 0);
      const newAvgAccuracy = assessmentData.accuracy !== undefined
        ? (current.avg_accuracy * current.practice_count + assessmentData.accuracy) / newPracticeCount
        : current.avg_accuracy;

      const result = await query(`
        UPDATE learning_ability_assessment
        SET
          practice_count = $4,
          success_count = $5,
          avg_accuracy = $6,
          last_assessed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND subject = $2 AND skill_name = $3
        RETURNING *
      `, [userId, subject, skillName, newPracticeCount, newSuccessCount, newAvgAccuracy]);

      return result.rows[0];
    }
  }

  // 11. AI生成学习计划(简化版)
  async generateAIPlan(userId: string, preferences: {
    subjects: string[];
    daily_time: number;
    difficulty_level: number;
    start_date: string;
    duration_days: number;
  }) {
    // 根据用户能力评估生成计划
    const abilities = await this.getAbilityAssessment(userId);

    // 计算结束日期
    const startDate = new Date(preferences.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + preferences.duration_days);

    // 创建计划
    const plan = await this.createPlan(userId, {
      title: `${preferences.duration_days}天AI学习计划`,
      description: `根据你的学习能力和目标自动生成的个性化计划`,
      plan_type: 'auto',
      start_date: preferences.start_date,
      end_date: endDate.toISOString().split('T')[0],
      target_subjects: preferences.subjects,
      daily_learning_time: preferences.daily_time,
      difficulty_level: preferences.difficulty_level,
      learning_pace: preferences.daily_time > 60 ? 'fast' : 'normal'
    });

    // 为每一天生成任务
    for (let i = 0; i < preferences.duration_days; i++) {
      const taskDate = new Date(startDate);
      taskDate.setDate(taskDate.getDate() + i);
      const dateStr = taskDate.toISOString().split('T')[0];

      // 为每个学科创建任务
      for (const subject of preferences.subjects) {
        await this.addPlanTask(plan.id, userId, {
          title: `${subject}学习`,
          description: `今日${subject}练习`,
          task_type: 'practice',
          subject: subject,
          scheduled_date: dateStr,
          estimated_duration: Math.floor(preferences.daily_time / preferences.subjects.length),
          order_index: preferences.subjects.indexOf(subject)
        });
      }
    }

    return plan;
  }

  // 12. 删除计划
  async deletePlan(planId: string, userId: string) {
    const result = await query(`
      DELETE FROM learning_plans
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [planId, userId]);

    if (result.rows.length === 0) {
      throw new Error('计划不存在或无权删除');
    }

    return true;
  }

  // 13. 暂停/恢复计划
  async togglePlanStatus(planId: string, userId: string) {
    const plan = await this.getPlanDetail(planId, userId);

    const newStatus = plan.status === 'active' ? 'paused' : 'active';

    const result = await query(`
      UPDATE learning_plans
      SET status = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [planId, userId, newStatus]);

    return result.rows[0];
  }
}

export const learningPlanService = new LearningPlanService();
