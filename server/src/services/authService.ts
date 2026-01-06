import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { config } from '../config';
import { AppError } from '../utils/errorHandler';

export interface RegisterInput {
  phone?: string;
  email?: string;
  password: string;
  nickname?: string;
}

export interface LoginInput {
  phone?: string;
  email?: string;
  password: string;
}

export class AuthService {
  // 验证手机号格式
  private validatePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 验证邮箱格式
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证密码强度
  private validatePassword(password: string): boolean {
    // 至少8位，包含大小写字母和数字
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  }

  // 生成JWT令牌
  private generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }

  // 用户注册
  async register(input: RegisterInput) {
    const { phone, email, password, nickname } = input;

    // 必须提供手机号或邮箱
    if (!phone && !email) {
      throw new AppError('请提供手机号或邮箱', 400);
    }

    // 验证手机号（如果提供）
    if (phone && !this.validatePhone(phone)) {
      throw new AppError('手机号格式不正确', 400);
    }

    // 验证邮箱（如果提供）
    if (email && !this.validateEmail(email)) {
      throw new AppError('邮箱格式不正确', 400);
    }

    // 验证密码
    if (!this.validatePassword(password)) {
      throw new AppError('密码至少8位，需包含大小写字母和数字', 400);
    }

    // 检查手机号或邮箱是否已注册
    let existingUser;
    if (phone) {
      existingUser = await query(
        'SELECT id FROM users WHERE phone = $1',
        [phone]
      );
      if (existingUser.rows.length > 0) {
        throw new AppError('该手机号已注册', 400);
      }
    }

    if (email) {
      existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      if (existingUser.rows.length > 0) {
        throw new AppError('该邮箱已注册', 400);
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await query(
      `INSERT INTO users (phone, email, password, nickname)
       VALUES ($1, $2, $3, $4)
       RETURNING id, phone, email, nickname, avatar, bio, created_at`,
      [phone || null, email || null, hashedPassword, nickname || `用户${(phone || email)?.slice(-4)}`]
    );

    const user = result.rows[0];
    const tokens = this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.created_at,
      },
      ...tokens,
    };
  }

  // 用户登录
  async login(input: LoginInput) {
    const { phone, email, password } = input;

    // 必须提供手机号或邮箱
    if (!phone && !email) {
      throw new AppError('请提供手机号或邮箱', 400);
    }

    // 查找用户
    let result;
    if (phone) {
      result = await query(
        'SELECT * FROM users WHERE phone = $1',
        [phone]
      );
    } else if (email) {
      result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
    }

    if (!result || result.rows.length === 0) {
      throw new AppError('账号或密码错误', 401);
    }

    const user = result.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError('账号或密码错误', 401);
    }

    // 更新最后登录时间
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const tokens = this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.created_at,
      },
      ...tokens,
    };
  }

  // 刷新令牌
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret
      ) as { userId: string };

      // 验证用户是否存在
      const result = await query(
        'SELECT id FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        throw new AppError('用户不存在', 401);
      }

      const tokens = this.generateTokens(decoded.userId);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('无效的刷新令牌', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('刷新令牌已过期，请重新登录', 401);
      }
      throw error;
    }
  }

  // 修改密码
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // 验证新密码
    if (!this.validatePassword(newPassword)) {
      throw new AppError('新密码至少8位，需包含大小写字母和数字', 400);
    }

    // 获取用户
    const result = await query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('用户不存在', 404);
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, result.rows[0].password);

    if (!isValidPassword) {
      throw new AppError('原密码错误', 400);
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    return { message: '密码修改成功' };
  }
}

export const authService = new AuthService();
