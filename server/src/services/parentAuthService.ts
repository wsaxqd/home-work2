import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { verifyCode as verifyEmailCode } from './emailVerifyService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface ParentRegisterData {
  phone: string;
  password: string;
  name?: string;
  email?: string;
  verifyCode?: string;
  childAccount?: string;
}

export interface ParentLoginData {
  phone: string;
  password: string;
}

class ParentAuthService {
  // 家长注册
  async register(data: ParentRegisterData) {
    const { phone, password, name, email, verifyCode, childAccount } = data;

    // 验证邮箱验证码
    if (email && verifyCode) {
      const isValid = await verifyEmailCode(email, verifyCode);
      if (!isValid) {
        throw new Error('验证码无效或已过期');
      }
    }

    // 检查手机号是否已注册
    const existingParent = await pool.query(
      'SELECT id FROM parents WHERE phone = $1',
      [phone]
    );

    if (existingParent.rows.length > 0) {
      throw new Error('该手机号已注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建家长账号
    const result = await pool.query(
      `INSERT INTO parents (phone, password, name, email)
       VALUES ($1, $2, $3, $4)
       RETURNING id, phone, name, email, created_at`,
      [phone, hashedPassword, name || '家长', email]
    );

    const parent = result.rows[0];

    // 如果提供了孩子账号，尝试绑定
    if (childAccount) {
      try {
        const userResult = await pool.query(
          'SELECT id, username, age FROM users WHERE username = $1',
          [childAccount]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          await pool.query(
            `INSERT INTO children (parent_id, user_id, nickname, age)
             VALUES ($1, $2, $3, $4)`,
            [parent.id, user.id, user.username, user.age]
          );
        }
      } catch (error) {
        console.error('绑定孩子账号失败:', error);
        // 绑定失败不影响注册
      }
    }

    // 生成 JWT token
    const token = jwt.sign(
      { parentId: parent.id, phone: parent.phone, type: 'parent' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      parent,
      token
    };
  }

  // 家长登录
  async login(data: ParentLoginData) {
    const { phone, password } = data;

    // 查找家长账号
    const result = await pool.query(
      'SELECT * FROM parents WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      throw new Error('手机号或密码错误');
    }

    const parent = result.rows[0];

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, parent.password);

    if (!isPasswordValid) {
      throw new Error('手机号或密码错误');
    }

    // 生成 JWT token
    const token = jwt.sign(
      { parentId: parent.id, phone: parent.phone, type: 'parent' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 返回不包含密码的家长信息
    const { password: _, ...parentWithoutPassword } = parent;

    return {
      parent: parentWithoutPassword,
      token
    };
  }

  // 验证token
  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (decoded.type !== 'parent') {
        throw new Error('无效的token类型');
      }

      // 查询家长信息
      const result = await pool.query(
        'SELECT id, phone, name, email, avatar, notification_settings, created_at FROM parents WHERE id = $1',
        [decoded.parentId]
      );

      if (result.rows.length === 0) {
        throw new Error('家长账号不存在');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error('无效的token');
    }
  }

  // 修改密码
  async changePassword(parentId: number, oldPassword: string, newPassword: string) {
    // 获取当前密码
    const result = await pool.query(
      'SELECT password FROM parents WHERE id = $1',
      [parentId]
    );

    if (result.rows.length === 0) {
      throw new Error('家长账号不存在');
    }

    const parent = result.rows[0];

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, parent.password);

    if (!isPasswordValid) {
      throw new Error('原密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.query(
      'UPDATE parents SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, parentId]
    );

    return { success: true };
  }

  // 更新个人信息
  async updateProfile(parentId: number, data: { name?: string; email?: string; avatar?: string }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }

    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(data.email);
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

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(parentId);

    const result = await pool.query(
      `UPDATE parents SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, phone, name, email, avatar, created_at`,
      values
    );

    return result.rows[0];
  }

  // 更新通知设置
  async updateNotificationSettings(parentId: number, settings: any) {
    const result = await pool.query(
      `UPDATE parents SET notification_settings = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING notification_settings`,
      [JSON.stringify(settings), parentId]
    );

    return result.rows[0].notification_settings;
  }
}

export const parentAuthService = new ParentAuthService();
