import dotenv from 'dotenv';
import path from 'path';
import { validateConfig, printConfigHelp } from '../utils/validateConfig';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// 执行配置验证
const validationResult = validateConfig();

// 如果生产环境验证失败，打印帮助并退出
if (!validationResult.valid && process.env.NODE_ENV === 'production') {
  printConfigHelp();
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    database: process.env.DB_NAME || 'qmzg',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'secure_pass',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-please-change-in-production',
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-please-change-in-production',
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as string,
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 默认10MB
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  dify: {
    apiUrl: process.env.DIFY_API_URL || 'http://localhost/v1',
    apiKey: process.env.DIFY_API_KEY || '',
    chatAppKey: process.env.DIFY_CHAT_APP_KEY || '',
    storyAppKey: process.env.DIFY_STORY_APP_KEY || '',
    emotionAppKey: process.env.DIFY_EMOTION_APP_KEY || '',
    tutoringAppKey: process.env.DIFY_TUTORING_APP_KEY || '',
    tutoringEvaluateAppKey: process.env.DIFY_TUTORING_EVALUATE_APP_KEY || '',
    tutoringSummaryAppKey: process.env.DIFY_TUTORING_SUMMARY_APP_KEY || '',
    timeout: parseInt(process.env.DIFY_TIMEOUT || '30000', 10),
  },

  zhipu: {
    apiKey: process.env.ZHIPU_API_KEY || '',
  },

  ai: {
    provider: (process.env.AI_PROVIDER || 'dify') as 'dify' | 'zhipu',
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@qmzg.com',
  },
};

export default config;
export { config };
