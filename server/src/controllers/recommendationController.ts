import { Request, Response } from 'express';
import { enhancedRecommendationService } from '../services/enhancedRecommendationService';
import { recommendationService } from '../services/recommendationService';

// 获取个性化推荐
export const getPersonalizedRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = 20 } = req.query;

    const recommendations = await enhancedRecommendationService.hybridRecommendation(
      userId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('获取个性化推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐失败'
    });
  }
};

// 获取用户画像
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const profile = await enhancedRecommendationService.buildUserProfile(userId);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('获取用户画像失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户画像失败'
    });
  }
};

// 协同过滤推荐
export const getCollaborativeRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = 10 } = req.query;

    const recommendations = await enhancedRecommendationService.collaborativeFiltering(
      userId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('协同过滤推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐失败'
    });
  }
};

// 基于内容的推荐
export const getContentBasedRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = 10 } = req.query;

    const userProfile = await enhancedRecommendationService.buildUserProfile(userId);
    const recommendations = await enhancedRecommendationService.contentBasedRecommendation(
      userProfile,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('基于内容推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐失败'
    });
  }
};

// 学习路径推荐
export const getLearningPathRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const learningPath = await enhancedRecommendationService.recommendLearningPath(userId);

    res.json({
      success: true,
      data: learningPath
    });
  } catch (error) {
    console.error('学习路径推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学习路径推荐失败'
    });
  }
};

// 首页推荐(兼容旧接口)
export const getHomeRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      // 未登录用户返回热门内容
      const recommendations = await recommendationService.getPersonalizedRecommendations('');
      return res.json({
        success: true,
        data: recommendations
      });
    }

    // 登录用户返回个性化推荐
    const recommendations = await enhancedRecommendationService.hybridRecommendation(userId, 20);

    res.json({
      success: true,
      data: {
        works: recommendations.filter(r => r.type !== 'topic' && r.type !== 'template'),
        topics: [], // 可以添加话题推荐
        templates: [], // 可以添加模板推荐
        reason: '为你精选的内容'
      }
    });
  } catch (error) {
    console.error('获取首页推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐失败'
    });
  }
};
