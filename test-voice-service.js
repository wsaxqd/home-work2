/**
 * 腾讯云语音服务测试脚本
 * 用于测试语音识别(ASR)和语音合成(TTS)功能
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const API_BASE_URL = 'http://localhost:3001/api';
let authToken = '';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. 用户登录获取Token
async function login() {
  try {
    log('\n=== 步骤1: 用户登录 ===', 'blue');

    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'test_user',
      password: 'test123456'
    });

    if (response.data.token) {
      authToken = response.data.token;
      log('✅ 登录成功', 'green');
      return true;
    } else {
      log('❌ 登录失败: 未返回token', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 登录失败: ${error.response?.data?.message || error.message}`, 'red');
    log('提示: 请先创建测试账号或使用已有账号', 'yellow');
    return false;
  }
}

// 2. 测试语音合成(TTS)
async function testTextToSpeech() {
  try {
    log('\n=== 步骤2: 测试语音合成(TTS) ===', 'blue');

    const testTexts = [
      '你好,我是启蒙之光AI助手',
      '今天天气真不错',
      '让我们一起学习新知识吧'
    ];

    for (let i = 0; i < testTexts.length; i++) {
      const text = testTexts[i];
      log(`\n测试文本 ${i + 1}: "${text}"`, 'yellow');

      const response = await axios.post(
        `${API_BASE_URL}/ai/text-to-speech`,
        {
          text: text,
          voiceType: 10, // 智瑜(情感女声)
          speed: 0,
          volume: 5,
          saveToFile: true
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.audioUrl) {
        log(`✅ 语音合成成功`, 'green');
        log(`   音频URL: ${response.data.audioUrl}`);
        log(`   时长: ${response.data.duration}秒`);
      } else {
        log('❌ 语音合成失败: 未返回音频URL', 'red');
      }
    }

    return true;
  } catch (error) {
    log(`❌ 语音合成测试失败: ${error.response?.data?.message || error.message}`, 'red');

    if (error.response?.data?.message?.includes('配置缺失')) {
      log('\n提示: 请先配置腾讯云密钥:', 'yellow');
      log('1. 编辑 .env 文件', 'yellow');
      log('2. 设置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY', 'yellow');
      log('3. 重启服务', 'yellow');
    }

    return false;
  }
}

// 3. 测试获取音色列表
async function testGetVoiceTypes() {
  try {
    log('\n=== 步骤3: 获取可用音色列表 ===', 'blue');

    const response = await axios.get(
      `${API_BASE_URL}/ai/voice-types`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (response.data.voiceTypes && response.data.voiceTypes.length > 0) {
      log(`✅ 获取音色列表成功 (共${response.data.voiceTypes.length}种音色)`, 'green');

      log('\n可用音色:', 'yellow');
      response.data.voiceTypes.forEach(voice => {
        log(`   ID: ${voice.id.toString().padEnd(4)} | ${voice.name.padEnd(8)} | ${voice.description}`);
      });
    } else {
      log('❌ 未获取到音色列表', 'red');
    }

    return true;
  } catch (error) {
    log(`❌ 获取音色列表失败: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// 4. 测试语音识别(ASR) - 使用示例音频
async function testSpeechToText() {
  try {
    log('\n=== 步骤4: 测试语音识别(ASR) ===', 'blue');
    log('提示: 此功能需要提供真实的音频文件', 'yellow');

    // 这里需要真实的音频文件Base64编码
    // 由于测试环境可能没有音频文件,这里只做接口测试

    log('⚠️  跳过语音识别测试(需要真实音频文件)', 'yellow');
    log('   如需测试,请准备音频文件并转换为Base64编码', 'yellow');

    return true;
  } catch (error) {
    log(`❌ 语音识别测试失败: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// 5. 测试不同音色
async function testDifferentVoices() {
  try {
    log('\n=== 步骤5: 测试不同音色 ===', 'blue');

    const voiceTests = [
      { id: 0, name: '云小宁(女声)' },
      { id: 1, name: '云小奇(男声)' },
      { id: 10, name: '智瑜(情感女声)' },
      { id: 13, name: '智云(通用男声)' }
    ];

    const text = '这是音色测试';

    for (const voice of voiceTests) {
      log(`\n测试音色: ${voice.name}`, 'yellow');

      const response = await axios.post(
        `${API_BASE_URL}/ai/text-to-speech`,
        {
          text: text,
          voiceType: voice.id,
          saveToFile: true
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.audioUrl) {
        log(`✅ ${voice.name} 合成成功`, 'green');
      } else {
        log(`❌ ${voice.name} 合成失败`, 'red');
      }
    }

    return true;
  } catch (error) {
    log(`❌ 音色测试失败: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// 主测试流程
async function runTests() {
  log('╔════════════════════════════════════════════╗', 'blue');
  log('║   腾讯云语音服务测试脚本                  ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');

  // 检查服务是否运行
  try {
    await axios.get(`${API_BASE_URL}/health`);
    log('✅ 服务器运行正常', 'green');
  } catch (error) {
    log('❌ 无法连接到服务器,请确保服务已启动', 'red');
    log(`   服务地址: ${API_BASE_URL}`, 'yellow');
    return;
  }

  // 执行测试
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n测试终止: 登录失败', 'red');
    return;
  }

  await testTextToSpeech();
  await testGetVoiceTypes();
  await testSpeechToText();
  await testDifferentVoices();

  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║   测试完成                                 ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');

  log('\n📝 后续步骤:', 'yellow');
  log('1. 检查生成的音频文件: uploads/audio/', 'yellow');
  log('2. 播放音频文件验证音质', 'yellow');
  log('3. 如需测试语音识别,准备音频文件并修改测试脚本', 'yellow');
  log('4. 查看详细配置文档: TENCENT_VOICE_CONFIG_GUIDE.md', 'yellow');
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试过程出错: ${error.message}`, 'red');
  console.error(error);
});
