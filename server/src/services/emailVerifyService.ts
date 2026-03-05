import { query } from '../config/database';
import { emailService } from './emailService';
import { AppError } from '../utils/errorHandler';

// 生成6位随机验证码
function generateVerifyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送邮箱验证码
export async function sendVerifyCode(email: string, purpose: string = 'register'): Promise<void> {
  // 检查发送频率限制 (60秒内只能发送一次)
  const recentResult = await query(
    `SELECT * FROM email_verify_codes
     WHERE email = $1 AND created_at > NOW() - INTERVAL '60 seconds'
     ORDER BY created_at DESC
     LIMIT 1`,
    [email]
  );

  if (recentResult.rows.length > 0) {
    const lastSentAt = new Date(recentResult.rows[0].created_at);
    const waitSeconds = Math.ceil((60 - (Date.now() - lastSentAt.getTime()) / 1000));
    throw new AppError(`发送过于频繁,请${waitSeconds}秒后再试`, 429);
  }

  // 生成验证码
  const code = generateVerifyCode();

  // 设置过期时间（10分钟后）
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // 保存验证码到数据库
  await query(
    `INSERT INTO email_verify_codes (email, code, expires_at)
     VALUES ($1, $2, $3)`,
    [email, code, expiresAt]
  );

  // 发送邮件
  try {
    await emailService.sendVerificationCode(email, code);
    console.log(`✅ 验证码邮件已发送: ${email}`);
  } catch (error) {
    console.error(`❌ 验证码邮件发送失败: ${email}`, error);
    // 即使邮件发送失败,也打印验证码以便开发调试
    console.log(`📧 验证码(调试用): ${email} -> ${code} (有效期10分钟)`);
  }
}

// 验证邮箱验证码
export async function verifyCode(email: string, code: string, purpose: string = 'register'): Promise<boolean> {
  // 查找未使用且未过期的验证码
  const result = await query(
    `SELECT * FROM email_verify_codes
     WHERE email = $1 AND code = $2 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, code]
  );

  if (result.rows.length === 0) {
    return false;
  }

  // 标记验证码为已使用
  await query(
    `UPDATE email_verify_codes SET used = true WHERE id = $1`,
    [result.rows[0].id]
  );

  return true;
}
