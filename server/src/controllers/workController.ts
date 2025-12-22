import { Request, Response } from 'express';
import { WorkService } from '../services/workService';
import { AuthRequest } from '../middleware/auth';

const workService = new WorkService();

export class WorkController {
  // 创建作品
  async createWork(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const workData = req.body;

      const work = await workService.createWork(userId, workData);

      res.status(201).json({
        success: true,
        message: '作品创建成功',
        data: work
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '创建作品失败'
      });
    }
  }

  // 获取作品列表
  async getWorks(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        type,
        status,
        userId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await workService.getWorks({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        type: type as string,
        status: status as string,
        userId: userId as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取作品列表失败'
      });
    }
  }

  // 获取作品详情
  async getWorkById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const work = await workService.getWorkById(id);

      if (!work) {
        return res.status(404).json({
          success: false,
          message: '作品不存在'
        });
      }

      res.json({
        success: true,
        data: work
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取作品详情失败'
      });
    }
  }

  // 更新作品
  async updateWork(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const updateData = req.body;

      const work = await workService.updateWork(id, userId, updateData);

      res.json({
        success: true,
        message: '作品更新成功',
        data: work
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '更新作品失败'
      });
    }
  }

  // 删除作品
  async deleteWork(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await workService.deleteWork(id, userId);

      res.json({
        success: true,
        message: '作品删除成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '删除作品失败'
      });
    }
  }

  // 发布作品
  async publishWork(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const work = await workService.publishWork(id, userId);

      res.json({
        success: true,
        message: '作品发布成功',
        data: work
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '发布作品失败'
      });
    }
  }

  // 点赞作品
  async likeWork(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await workService.likeWork(id, userId);

      res.json({
        success: true,
        message: result.liked ? '点赞成功' : '取消点赞成功',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '操作失败'
      });
    }
  }

  // 收藏作品
  async favoriteWork(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await workService.favoriteWork(id, userId);

      res.json({
        success: true,
        message: result.favorited ? '收藏成功' : '取消收藏成功',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '操作失败'
      });
    }
  }

  // Fork作品
  async forkWork(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const work = await workService.forkWork(id, userId);

      res.json({
        success: true,
        message: 'Fork成功',
        data: work
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Fork失败'
      });
    }
  }

  // 获取用户的作品
  async getUserWorks(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId || req.user!.id;
      const { page = '1', limit = '20', status } = req.query;

      const result = await workService.getUserWorks(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取用户作品失败'
      });
    }
  }

  // 获取用户收藏的作品
  async getUserFavorites(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { page = '1', limit = '20' } = req.query;

      const result = await workService.getUserFavorites(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取收藏作品失败'
      });
    }
  }

  // 增加播放次数
  async incrementPlayCount(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await workService.incrementPlayCount(id);

      res.json({
        success: true,
        message: '播放次数已更新'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '更新播放次数失败'
      });
    }
  }

  // 保存作品版本
  async saveVersion(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { description } = req.body;

      const version = await workService.saveVersion(id, userId, description);

      res.json({
        success: true,
        message: '版本保存成功',
        data: version
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '保存版本失败'
      });
    }
  }

  // 获取作品版本历史
  async getVersionHistory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const versions = await workService.getVersionHistory(id, userId);

      res.json({
        success: true,
        data: versions
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '获取版本历史失败'
      });
    }
  }
}
