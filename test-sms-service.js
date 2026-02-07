/**
 * 短信验证码功能测试脚本
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

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

async function testSendSMSCode() {
  try {
    log('\n=== 测试发送短信验证码 ===', 'blue');

    const testPhone = '13800138000';
    log(`\n发送验证码到: ${testPhone}`, 'yellow');

    const response = await axios.post(
      `${API_BASE_URL}/auth/send-sms-code`,
      { phone: testPhone, purpose: 'login' }
    );

    if (response.data.success) {
      log('✅ 短信验证码发送成功', 'green');
      log(`   ${response.data.message}`);
      return testPhone;
    }
  } catch (error) {
    const message = error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : error.message;
    log(`❌ 短信验证码发送失败: ${message}`, 'red');

    if (message.includes('配置缺失')) {
      log('\n提示: 请先配置腾讯云短信服务', 'yellow');
      log('查看配置文档: TENCENT_SMS_CONFIG_GUIDE.md', 'yellow');
    }
  }
  return null;
}

async function testRateLimit() {
  try {
    log('\n=== 测试发送频率限制 ===', 'blue');

    const testPhone = '13800138001';
    log('\n尝试连续发送两次验证码...', 'yellow');

    await axios.post(`${API_BASE_URL}/auth/send-sms-code`, {
      phone: testPhone,
      purpose: 'login'
    });

    log('第一次发送成功', 'green');

    try {
      await axios.post(`${API_BASE_URL}/auth/send-sms-code`, {
        phone: testPhone,
        purpose: 'login'
      });
      log('❌ 频率限制未生效', 'red');
    } catch (error) {
      const message = error.response && error.response.data && error.response.data.message;
      if (message && message.includes('秒后再试')) {
        log('✅ 频率限制正常工作', 'green');
        log(`   ${message}`);
      }
    }
  } catch (error) {
    log(`❌ 频率限制测试失败: ${error.message}`, 'red');
  }
}

async function testPhoneValidation() {
  try {
    log('\n=== 测试手机号格式验证 ===', 'blue');

    const invalidPhones = [
      '12345678901',
      '1380013800',
      '138001380000',
      'abcdefghijk',
    ];

    for (const phone of invalidPhones) {
      log(`\n测试无效手机号: ${phone}`, 'yellow');

      try {
        await axios.post(`${API_BASE_URL}/auth/send-sms-code`, {
          phone: phone,
          purpose: 'login'
        });
        log('❌ 应该拒绝无效手机号', 'red');
      } catch (error) {
        const message = error.response && error.response.data && error.response.data.message;
        if (message && message.includes('手机号格式不正确')) {
          log('✅ 正确拒绝无效手机号', 'green');
        }
      }
    }
  } catch (error) {
    log(`❌ 手机号格式验证测试失败: ${error.message}`, 'red');
  }
}

async function runTests() {
  log('╔════════════════════════════════════════════╗', 'blue');
  log('║   短信验证码功能测试脚本                  ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');

  try {
    await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    log('✅ 服务器运行正常', 'green');
  } catch (error) {
    log('❌ 无法连接到服务器,请确保服务已启动', 'red');
    return;
  }

  await testSendSMSCode();
  await testRateLimit();
  await testPhoneValidation();

  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║   测试完成                                 ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');

  log('\n📝 后续步骤:', 'yellow');
  log('1. 使用真实手机号测试短信发送', 'yellow');
  log('2. 检查数据库表: sms_verify_codes 和 sms_send_logs', 'yellow');
  log('3. 查看配置文档: TENCENT_SMS_CONFIG_GUIDE.md', 'yellow');
}

runTests().catch(error => {
  log(`\n❌ 测试过程出错: ${error.message}`, 'red');
  console.error(error);
});
