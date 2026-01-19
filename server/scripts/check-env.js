#!/usr/bin/env node

/**
 * 环境变量检查工具
 * 用于验证 .env 配置是否正确
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 加载 .env 文件
const envPath = path.join(__dirname, '../.env');
const envTemplatePath = path.join(__dirname, '../.env.template');

console.log('\n🔍 启蒙之光 - 环境配置检查工具\n');
console.log('─'.repeat(50));

// 检查 .env 文件是否存在
if (!fs.existsSync(envPath)) {
  console.log('\n❌ 未找到 .env 文件!\n');
  console.log('请执行以下步骤:\n');
  console.log('1. 复制模板文件:');
  console.log('   cp .env.template .env\n');
  console.log('2. 编辑 .env 文件并填写配置\n');
  console.log('3. 重新运行此检查工具: npm run check-env\n');
  process.exit(1);
}

// 加载环境变量
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const envTemplate = dotenv.parse(fs.readFileSync(envTemplatePath));

console.log('\n✅ .env 文件存在\n');

// 统计信息
let totalVars = 0;
let configuredVars = 0;
let missingRequired = [];
let usingDefaults = [];
let warnings = [];

// 必需的配置项
const requiredVars = {
  'DB_HOST': '数据库主机',
  'DB_NAME': '数据库名称',
  'DB_USER': '数据库用户',
  'DB_PASSWORD': '数据库密码',
  'JWT_SECRET': 'JWT 密钥',
  'JWT_REFRESH_SECRET': 'JWT 刷新密钥',
};

// 可选但推荐的配置项
const recommendedVars = {
  'DIFY_CHAT_APP_KEY': 'Dify 聊天应用',
  'ZHIPU_API_KEY': '智谱 AI',
  'SMTP_USER': '邮箱账号',
  'SMTP_PASSWORD': '邮箱密码',
};

// 检查必需配置
console.log('📋 检查必需配置:\n');
for (const [key, desc] of Object.entries(requiredVars)) {
  totalVars++;
  const value = envConfig[key] || '';
  const templateValue = envTemplate[key] || '';

  if (!value) {
    missingRequired.push({ key, desc });
    console.log(`   ❌ ${key.padEnd(25)} - ${desc} (未配置)`);
  } else if (value === templateValue || value.includes('your') || value.includes('password')) {
    usingDefaults.push({ key, desc });
    console.log(`   ⚠️  ${key.padEnd(25)} - ${desc} (使用默认值)`);
    configuredVars++;
  } else {
    console.log(`   ✅ ${key.padEnd(25)} - ${desc}`);
    configuredVars++;
  }
}

// 检查推荐配置
console.log('\n📋 检查推荐配置:\n');
let aiConfigured = false;
let emailConfigured = false;

for (const [key, desc] of Object.entries(recommendedVars)) {
  const value = envConfig[key] || '';

  if (value && !value.includes('your')) {
    console.log(`   ✅ ${key.padEnd(25)} - ${desc}`);

    if (key.includes('DIFY') || key.includes('ZHIPU')) {
      aiConfigured = true;
    }
    if (key.includes('SMTP')) {
      emailConfigured = true;
    }
  } else {
    console.log(`   ⚪ ${key.padEnd(25)} - ${desc} (未配置)`);
  }
}

// 特殊检查
console.log('\n🔐 安全检查:\n');

// JWT 密钥长度检查
if (envConfig.JWT_SECRET) {
  if (envConfig.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET 长度不足32个字符');
    console.log('   ❌ JWT_SECRET 长度不足 (当前: ' + envConfig.JWT_SECRET.length + ', 需要: 32+)');
  } else {
    console.log('   ✅ JWT_SECRET 长度符合要求 (' + envConfig.JWT_SECRET.length + ' 字符)');
  }
}

// JWT 刷新密钥检查
if (envConfig.JWT_REFRESH_SECRET) {
  if (envConfig.JWT_REFRESH_SECRET.length < 32) {
    warnings.push('JWT_REFRESH_SECRET 长度不足32个字符');
    console.log('   ❌ JWT_REFRESH_SECRET 长度不足 (当前: ' + envConfig.JWT_REFRESH_SECRET.length + ', 需要: 32+)');
  } else {
    console.log('   ✅ JWT_REFRESH_SECRET 长度符合要求 (' + envConfig.JWT_REFRESH_SECRET.length + ' 字符)');
  }
}

// JWT 密钥相同检查
if (envConfig.JWT_SECRET && envConfig.JWT_REFRESH_SECRET) {
  if (envConfig.JWT_SECRET === envConfig.JWT_REFRESH_SECRET) {
    warnings.push('JWT_SECRET 和 JWT_REFRESH_SECRET 相同');
    console.log('   ❌ JWT_SECRET 和 JWT_REFRESH_SECRET 不能相同!');
  } else {
    console.log('   ✅ JWT 密钥不重复');
  }
}

// 数据库密码强度检查
if (envConfig.DB_PASSWORD) {
  if (envConfig.DB_PASSWORD.length < 8) {
    warnings.push('数据库密码太短');
    console.log('   ⚠️  数据库密码太短 (建议至少8个字符)');
  } else {
    console.log('   ✅ 数据库密码长度符合要求');
  }
}

// 功能状态检查
console.log('\n🎯 功能状态:\n');

if (aiConfigured) {
  console.log('   ✅ AI 服务已配置');
} else {
  console.log('   ⚠️  AI 服务未配置 (AI 功能将不可用)');
  warnings.push('未配置 AI 服务');
}

if (emailConfigured) {
  console.log('   ✅ 邮件服务已配置');
} else {
  console.log('   ⚠️  邮件服务未配置 (将使用模拟模式)');
}

// 总结
console.log('\n' + '─'.repeat(50));
console.log('\n📊 检查总结:\n');

console.log(`   配置进度: ${configuredVars}/${totalVars} 必需项已配置`);

if (missingRequired.length > 0) {
  console.log('\n   ❌ 缺少必需配置:');
  missingRequired.forEach(({ key, desc }) => {
    console.log(`      - ${key} (${desc})`);
  });
}

if (usingDefaults.length > 0) {
  console.log('\n   ⚠️  使用默认值:');
  usingDefaults.forEach(({ key, desc }) => {
    console.log(`      - ${key} (${desc})`);
  });
}

if (warnings.length > 0) {
  console.log('\n   ⚠️  警告:');
  warnings.forEach(w => {
    console.log(`      - ${w}`);
  });
}

// 最终状态
console.log('\n' + '─'.repeat(50) + '\n');

if (missingRequired.length > 0) {
  console.log('❌ 配置不完整，请修复后再启动服务\n');
  console.log('💡 参考文档: ENV_CONFIG_GUIDE.md\n');
  process.exit(1);
} else if (usingDefaults.length > 0 || warnings.length > 0) {
  console.log('⚠️  配置基本完成，但存在警告\n');
  console.log('   开发环境可以继续，生产环境请修复所有警告\n');
  console.log('💡 生成安全密钥: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
  process.exit(0);
} else {
  console.log('✅ 配置检查通过，可以启动服务!\n');
  console.log('🚀 运行: npm run dev\n');
  process.exit(0);
}
