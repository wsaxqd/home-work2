import { Request, Response } from 'express';
import { pool } from '../config/database';

/**
 * 健康检查端点
 * 用于监控系统和负载均衡器
 */
export const healthCheck = async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    checks: {
      database: 'unknown',
      memory: 'unknown',
      disk: 'unknown',
    },
  };

  try {
    // 检查数据库连接
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    healthStatus.checks.database = dbLatency < 100 ? 'healthy' : 'slow';
    (healthStatus.checks as any).databaseLatency = `${dbLatency}ms`;

    // 检查内存使用
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    healthStatus.checks.memory = memPercent < 90 ? 'healthy' : 'warning';
    (healthStatus.checks as any).memoryUsage = `${memUsedMB}MB / ${memTotalMB}MB (${memPercent}%)`;

    // 所有检查通过
    res.status(200).json(healthStatus);
  } catch (error: any) {
    // 有检查失败
    healthStatus.status = 'error';
    healthStatus.checks.database = 'unhealthy';
    (healthStatus.checks as any).error = error.message;

    res.status(503).json(healthStatus);
  }
};

/**
 * 就绪检查端点
 * 用于Kubernetes等容器编排系统
 */
export const readinessCheck = async (req: Request, res: Response) => {
  try {
    // 检查数据库连接
    await pool.query('SELECT 1');

    // 检查关键服务
    // 可以添加更多检查，如Redis、外部API等

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
};

/**
 * 存活检查端点
 * 用于Kubernetes等容器编排系统
 */
export const livenessCheck = (req: Request, res: Response) => {
  // 简单的存活检查，只要进程在运行就返回200
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
