#!/usr/bin/env node
/**
 * 安全配置自动更新脚本
 * 自动生成强随机密钥并更新环境变量文件
 */

const fs = require('fs');
const crypto = require('crypto');

// 颜色输出
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

// 生成强随机密钥
function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// 生成强密码
function generateSecurePassword(length = 32) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }

  return password;
}

// 更新环境变量文件
function updateEnvFile(filePath, updates) {
  if (!fs.existsSync(filePath)) {
    log('yellow', '⚠️', `文件不存在: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
      modified = true;
      log('green', '✓', `  更新 ${key}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }

  return false;
}

function main() {
  console.log('\n' + '='.repeat(60));
  log('blue', '🔒', '启蒙之光 - 安全配置自动更新');
  console.log('='.repeat(60) + '\n');

  // 生成新的安全密钥
  log('cyan', '🔑', '生成新的安全密钥...\n');

  const newKeys = {
    JWT_SECRET: generateSecureKey(64),
    JWT_REFRESH_SECRET: generateSecureKey(64),
    SESSION_SECRET: generateSecureKey(64),
    DB_PASSWORD: generateSecurePassword(32),
  };

  console.log('生成的密钥:');
  Object.entries(newKeys).forEach(([key, value]) => {
    const displayValue = value.length > 40 ? value.substring(0, 40) + '...' : value;
    log('cyan', '  •', `${key}: ${displayValue}`);
  });
  console.log('');

  // 更新 server/.env
  log('blue', '📝', '更新 server/.env...');
  const serverEnvUpdated = updateEnvFile('server/.env', newKeys);
  if (serverEnvUpdated) {
    log('green', '✅', 'server/.env 更新成功\n');
  } else {
    log('yellow', '⚠️', 'server/.env 未更新\n');
  }

  // 更新根目录 .env (如果存在)
  if (fs.existsSync('.env')) {
    log('blue', '📝', '更新 .env...');
    const rootEnvUpdated = updateEnvFile('.env', newKeys);
    if (rootEnvUpdated) {
      log('green', '✅', '.env 更新成功\n');
    } else {
      log('yellow', '⚠️', '.env 未更新\n');
    }
  }

  // 显示生产环境配置提示
  console.log('='.repeat(60));
  log('yellow', '⚠️', '生产环境配置提示:\n');
  console.log('.env.production.ready 文件已包含强随机密钥');
  console.log('部署到生产环境时,请确保:');
  console.log('1. 修改 DB_PASSWORD 为您自己的强密码');
  console.log('2. 配置 DOMAIN 和 CORS_ORIGIN');
  console.log('3. 配置至少一个 AI 服务的 API Key\n');

  console.log('='.repeat(60));
  log('green', '✅', '安全配置更新完成!\n');

  // 保存密钥到临时文件供参考
  const keysBackup = `# 安全密钥备份 - ${new Date().toISOString()}
# 请妥善保管此文件,不要提交到版本控制系统

${Object.entries(newKeys).map(([k, v]) => `${k}=${v}`).join('\n')}
`;

  fs.writeFileSync('.security-keys-backup.txt', keysBackup, 'utf-8');
  log('cyan', '💾', '密钥已备份到: .security-keys-backup.txt');
  log('yellow', '⚠️', '请妥善保管备份文件,不要提交到 Git!\n');
}

main();
