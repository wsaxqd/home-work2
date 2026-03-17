/**
 * 环境变量验证工具
 * 用于启动时检查必需的配置项
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 验证环境变量配置
 */
export function validateConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('\n🔍 正在验证环境配置...\n');

  // ============ 必需配置项 ============

  // 1. 数据库配置（必需）
  const requiredDbVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  requiredDbVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`❌ 缺少数据库配置: ${varName}`);
    }
  });

  // 2. JWT 配置（必需）
  if (!process.env.JWT_SECRET) {
    errors.push('❌ 缺少 JWT_SECRET');
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('❌ JWT_SECRET 长度必须至少32个字符（当前: ' + process.env.JWT_SECRET.length + '）');
  } else if (process.env.JWT_SECRET.includes('your-super-secret') ||
             process.env.JWT_SECRET.includes('please-change')) {
    warnings.push('⚠️  JWT_SECRET 使用的是默认值，生产环境请修改!');
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    errors.push('❌ 缺少 JWT_REFRESH_SECRET');
  } else if (process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('❌ JWT_REFRESH_SECRET 长度必须至少32个字符（当前: ' + process.env.JWT_REFRESH_SECRET.length + '）');
  }

  if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET &&
      process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    errors.push('❌ JWT_SECRET 和 JWT_REFRESH_SECRET 不能相同!');
  }

  // ============ AI 服务配置（至少配置一个）============

  const aiProvider = process.env.AI_PROVIDER || 'dify';
  const hasDifyConfig = process.env.DIFY_CHAT_APP_KEY ||
                        process.env.DIFY_STORY_APP_KEY ||
                        process.env.DIFY_EMOTION_APP_KEY;
  const hasZhipuConfig = process.env.ZHIPU_API_KEY;

  if (aiProvider === 'dify') {
    if (!hasDifyConfig) {
      warnings.push('⚠️  AI_PROVIDER 设置为 dify，但未配置 Dify 应用密钥');
      warnings.push('   请至少配置一个: DIFY_CHAT_APP_KEY, DIFY_STORY_APP_KEY, DIFY_EMOTION_APP_KEY');
    } else {
      console.log('✅ Dify AI 配置已检测');
    }
  } else if (aiProvider === 'zhipu') {
    if (!hasZhipuConfig) {
      warnings.push('⚠️  AI_PROVIDER 设置为 zhipu，但未配置 ZHIPU_API_KEY');
    } else {
      console.log('✅ 智谱 AI 配置已检测');
    }
  }

  if (!hasDifyConfig && !hasZhipuConfig) {
    warnings.push('⚠️  未配置任何 AI 服务，AI 功能将不可用');
    warnings.push('   请配置 Dify AI 或智谱 AI');
  }

  // ============ 邮件服务配置（可选）============

  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    console.log('✅ 邮件服务配置已检测');

    // 检查邮件配置完整性
    if (!process.env.SMTP_HOST) {
      warnings.push('⚠️  配置了邮件账号但缺少 SMTP_HOST');
    }
    if (!process.env.EMAIL_FROM) {
      warnings.push('⚠️  配置了邮件账号但缺少 EMAIL_FROM');
    }
  } else {
    warnings.push('⚠️  未配置邮件服务，邮箱验证码功能将使用模拟模式');
  }

  // ============ CORS 配置检查 ============

  if (!process.env.CORS_ORIGIN) {
    warnings.push('⚠️  未配置 CORS_ORIGIN，将使用默认值: http://localhost:5173');
  }

  // ============ 数据库密码强度检查 ============

  if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.length < 8) {
    warnings.push('⚠️  数据库密码太短，建议至少8个字符');
  }

  if (process.env.DB_PASSWORD &&
      (process.env.DB_PASSWORD.includes('password') ||
       process.env.DB_PASSWORD.includes('123456'))) {
    warnings.push('⚠️  数据库密码过于简单，建议使用复杂密码');
  }

  // ============ 输出结果 ============

  console.log('');

  if (errors.length === 0) {
    console.log('✅ 必需配置项验证通过\n');
  } else {
    console.log('❌ 发现配置错误:\n');
    errors.forEach(err => console.log('   ' + err));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  配置警告:\n');
    warnings.forEach(warn => console.log('   ' + warn));
    console.log('');
  }

  // 生产环境严格检查
  if (process.env.NODE_ENV === 'production') {
    if (errors.length > 0) {
      console.error('💥 生产环境配置错误，服务启动中止!\n');
      console.log('📝 请参考以下文档进行配置:');
      console.log('   - README.md');
      console.log('   - QUICK_START.md');
      console.log('   - server/.env.template\n');
      return { valid: false, errors, warnings };
    }

    if (warnings.length > 10) {
      console.error('💥 生产环境存在严重警告，请解决后再启动!\n');
      return { valid: false, errors, warnings };
    }
  } else {
    // 开发环境仅提示
    if (errors.length > 0) {
      console.log('🚧 开发环境将使用默认配置继续运行');
      console.log('⚠️  生产环境部署前请务必修复所有配置错误!\n');
    }
  }

  console.log('─'.repeat(50));
  console.log('');

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 生成 JWT 密钥的帮助函数
 */
export function generateJWTSecret(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 打印配置帮助信息
 */
export function printConfigHelp() {
  console.log('\n📘 配置帮助:\n');
  console.log('1. 生成 JWT 密钥:');
  console.log('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
  console.log('2. 复制环境变量模板:');
  console.log('   cp server/.env.template server/.env\n');
  console.log('3. 编辑 .env 文件并填写配置\n');
  console.log('4. 详细配置指南:');
  console.log('   - Dify AI: DIFY_CONFIG_GUIDE.md');
  console.log('   - 智谱 AI: ZHIPU_CONFIG_GUIDE.md');
  console.log('   - 邮件服务: EMAIL_CONFIG_GUIDE.md');
  console.log('   - 快速开始: QUICK_START.md\n');
}
