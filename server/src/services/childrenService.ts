import { pool } from '../config/database';

export interface ChildData {
  nickname: string;
  age: number;
  gender: '男' | '女';
  grade: string;
  avatar: string;
  account: string;
}

class ChildrenService {
  // 获取家长的所有孩子
  async getChildren(parentId: number) {
    const result = await pool.query(
      `SELECT
        c.id,
        c.user_id,
        c.nickname,
        c.age,
        c.gender,
        c.grade,
        c.avatar,
        u.username as account,
        c.bind_time
       FROM children c
       JOIN users u ON c.user_id = u.id
       WHERE c.parent_id = $1
       ORDER BY c.bind_time DESC`,
      [parentId]
    );

    return result.rows;
  }

  // 添加孩子（绑定现有用户）
  async addChild(parentId: number, data: ChildData) {
    const { account, nickname, age, gender, grade, avatar } = data;

    // 查找用户
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [account]
    );

    if (userResult.rows.length === 0) {
      throw new Error('孩子账号不存在');
    }

    const userId = userResult.rows[0].id;

    // 检查是否已经绑定
    const existingChild = await pool.query(
      'SELECT id FROM children WHERE parent_id = $1 AND user_id = $2',
      [parentId, userId]
    );

    if (existingChild.rows.length > 0) {
      throw new Error('该孩子已经绑定');
    }

    // 添加绑定
    const result = await pool.query(
      `INSERT INTO children (parent_id, user_id, nickname, age, gender, grade, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [parentId, userId, nickname, age, gender, grade, avatar]
    );

    // 同时为该孩子创建默认的家长控制设置
    await pool.query(
      `INSERT INTO parental_controls (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    return result.rows[0];
  }

  // 更新孩子信息
  async updateChild(parentId: number, childId: number, data: Partial<ChildData>) {
    // 先验证该孩子是否属于该家长
    const checkResult = await pool.query(
      'SELECT id, user_id FROM children WHERE id = $1 AND parent_id = $2',
      [childId, parentId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('孩子不存在或无权限');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.nickname !== undefined) {
      updates.push(`nickname = $${paramIndex}`);
      values.push(data.nickname);
      paramIndex++;
    }

    if (data.age !== undefined) {
      updates.push(`age = $${paramIndex}`);
      values.push(data.age);
      paramIndex++;
    }

    if (data.gender !== undefined) {
      updates.push(`gender = $${paramIndex}`);
      values.push(data.gender);
      paramIndex++;
    }

    if (data.grade !== undefined) {
      updates.push(`grade = $${paramIndex}`);
      values.push(data.grade);
      paramIndex++;
    }

    if (data.avatar !== undefined) {
      updates.push(`avatar = $${paramIndex}`);
      values.push(data.avatar);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('没有要更新的字段');
    }

    values.push(childId);
    values.push(parentId);

    const result = await pool.query(
      `UPDATE children SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND parent_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // 解绑孩子
  async deleteChild(parentId: number, childId: number) {
    const result = await pool.query(
      'DELETE FROM children WHERE id = $1 AND parent_id = $2 RETURNING *',
      [childId, parentId]
    );

    if (result.rows.length === 0) {
      throw new Error('孩子不存在或无权限');
    }

    return result.rows[0];
  }

  // 获取单个孩子的详细信息
  async getChildDetail(parentId: number, childId: number) {
    const result = await pool.query(
      `SELECT
        c.id,
        c.user_id,
        c.nickname,
        c.age,
        c.gender,
        c.grade,
        c.avatar,
        u.username as account,
        u.email,
        c.bind_time
       FROM children c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1 AND c.parent_id = $2`,
      [childId, parentId]
    );

    if (result.rows.length === 0) {
      throw new Error('孩子不存在或无权限');
    }

    return result.rows[0];
  }

  // 通过用户ID获取孩子信息（供其他服务使用）
  async getChildByUserId(userId: number) {
    const result = await pool.query(
      `SELECT
        c.*,
        u.username as account
       FROM children c
       JOIN users u ON c.user_id = u.id
       WHERE c.user_id = $1
       LIMIT 1`,
      [userId]
    );

    return result.rows[0] || null;
  }
}

export const childrenService = new ChildrenService();
