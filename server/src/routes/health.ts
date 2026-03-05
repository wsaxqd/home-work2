import { Router } from 'express';
import { healthCheck, readinessCheck, livenessCheck } from '../controllers/healthController';

const router = Router();

// 健康检查端点（详细）
router.get('/health', healthCheck);

// 就绪检查端点（Kubernetes）
router.get('/ready', readinessCheck);

// 存活检查端点（Kubernetes）
router.get('/alive', livenessCheck);

export default router;
