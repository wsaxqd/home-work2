import { query } from '../config/database';

// 生成6位随机验证码
function generateVerifyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送邮箱验证码
export async function sendVerifyCode(email: string): Promise<void> {
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

  // TODO: 实际发送邮件
  // 这里暂时只是打印到控制台，后续可以集成邮件服务（如 nodemailer）
  console.log(`📧 验证码已生成: ${email} -> ${code} (有效期10分钟)`);
  console.log(`⚠️  注意: 当前为开发模式，验证码已打印到控制台`);
}

// 验证邮箱验证码
export async function verifyCode(email: string, code: string): Promise<boolean> {
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
