#!/usr/bin/env node
/**
 * 邮件服务测试脚本
 */

const nodemailer = require('nodemailer');
require('dotenv').config({ path: './server/.env' });

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

async function testEmailService() {
  console.log('\n' + '='.repeat(60));
  log('blue', '📧', '邮件服务测试');
  console.log('='.repeat(60) + '\n');

  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  log('cyan', '📋', '当前配置:');
  console.log(`  SMTP服务器: ${config.host}:${config.port}`);
  console.log(`  用户: ${config.auth.user}`);
  console.log(`  密码: ${config.auth.pass ? '已配置' : '未配置'}`);
  console.log(`  安全连接: ${config.secure}\n`);

  if (!config.auth.user || !config.auth.pass) {
    log('red', '❌', 'SMTP用户名或密码未配置');
    log('yellow', '💡', '请在 server/.env 中配置 SMTP_USER 和 SMTP_PASSWORD');
    process.exit(1);
  }

  log('blue', '🔍', '测试SMTP连接...\n');

  try {
    const transporter = nodemailer.createTransport(config);
    
    await transporter.verify();
    log('green', '✅', 'SMTP连接成功!\n');

    log('blue', '📤', '发送测试邮件...\n');

    const testEmail = {
      from: config.auth.user,
      to: config.auth.user,
      subject: '启蒙之光 - 邮件服务测试',
      html: `
        <h2>邮件服务测试成功!</h2>
        <p>这是一封来自启蒙之光平台的测试邮件。</p>
        <p>如果你收到这封邮件,说明邮件服务配置正确。</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          测试时间: ${new Date().toLocaleString('zh-CN')}
        </p>
      `,
    };

    const info = await transporter.sendMail(testEmail);
    
    log('green', '✅', '测试邮件发送成功!');
    log('cyan', '📬', `邮件ID: ${info.messageId}`);
    log('cyan', '💡', `请检查邮箱 ${config.auth.user} 是否收到测试邮件\n`);

    console.log('='.repeat(60));
    log('green', '🎉', '邮件服务测试通过!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    log('red', '❌', `邮件服务测试失败: ${error.message}\n`);
    
    log('yellow', '💡', '常见问题排查:');
    console.log('  1. 检查SMTP用户名和密码是否正确');
    console.log('  2. QQ邮箱需要使用授权码,不是登录密码');
    console.log('  3. 检查网络连接是否正常');
    console.log('  4. 确认SMTP服务器地址和端口正确\n');
    
    process.exit(1);
  }
}

testEmailService();
