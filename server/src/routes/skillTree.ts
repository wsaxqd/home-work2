// 技能树路由
import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import { skillTreeService } from '../services/skillTreeService';

const router = express.Router();

// 1. 获取技能树节点
router.get('/nodes', authenticateToken, async (req, res) => {
  try {
    const subject = req.query.subject as string | undefined;
    const gradeLevel = req.query.grade ? parseInt(req.query.grade as string) : undefined;

    const nodes = await skillTreeService.getSkillNodes(subject, gradeLevel);

    res.json({ success: true, data: nodes });
  } catch (error: any) {
    console.error('获取技能树节点失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. 获取节点详情
router.get('/node/:nodeId', authenticateToken, async (req, res) => {
  try {
    const { nodeId } = req.params;

    const node = await skillTreeService.getNodeDetail(nodeId);

    res.json({ success: true, data: node });
  } catch (error: any) {
    console.error('获取节点详情失败:', error);
    res.status(404).json({ success: false, message: error.message });
  }
});

// 3. 获取我的进度
router.get('/my-progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const subject = req.query.subject as string | undefined;

    const progress = await skillTreeService.getUserProgress(userId, subject);

    res.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('获取技能进度失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. 检查节点是否可解锁
router.get('/node/:nodeId/can-unlock', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { nodeId } = req.params;

    const canUnlock = await skillTreeService.canUnlockNode(userId, nodeId);

    res.json({ success: true, data: { can_unlock: canUnlock } });
  } catch (error: any) {
    console.error('检查解锁条件失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. 解锁节点
router.post('/node/:nodeId/unlock', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { nodeId } = req.params;

    const progress = await skillTreeService.unlockNode(userId, nodeId);

    res.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('解锁节点失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 6. 更新节点进度
router.post('/node/:nodeId/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { nodeId } = req.params;

    const progress = await skillTreeService.updateNodeProgress(userId, nodeId, req.body);

    res.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('更新节点进度失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. 评价节点
router.post('/node/:nodeId/rate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { nodeId } = req.params;
    const { rating } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: '缺少评分参数'
      });
    }

    const progress = await skillTreeService.rateNode(userId, nodeId, rating);

    res.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('评价节点失败:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 8. 获取推荐学习路径
router.get('/paths/recommended', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const subject = req.query.subject as string | undefined;

    const paths = await skillTreeService.getRecommendedPaths(userId, subject);

    res.json({ success: true, data: paths });
  } catch (error: any) {
    console.error('获取推荐路径失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. 开始学习路径
router.post('/path/:pathId/start', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { pathId } = req.params;

    const progress = await skillTreeService.startLearningPath(userId, pathId);

    res.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('开始学习路径失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. 获取我的路径进度
router.get('/my-paths', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    const paths = await skillTreeService.getUserPathProgress(userId);

    res.json({ success: true, data: paths });
  } catch (error: any) {
    console.error('获取路径进度失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. 更新路径进度
router.post('/path/:pathId/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { pathId } = req.params;
    const { node_index } = req.body;

    if (node_index === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少节点索引参数'
      });
    }

    const progress = await skillTreeService.updatePathProgress(userId, pathId, node_index);

    res.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('更新路径进度失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 12. 获取技能树统计
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    const stats = await skillTreeService.getSkillTreeStats(userId);

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('获取技能树统计失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
