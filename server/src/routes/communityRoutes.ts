import { Router, Request, Response, NextFunction } from 'express';
import { CommunityService } from '../services/communityService';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';

const router = Router();
const communityService = new CommunityService();

// ==================== 帖子相关路由 ====================

// 7.1 获取帖子列表
router.get('/posts', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const tag = req.query.tag as string;
    const sortBy = (req.query.sortBy as string) || 'latest';
    const userId = (req as any).user?.id;

    const result = await communityService.getPosts({ page, limit, category, tag, sortBy }, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 7.2 获取帖子详情
router.get('/posts/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = (req as any).user?.id;

    const post = await communityService.getPostById(postId, userId);
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
});

// 7.3 创建帖子
router.post('/posts', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { title, content, category, tags, images, workId } = req.body;

    const post = await communityService.createPost({
      userId,
      title,
      content,
      category,
      tags,
      images,
      workId
    });

    res.status(201).json({
      success: true,
      message: '帖子发布成功',
      data: post
    });
  } catch (error) {
    next(error);
  }
});

// 7.4 更新帖子
router.put('/posts/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = (req as any).user.id;
    const { title, content, category, tags, images } = req.body;

    const post = await communityService.updatePost(postId, userId, {
      title,
      content,
      category,
      tags,
      images
    });

    res.json({
      success: true,
      message: '帖子更新成功',
      data: post
    });
  } catch (error) {
    next(error);
  }
});

// 7.5 删除帖子
router.delete('/posts/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    await communityService.deletePost(postId, userId, userRole);

    res.json({
      success: true,
      message: '帖子删除成功'
    });
  } catch (error) {
    next(error);
  }
});

// 7.6 点赞帖子
router.post('/posts/:id/like', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const result = await communityService.likePost(postId, userId);

    res.json({
      success: true,
      message: result.liked ? '点赞成功' : '取消点赞成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 评论相关路由 ====================

// 7.7 获取帖子评论
router.get('/posts/:id/comments', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = (req as any).user?.id;

    const result = await communityService.getComments(postId, { page, limit }, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 7.8 发表评论
router.post('/posts/:id/comments', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = (req as any).user.id;
    const { content, parentId, images } = req.body;

    const comment = await communityService.createComment({
      postId,
      userId,
      content,
      parentId,
      images
    });

    res.status(201).json({
      success: true,
      message: '评论发布成功',
      data: comment
    });
  } catch (error) {
    next(error);
  }
});

// 7.9 删除评论
router.delete('/comments/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    await communityService.deleteComment(commentId, userId, userRole);

    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    next(error);
  }
});

// 7.10 点赞评论
router.post('/comments/:id/like', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const result = await communityService.likeComment(commentId, userId);

    res.json({
      success: true,
      message: result.liked ? '点赞成功' : '取消点赞成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 关注相关路由 ====================

// 7.11 关注用户
router.post('/follow/:userId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followerId = (req as any).user.id;
    const followingId = parseInt(req.params.userId);

    const result = await communityService.followUser(followerId, followingId);

    res.json({
      success: true,
      message: result.following ? '关注成功' : '取消关注成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 7.12 获取关注列表
router.get('/users/:userId/following', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const currentUserId = (req as any).user?.id;

    const result = await communityService.getFollowing(userId, { page, limit }, currentUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 7.13 获取粉丝列表
router.get('/users/:userId/followers', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const currentUserId = (req as any).user?.id;

    const result = await communityService.getFollowers(userId, { page, limit }, currentUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ==================== 举报相关路由 ====================

// 7.14 举报内容
router.post('/report', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { targetType, targetId, reason, description } = req.body;

    const report = await communityService.reportContent({
      userId,
      targetType,
      targetId,
      reason,
      description
    });

    res.status(201).json({
      success: true,
      message: '举报提交成功，我们会尽快处理',
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 管理员路由 ====================

// 7.15 获取举报列表（管理员）
router.get('/admin/reports', authenticateToken, requireRole(['admin', 'teacher']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const targetType = req.query.targetType as string;

    const result = await communityService.getReports({ page, limit, status, targetType });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 7.16 处理举报（管理员）
router.put('/admin/reports/:id', authenticateToken, requireRole(['admin', 'teacher']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportId = parseInt(req.params.id);
    const handlerId = (req as any).user.id;
    const { action, note } = req.body;

    const report = await communityService.handleReport(reportId, handlerId, { action, note });

    res.json({
      success: true,
      message: '举报处理成功',
      data: report
    });
  } catch (error) {
    next(error);
  }
});

export default router;
