#!/usr/bin/env node
/**
 * 安全配置检查脚本
 * 用于检查环境变量中的安全隐患
 */

const fs = require('fs');
const path = require('path');

// 不安全的默认值列表
const UNSAFE_DEFAULTS = [
  'your-super-secret-key-change-in-production',
  'your-refresh-secret-key-change-in-production',
  'dev_password_123',
  'your-deepseek-api-key-here',
  'your-zhipu-api-key-here',
  'app-your-chat-app-key',
  'test-secret',
  'changeme',
  'password',
  '123456',
];

// 需要检查的环境变量
const CRITICAL_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_PASSWORD',
  'SESSION_SECRET',
];

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });

  return env;
}

function checkEnvFile(filePath, envName) {
  log('blue', '📋', `检查 ${envName}: ${filePath}`);

  const env = parseEnvFile(filePath);
  if (!env) {
    log('yellow', '⚠️', `  文件不存在，跳过检查`);
    return { passed: true, warnings: 0, errors: 0 };
  }

  let errors = 0;
  let warnings = 0;

  // 检查关键变量
  CRITICAL_VARS.forEach(varName => {
    const value = env[varName];

    if (!value) {
      log('yellow', '⚠️', `  ${varName}: 未设置`);
      warnings++;
      return;
    }

    // 检查是否使用了不安全的默认值
    const isUnsafe = UNSAFE_DEFAULTS.some(unsafe =>
      value.toLowerCase().includes(unsafe.toLowerCase())
    );

    if (isUnsafe) {
      log('red', '❌', `  ${varName}: 使用了不安全的默认值`);
      errors++;
      return;
    }

    // 检查长度
    if (varName.includes('SECRET') || varName.includes('KEY')) {
      if (value.length < 32) {
        log('red', '❌', `  ${varName}: 密钥长度不足 (${value.length} < 32)`);
        errors++;
        return;
      }
    }

    if (varName === 'DB_PASSWORD') {
      if (value.length < 16) {
        log('yellow', '⚠️', `  ${varName}: 密码长度较短 (${value.length} < 16)`);
        warnings++;
        return;
      }
    }

    log('green', '✓', `  ${varName}: 安全`);
  });

  // 检查 AI API Keys
  const aiKeys = ['DEEPSEEK_API_KEY', 'ZHIPU_API_KEY', 'DIFY_API_KEY'];
  let hasValidAiKey = false;

  aiKeys.forEach(key => {
    const value = env[key];
    if (value && !UNSAFE_DEFAULTS.some(unsafe => value.includes(unsafe))) {
      hasValidAiKey = true;
    }
  });

  if (!hasValidAiKey && envName.includes('production')) {
    log('yellow', '⚠️', `  AI服务: 未配置有效的 AI API Key`);
    warnings++;
  }

  return { passed: errors === 0, warnings, errors };
}

function main() {
  console.log('\n' + '='.repeat(60));
  log('blue', '🔒', '启蒙之光 - 安全配置检查');
  console.log('='.repeat(60) + '\n');

  const envFiles = [
    { path: 'server/.env', name: '开发环境 (server/.env)' },
    { path: '.env', name: '根目录 (.env)' },
    { path: '.env.production.ready', name: '生产环境模板 (.env.production.ready)' },
  ];

  let totalErrors = 0;
  let totalWarnings = 0;
  let allPassed = true;

  envFiles.forEach(({ path: filePath, name }) => {
    const result = checkEnvFile(filePath, name);
    totalErrors += result.errors;
    totalWarnings += result.warnings;
    if (!result.passed) allPassed = false;
    console.log('');
  });

  console.log('='.repeat(60));
  console.log('\n📊 检查结果汇总:\n');

  if (allPassed && totalWarnings === 0) {
    log('green', '✅', '所有检查通过！配置安全。');
  } else {
    if (totalErrors > 0) {
      log('red', '❌', `发现 ${totalErrors} 个安全错误`);
    }
    if (totalWarnings > 0) {
      log('yellow', '⚠️', `发现 ${totalWarnings} 个警告`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  if (totalErrors > 0) {
    console.log('🔧 修复建议:\n');
    console.log('1. 运行以下命令生成新的强随机密钥:');
    console.log('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.log('\n2. 将生成的密钥更新到对应的环境变量中');
    console.log('\n3. 确保数据库密码至少 16 位，包含大小写字母、数字和特殊字符');
    console.log('\n');
    process.exit(1);
  }

  process.exit(0);
}

main();
