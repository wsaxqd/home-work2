#!/usr/bin/env node
/**
 * AI 服务测试脚本
 * 用于测试 DeepSeek/智谱/Dify AI 服务是否正常工作
 */

const https = require('https');
const http = require('http');
require('dotenv').config({ path: './server/.env' });

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

// 测试 DeepSeek API
async function testDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey || apiKey.includes('your-')) {
    log('yellow', '⚠️', 'DeepSeek API Key 未配置');
    return false;
  }

  log('blue', '🔍', '测试 DeepSeek API...');

  const data = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: '你是启蒙之光的AI助手'
      },
      {
        role: 'user',
        content: '你好,请简单介绍一下自己'
      }
    ],
    max_tokens: 100
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.deepseek.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(responseData);
            const reply = result.choices[0].message.content;
            log('green', '✅', 'DeepSeek API 测试成功');
            log('cyan', '💬', `回复: ${reply.substring(0, 100)}...`);
            resolve(true);
          } catch (error) {
            log('red', '❌', `DeepSeek 响应解析失败: ${error.message}`);
            resolve(false);
          }
        } else {
          log('red', '❌', `DeepSeek API 调用失败 (${res.statusCode})`);
          log('yellow', '📄', `响应: ${responseData.substring(0, 200)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log('red', '❌', `DeepSeek 连接失败: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      log('red', '❌', 'DeepSeek 请求超时');
      req.destroy();
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// 测试智谱 AI
async function testZhipu() {
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey || apiKey.includes('your-')) {
    log('yellow', '⚠️', '智谱 AI API Key 未配置');
    return false;
  }

  log('blue', '🔍', '测试智谱 AI...');

  const data = JSON.stringify({
    model: 'glm-4',
    messages: [
      {
        role: 'user',
        content: '你好,请简单介绍一下自己'
      }
    ]
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'open.bigmodel.cn',
      port: 443,
      path: '/api/paas/v4/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(responseData);
            const reply = result.choices[0].message.content;
            log('green', '✅', '智谱 AI 测试成功');
            log('cyan', '💬', `回复: ${reply.substring(0, 100)}...`);
            resolve(true);
          } catch (error) {
            log('red', '❌', `智谱 AI 响应解析失败: ${error.message}`);
            resolve(false);
          }
        } else {
          log('red', '❌', `智谱 AI 调用失败 (${res.statusCode})`);
          log('yellow', '📄', `响应: ${responseData.substring(0, 200)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log('red', '❌', `智谱 AI 连接失败: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      log('red', '❌', '智谱 AI 请求超时');
      req.destroy();
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// 测试 Dify
async function testDify() {
  const apiKey = process.env.DIFY_CHAT_APP_KEY;
  const apiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1';

  if (!apiKey || apiKey.includes('your-')) {
    log('yellow', '⚠️', 'Dify API Key 未配置');
    return false;
  }

  log('blue', '🔍', '测试 Dify AI...');

  const data = JSON.stringify({
    query: '你好,请简单介绍一下自己',
    user: 'test-user',
    response_mode: 'blocking'
  });

  return new Promise((resolve) => {
    const url = new URL(apiUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: '/chat-messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
      },
      timeout: 10000
    };

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(responseData);
            const reply = result.answer;
            log('green', '✅', 'Dify AI 测试成功');
            log('cyan', '💬', `回复: ${reply.substring(0, 100)}...`);
            resolve(true);
          } catch (error) {
            log('red', '❌', `Dify 响应解析失败: ${error.message}`);
            resolve(false);
          }
        } else {
          log('red', '❌', `Dify 调用失败 (${res.statusCode})`);
          log('yellow', '📄', `响应: ${responseData.substring(0, 200)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log('red', '❌', `Dify 连接失败: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      log('red', '❌', 'Dify 请求超时');
      req.destroy();
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// 主函数
async function main() {
  console.log('\n' + '='.repeat(60));
  log('blue', '🤖', 'AI 服务测试');
  console.log('='.repeat(60) + '\n');

  log('cyan', '📋', '当前配置:');
  console.log(`  AI_PROVIDER: ${process.env.AI_PROVIDER || '未设置'}`);
  console.log(`  DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'}`);
  console.log(`  ZHIPU_API_KEY: ${process.env.ZHIPU_API_KEY ? '已配置' : '未配置'}`);
  console.log(`  DIFY_API_KEY: ${process.env.DIFY_CHAT_APP_KEY ? '已配置' : '未配置'}`);
  console.log('');

  const results = {
    deepseek: false,
    zhipu: false,
    dify: false
  };

  // 测试 DeepSeek
  results.deepseek = await testDeepSeek();
  console.log('');

  // 测试智谱
  results.zhipu = await testZhipu();
  console.log('');

  // 测试 Dify
  results.dify = await testDify();
  console.log('');

  // 总结
  console.log('='.repeat(60));
  log('blue', '📊', '测试结果汇总:');
  console.log('='.repeat(60) + '\n');

  if (results.deepseek) {
    log('green', '✅', 'DeepSeek AI - 可用 (推荐)');
  } else {
    log('yellow', '⚠️', 'DeepSeek AI - 不可用');
  }

  if (results.zhipu) {
    log('green', '✅', '智谱 AI - 可用');
  } else {
    log('yellow', '⚠️', '智谱 AI - 不可用');
  }

  if (results.dify) {
    log('green', '✅', 'Dify AI - 可用');
  } else {
    log('yellow', '⚠️', 'Dify AI - 不可用');
  }

  console.log('');

  // 给出建议
  if (results.deepseek || results.zhipu || results.dify) {
    log('green', '🎉', '至少有一个 AI 服务可用,系统可以正常工作!');

    if (results.deepseek) {
      log('cyan', '💡', '系统将优先使用 DeepSeek (性价比最高)');
    } else if (results.zhipu) {
      log('cyan', '💡', '系统将使用智谱 AI');
    } else {
      log('cyan', '💡', '系统将使用 Dify AI');
    }
  } else {
    log('red', '❌', '所有 AI 服务都不可用!');
    log('yellow', '💡', '建议:');
    console.log('  1. 检查 API Key 是否正确');
    console.log('  2. 确认账户余额是否充足');
    console.log('  3. 检查网络连接是否正常');
    console.log('  4. 查看 server/.env 文件配置');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(error => {
  log('red', '❌', `测试失败: ${error.message}`);
  process.exit(1);
});
