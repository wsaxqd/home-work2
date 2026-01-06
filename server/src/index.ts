import express from 'express';
import cors from 'cors';
import path from 'path';
import config from './config';
import { errorHandler, notFoundHandler } from './utils/errorHandler';

// 导入路由
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import worksRoutes from './routes/works';
import communityRoutes from './routes/community';
import gamesRoutes from './routes/games';
import diaryRoutes from './routes/diary';
import aiRoutes from './routes/ai';
import assessmentRoutes from './routes/assessment';
import notificationsRoutes from './routes/notifications';
import uploadRoutes from './routes/upload';
import homeRoutes from './routes/home';
import creationRoutes from './routes/creation';
import parentalRoutes from './routes/parental';
import recommendationRoutes from './routes/recommendations';
import tutoringRoutes from './routes/tutoring';
import generationRoutes from './routes/generation';
import moderationRoutes from './routes/moderation';
import analyticsRoutes from './routes/analytics';
import storiesRoutes from './routes/stories';

const app = express();

// 中间件
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（上传的文件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/creation', creationRoutes);
app.use('/api/parental', parentalRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/tutoring', tutoringRoutes);
app.use('/api/generation', generationRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api', homeRoutes);

// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🌟 启蒙之光 API服务器已启动                            ║
║                                                        ║
║   端口: ${PORT}                                          ║
║   环境: ${config.nodeEnv}                                ║
║   时间: ${new Date().toLocaleString()}                   ║
║                                                        ║
║   API文档: http://localhost:${PORT}/health               ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
