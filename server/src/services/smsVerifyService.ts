/**
 * 短信验证码服务
 * 负责验证码的生成、存储、验证和清理
 */

import { query } from '../config/database';
import { getTencentSMSService } from './tencentSMSService';
import { AppError } from '../utils/errorHandler';

interface SendSMSCodeOptions {
  phone: string;
  purpose?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface VerifySMSCodeOptions {
  phone: string;
  code: string;
  purpose?: string;
}

export class SMSVerifyService {
  // 验证码长度
  private readonly CODE_LENGTH = 6;

  // 验证码有效期(分钟)
  private readonly CODE_EXPIRE_MINUTES = 5;

  // 同一手机号发送间隔(秒)
  private readonly SEND_INTERVAL_SECONDS = 60;

  // 每日发送上限
  private readonly DAILY_SEND_LIMIT = 10;

  /**
   * 生成随机验证码
   */
  private generateCode(): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }

  /**
   * 验证手机号格式
   */
  private validatePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 检查发送频率限制
   */
  private async checkSendFrequency(phone: string): Promise<void> {
    // 检查最近一次发送时间
    const recentResult = await query(
      `SELECT created_at FROM sms_verify_codes
       WHERE phone = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    );

    if (recentResult.rows.length > 0) {
      const lastSendTime = new Date(recentResult.rows[0].created_at);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastSendTime.getTime()) / 1000;

      if (diffSeconds < this.SEND_INTERVAL_SECONDS) {
        const waitSeconds = Math.ceil(this.SEND_INTERVAL_SECONDS - diffSeconds);
        throw new AppError(`请${waitSeconds}秒后再试`, 429);
      }
    }

    // 检查今日发送次数
    const todayResult = await query(
      `SELECT COUNT(*) as count FROM sms_verify_codes
       WHERE phone = $1
       AND created_at >= CURRENT_DATE`,
      [phone]
    );

    const todayCount = parseInt(todayResult.rows[0].count);
    if (todayCount >= this.DAILY_SEND_LIMIT) {
      throw new AppError('今日发送次数已达上限', 429);
    }
  }

  /**
   * 发送短信验证码
   */
  async sendVerifyCode(options: SendSMSCodeOptions): Promise<{ success: boolean; message: string }> {
    const { phone, purpose = 'login', ipAddress, userAgent } = options;

    try {
      // 验证手机号格式
      if (!this.validatePhone(phone)) {
        throw new AppError('手机号格式不正确', 400);
      }

      // 检查发送频率
      await this.checkSendFrequency(phone);

      // 生成验证码
      const code = this.generateCode();

      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRE_MINUTES);

      // 保存到数据库
      await query(
        `INSERT INTO sms_verify_codes (phone, code, purpose, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [phone, code, purpose, ipAddress, userAgent, expiresAt]
      );

      // 发送短信
      const smsService = getTencentSMSService();
      const result = await smsService.sendVerifyCode(phone, code, this.CODE_EXPIRE_MINUTES);

      // 记录发送日志
      await query(
        `INSERT INTO sms_send_logs (phone, purpose, status, error_message, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          phone,
          purpose,
          result.success ? 'success' : 'failed',
          result.error || null,
          ipAddress
        ]
      );

      if (!result.success) {
        throw new AppError(result.error || '短信发送失败', 500);
      }

      return {
        success: true,
        message: `验证码已发送至${phone},${this.CODE_EXPIRE_MINUTES}分钟内有效`
      };
    } catch (error: any) {
      console.error('发送短信验证码失败:', error);

      // 记录失败日志
      try {
        await query(
          `INSERT INTO sms_send_logs (phone, purpose, status, error_message, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [phone, purpose, 'failed', error.message, ipAddress]
        );
      } catch (logError) {
        console.error('记录短信发送日志失败:', logError);
      }

      throw error;
    }
  }

  /**
   * 验证短信验证码
   */
  async verifyCode(options: VerifySMSCodeOptions): Promise<boolean> {
    const { phone, code, purpose = 'login' } = options;

    try {
      // 查询验证码
      const result = await query(
        `SELECT id, code, expires_at, is_used
         FROM sms_verify_codes
         WHERE phone = $1
         AND purpose = $2
         AND is_used = FALSE
         ORDER BY created_at DESC
         LIMIT 1`,
        [phone, purpose]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const record = result.rows[0];

      // 检查是否过期
      const now = new Date();
      const expiresAt = new Date(record.expires_at);
      if (now > expiresAt) {
        return false;
      }

      // 验证码比对
      if (record.code !== code) {
        return false;
      }

      // 标记为已使用
      await query(
        `UPDATE sms_verify_codes
         SET is_used = TRUE, used_at = NOW()
         WHERE id = $1`,
        [record.id]
      );

      return true;
    } catch (error: any) {
      console.error('验证短信验证码失败:', error);
      throw new AppError('验证码验证失败', 500);
    }
  }

  /**
   * 清理过期验证码
   */
  async cleanExpiredCodes(): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM sms_verify_codes
         WHERE expires_at < NOW()
         OR (is_used = TRUE AND used_at < NOW() - INTERVAL '7 days')`
      );

      return result.rowCount || 0;
    } catch (error: any) {
      console.error('清理过期验证码失败:', error);
      return 0;
    }
  }

  /**
   * 获取手机号今日发送次数
   */
  async getTodaySendCount(phone: string): Promise<number> {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM sms_verify_codes
         WHERE phone = $1
         AND created_at >= CURRENT_DATE`,
        [phone]
      );

      return parseInt(result.rows[0].count);
    } catch (error: any) {
      console.error('获取今日发送次数失败:', error);
      return 0;
    }
  }

  /**
   * 获取发送统计
   */
  async getSendStats(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const params: any[] = [];
      let whereClause = '';

      if (startDate) {
        params.push(startDate);
        whereClause += ` AND created_at >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        whereClause += ` AND created_at <= $${params.length}`;
      }

      const result = await query(
        `SELECT
           COUNT(*) as total_count,
           COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
           COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
           COUNT(DISTINCT phone) as unique_phones
         FROM sms_send_logs
         WHERE 1=1 ${whereClause}`,
        params
      );

      return result.rows[0];
    } catch (error: any) {
      console.error('获取发送统计失败:', error);
      return null;
    }
  }
}

// 导出单例
export const smsVerifyService = new SMSVerifyService();

// 导出便捷函数
export async function sendSMSCode(options: SendSMSCodeOptions) {
  return smsVerifyService.sendVerifyCode(options);
}

export async function verifySMSCode(options: VerifySMSCodeOptions) {
  return smsVerifyService.verifyCode(options);
}
