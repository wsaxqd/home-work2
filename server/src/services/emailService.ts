import nodemailer from 'nodemailer';
import { config } from '../config';

// 邮件发送服务
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  // 初始化邮件传输器
  private initTransporter() {
    // 检查是否配置了SMTP
    if (!config.email.user || !config.email.password) {
      console.warn('⚠️  SMTP未配置,邮件发送功能将使用模拟模式');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });

      console.log('✅ 邮件服务初始化成功');
    } catch (error) {
      console.error('❌ 邮件服务初始化失败:', error);
      this.transporter = null;
    }
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const subject = '启蒙之光 - 邮箱验证码';
    const html = this.getVerificationEmailTemplate(code);

    return this.sendEmail(email, subject, html);
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(email: string, nickname: string): Promise<boolean> {
    const subject = '欢迎加入启蒙之光!';
    const html = this.getWelcomeEmailTemplate(nickname);

    return this.sendEmail(email, subject, html);
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(email: string, resetCode: string): Promise<boolean> {
    const subject = '启蒙之光 - 密码重置';
    const html = this.getPasswordResetEmailTemplate(resetCode);

    return this.sendEmail(email, subject, html);
  }

  /**
   * 通用邮件发送方法
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    // 如果没有配置SMTP,使用模拟模式
    if (!this.transporter) {
      console.log('\n📧 [模拟邮件发送]');
      console.log(`收件人: ${to}`);
      console.log(`主题: ${subject}`);
      console.log(`内容: ${html.substring(0, 100)}...`);
      console.log('⚠️  注意: 请配置SMTP以启用真实邮件发送\n');
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"启蒙之光" <${config.email.from}>`,
        to,
        subject,
        html,
      });

      console.log('✅ 邮件发送成功:', info.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ 邮件发送失败:', error.message);

      // 发送失败时降级为模拟模式
      console.log('\n📧 [降级为模拟模式]');
      console.log(`收件人: ${to}`);
      console.log(`主题: ${subject}`);
      console.log('⚠️  邮件发送失败,已切换到模拟模式\n');

      return false;
    }
  }

  /**
   * 验证码邮件模板
   */
  private getVerificationEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          .warning { color: #e74c3c; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 启蒙之光</h1>
            <p>儿童AI教育平台</p>
          </div>
          <div class="content">
            <h2>邮箱验证码</h2>
            <p>您好!</p>
            <p>您正在使用邮箱验证码登录启蒙之光平台,您的验证码是:</p>

            <div class="code-box">
              <div class="code">${code}</div>
            </div>

            <p>验证码有效期为 <strong>10分钟</strong>,请尽快完成验证。</p>
            <p class="warning">⚠️ 如果这不是您本人的操作,请忽略此邮件。</p>

            <p style="margin-top: 30px;">祝您使用愉快!</p>
            <p>启蒙之光团队</p>
          </div>
          <div class="footer">
            <p>这是一封自动发送的邮件,请勿直接回复</p>
            <p>&copy; 2026 启蒙之光 - 点亮孩子们的AI启蒙之光</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 欢迎邮件模板
   */
  private getWelcomeEmailTemplate(nickname: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 欢迎加入启蒙之光!</h1>
          </div>
          <div class="content">
            <h2>您好, ${nickname}!</h2>
            <p>欢迎来到启蒙之光 - 专为6-12岁儿童设计的AI教育平台!</p>

            <h3>您可以体验以下精彩功能:</h3>
            <div class="feature">🎮 <strong>AI游戏实验室</strong> - 在玩中学习AI知识</div>
            <div class="feature">🎨 <strong>创意创作工具</strong> - AI辅助的故事、诗歌、绘画创作</div>
            <div class="feature">🤖 <strong>AI对话助手</strong> - 与AI助手"启启"互动交流</div>
            <div class="feature">💝 <strong>情感陪伴</strong> - 心灵花园和愿望树,关注心理健康</div>

            <p style="margin-top: 30px;">祝您探索愉快!</p>
            <p>启蒙之光团队</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 启蒙之光 - 点亮孩子们的AI启蒙之光</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 密码重置邮件模板
   */
  private getPasswordResetEmailTemplate(resetCode: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px solid #e74c3c; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          .warning { color: #e74c3c; margin-top: 15px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 密码重置</h1>
          </div>
          <div class="content">
            <h2>密码重置验证码</h2>
            <p>您好!</p>
            <p>您正在重置启蒙之光平台的登录密码,您的验证码是:</p>

            <div class="code-box">
              <div class="code">${resetCode}</div>
            </div>

            <p>验证码有效期为 <strong>15分钟</strong>,请尽快完成密码重置。</p>
            <p class="warning">⚠️ 如果这不是您本人的操作,请立即联系我们!</p>

            <p style="margin-top: 30px;">启蒙之光团队</p>
          </div>
          <div class="footer">
            <p>这是一封自动发送的邮件,请勿直接回复</p>
            <p>&copy; 2026 启蒙之光</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
