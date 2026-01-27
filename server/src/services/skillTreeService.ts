// 技能树 & 学习路径服务
import { query } from '../config/database';

export class SkillTreeService {
  // 1. 获取技能树节点列表
  async getSkillNodes(subject?: string, gradeLevel?: number) {
    let sql = `
      SELECT * FROM skill_tree_nodes
      WHERE is_active = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (subject) {
      sql += ` AND subject = $${paramIndex}`;
      params.push(subject);
      paramIndex++;
    }

    if (gradeLevel) {
      sql += ` AND grade_level = $${paramIndex}`;
      params.push(gradeLevel);
    }

    sql += ` ORDER BY depth_level ASC, display_order ASC`;

    const result = await query(sql, params);
    return result.rows;
  }

  // 2. 获取单个节点详情
  async getNodeDetail(nodeId: string) {
    const result = await query(`
      SELECT * FROM skill_tree_nodes
      WHERE id = $1
    `, [nodeId]);

    if (result.rows.length === 0) {
      throw new Error('节点不存在');
    }

    return result.rows[0];
  }

  // 3. 获取用户技能树进度
  async getUserProgress(userId: string, subject?: string) {
    let sql = `
      SELECT
        usp.*,
        stn.node_name,
        stn.icon,
        stn.color,
        stn.subject,
        stn.category,
        stn.unlock_points,
        stn.unlock_badge
      FROM user_skill_progress usp
      JOIN skill_tree_nodes stn ON usp.node_id = stn.id
      WHERE usp.user_id = $1
    `;
    const params: any[] = [userId];

    if (subject) {
      sql += ` AND stn.subject = $2`;
      params.push(subject);
    }

    sql += ` ORDER BY usp.updated_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  // 4. 检查节点是否可解锁
  async canUnlockNode(userId: string, nodeId: string): Promise<boolean> {
    const node = await this.getNodeDetail(nodeId);

    // 如果没有前置节点,可以解锁
    if (!node.parent_nodes || node.parent_nodes.length === 0) {
      return true;
    }

    // 检查所有前置节点是否已完成
    const result = await query(`
      SELECT COUNT(*) as completed_count
      FROM user_skill_progress
      WHERE user_id = $1
        AND node_id = ANY($2::uuid[])
        AND is_completed = true
    `, [userId, node.parent_nodes]);

    const completedCount = parseInt(result.rows[0].completed_count);
    return completedCount === node.parent_nodes.length;
  }

  // 5. 解锁节点
  async unlockNode(userId: string, nodeId: string) {
    // 检查是否可以解锁
    const canUnlock = await this.canUnlockNode(userId, nodeId);
    if (!canUnlock) {
      throw new Error('前置节点未完成,无法解锁');
    }

    // 检查是否已经解锁
    const existing = await query(`
      SELECT * FROM user_skill_progress
      WHERE user_id = $1 AND node_id = $2
    `, [userId, nodeId]);

    if (existing.rows.length > 0 && existing.rows[0].is_unlocked) {
      return existing.rows[0];
    }

    // 解锁节点
    const result = await query(`
      INSERT INTO user_skill_progress (
        user_id, node_id, is_unlocked, unlocked_at
      ) VALUES ($1, $2, true, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, node_id)
      DO UPDATE SET
        is_unlocked = true,
        unlocked_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, nodeId]);

    // 奖励积分
    const node = await this.getNodeDetail(nodeId);
    if (node.unlock_points > 0) {
      await query(`
        UPDATE users
        SET points = points + $2
        WHERE id = $1
      `, [userId, node.unlock_points]);
    }

    return result.rows[0];
  }

  // 6. 更新节点学习进度
  async updateNodeProgress(
    userId: string,
    nodeId: string,
    progressData: {
      practice_count?: number;
      success_count?: number;
      time_spent?: number;
    }
  ) {
    // 获取节点要求
    const node = await this.getNodeDetail(nodeId);

    // 获取当前进度
    const current = await query(`
      SELECT * FROM user_skill_progress
      WHERE user_id = $1 AND node_id = $2
    `, [userId, nodeId]);

    if (current.rows.length === 0) {
      throw new Error('节点未解锁');
    }

    const progress = current.rows[0];

    // 更新统计
    const newPracticeCount = progress.practice_count + (progressData.practice_count || 0);
    const newSuccessCount = progress.success_count + (progressData.success_count || 0);
    const newTimeSpent = progress.total_time_spent + (progressData.time_spent || 0);
    const newAccuracy = newPracticeCount > 0
      ? (newSuccessCount / newPracticeCount) * 100
      : 0;

    // 计算完成度
    let completionPercentage = 0;
    const practiceProgress = Math.min((newPracticeCount / node.min_practice_count) * 100, 100);
    const accuracyProgress = Math.min((newAccuracy / node.min_accuracy) * 100, 100);
    const timeProgress = Math.min((newTimeSpent / node.min_time_spent) * 100, 100);

    completionPercentage = Math.round((practiceProgress + accuracyProgress + timeProgress) / 3);

    // 判断是否完成
    const isCompleted =
      newPracticeCount >= node.min_practice_count &&
      newAccuracy >= node.min_accuracy &&
      newTimeSpent >= node.min_time_spent;

    // 更新进度
    const result = await query(`
      UPDATE user_skill_progress
      SET
        practice_count = $3,
        success_count = $4,
        current_accuracy = $5,
        total_time_spent = $6,
        completion_percentage = $7,
        is_completed = $8,
        completed_at = CASE WHEN $8 = true AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END,
        last_practiced_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND node_id = $2
      RETURNING *
    `, [
      userId,
      nodeId,
      newPracticeCount,
      newSuccessCount,
      newAccuracy,
      newTimeSpent,
      completionPercentage,
      isCompleted
    ]);

    return result.rows[0];
  }

  // 7. 获取推荐学习路径
  async getRecommendedPaths(userId: string, subject?: string) {
    let sql = `
      SELECT * FROM learning_paths
      WHERE is_active = true AND is_recommended = true
    `;
    const params: any[] = [];

    if (subject) {
      sql += ` AND subject = $1`;
      params.push(subject);
    }

    sql += ` ORDER BY difficulty_level ASC`;

    const result = await query(sql, params);
    return result.rows;
  }

  // 8. 开始学习路径
  async startLearningPath(userId: string, pathId: string) {
    // 检查是否已经开始
    const existing = await query(`
      SELECT * FROM user_path_progress
      WHERE user_id = $1 AND path_id = $2
    `, [userId, pathId]);

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // 创建进度记录
    const result = await query(`
      INSERT INTO user_path_progress (
        user_id, path_id, status, started_at
      ) VALUES ($1, $2, 'in_progress', CURRENT_TIMESTAMP)
      RETURNING *
    `, [userId, pathId]);

    return result.rows[0];
  }

  // 9. 获取用户路径进度
  async getUserPathProgress(userId: string) {
    const result = await query(`
      SELECT
        upp.*,
        lp.path_name,
        lp.description,
        lp.subject,
        lp.estimated_days,
        lp.node_sequence
      FROM user_path_progress upp
      JOIN learning_paths lp ON upp.path_id = lp.id
      WHERE upp.user_id = $1
      ORDER BY upp.started_at DESC
    `, [userId]);

    return result.rows;
  }

  // 10. 更新路径进度
  async updatePathProgress(userId: string, pathId: string, nodeIndex: number) {
    // 获取路径信息
    const pathResult = await query(`
      SELECT * FROM learning_paths WHERE id = $1
    `, [pathId]);

    if (pathResult.rows.length === 0) {
      throw new Error('路径不存在');
    }

    const path = pathResult.rows[0];
    const totalNodes = path.node_sequence.length;
    const completionPercentage = Math.round(((nodeIndex + 1) / totalNodes) * 100);
    const isCompleted = nodeIndex + 1 >= totalNodes;

    // 更新进度
    const result = await query(`
      UPDATE user_path_progress
      SET
        current_node_index = $3,
        completion_percentage = $4,
        status = CASE WHEN $5 = true THEN 'completed' ELSE status END,
        completed_at = CASE WHEN $5 = true AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END,
        nodes_completed = $6,
        last_studied_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND path_id = $2
      RETURNING *
    `, [userId, pathId, nodeIndex, completionPercentage, isCompleted, nodeIndex + 1]);

    return result.rows[0];
  }

  // 11. 获取技能树统计
  async getSkillTreeStats(userId: string) {
    const result = await query(`
      SELECT
        COUNT(*) as total_nodes,
        COUNT(*) FILTER (WHERE is_unlocked = true) as unlocked_nodes,
        COUNT(*) FILTER (WHERE is_completed = true) as completed_nodes,
        AVG(completion_percentage) as avg_completion,
        SUM(total_time_spent) as total_time
      FROM user_skill_progress
      WHERE user_id = $1
    `, [userId]);

    return result.rows[0];
  }

  // 12. 评价节点(打星)
  async rateNode(userId: string, nodeId: string, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new Error('评分必须在1-5之间');
    }

    const result = await query(`
      UPDATE user_skill_progress
      SET star_rating = $3, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND node_id = $2
      RETURNING *
    `, [userId, nodeId, rating]);

    if (result.rows.length === 0) {
      throw new Error('节点进度不存在');
    }

    return result.rows[0];
  }
}

export const skillTreeService = new SkillTreeService();
