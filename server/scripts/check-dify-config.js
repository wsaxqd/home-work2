#!/usr/bin/env node

/**
 * Dify 配置验证脚本
 * 用于检查 Dify AI 配置是否正确
 */

const axios = require('axios');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'cyan');
  console.log('='.repeat(50));
}

async function checkDifyConfig() {
  logSection('🔍 Dify 配置检查工具');

  // 1. 检查环境变量
  logSection('📋 步骤 1: 检查环境变量');

  const requiredEnvVars = {
    'DIFY_API_URL': process.env.DIFY_API_URL,
    'DIFY_CHAT_APP_KEY': process.env.DIFY_CHAT_APP_KEY,
    'DIFY_STORY_APP_KEY': process.env.DIFY_STORY_APP_KEY,
    'DIFY_EMOTION_APP_KEY': process.env.DIFY_EMOTION_APP_KEY
  };

  let allEnvVarsSet = true;

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value.includes('your-') || value.includes('xxx')) {
      log(`❌ ${key}: 未配置或使用占位符`, 'red');
      allEnvVarsSet = false;
    } else {
      log(`✅ ${key}: 已配置`, 'green');
    }
  }

  if (!allEnvVarsSet) {
    log('\n⚠️  请先配置 .env 文件中的 Dify API 密钥', 'yellow');
    log('参考文档: DIFY_CONFIG_GUIDE.md', 'yellow');
    process.exit(1);
  }

  // 2. 测试聊天应用连接
  logSection('📋 步骤 2: 测试聊天应用连接');

  try {
    const chatResponse = await axios.post(
      `${process.env.DIFY_API_URL}/chat-messages`,
      {
        inputs: {},
        query: '你好',
        response_mode: 'blocking',
        user: 'test-user'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DIFY_CHAT_APP_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (chatResponse.data && chatResponse.data.answer) {
      log('✅ 聊天应用连接成功', 'green');
      log(`   回复: ${chatResponse.data.answer.substring(0, 50)}...`, 'blue');
    }
  } catch (error) {
    log('❌ 聊天应用连接失败', 'red');
    if (error.response) {
      log(`   错误: ${error.response.status} - ${error.response.data?.message || error.message}`, 'red');
    } else {
      log(`   错误: ${error.message}`, 'red');
    }
  }

  // 3. 总结
  logSection('📊 配置检查完成');
  log('\n如果所有检查都通过，说明 Dify 配置正确！', 'green');
  log('如果有失败项，请参考 DIFY_CONFIG_GUIDE.md 进行配置。\n', 'yellow');
}

// 运行检查
checkDifyConfig().catch(error => {
  log(`\n❌ 检查过程出错: ${error.message}`, 'red');
  process.exit(1);
});
