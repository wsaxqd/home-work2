import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

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
    secret: process.env.JWT_SECRET || 'your-super-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
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
};

export default config;
export { config };
