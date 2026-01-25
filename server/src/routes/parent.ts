import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { parentAuthService } from '../services/parentAuthService';
import { childrenService } from '../services/childrenService';
import { usageDataService } from '../services/usageDataService';
import { sendVerifyCode } from '../services/emailVerifyService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 家长认证中间件
export interface ParentRequest extends Request {
  parentId?: number;
}

const parentAuthMiddleware = async (req: ParentRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: '未提供认证token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'parent') {
      return res.status(401).json({ success: false, message: '无效的认证类型' });
    }

    req.parentId = decoded.parentId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '无效的token' });
  }
};

// ===== 认证路由 =====

// 发送邮箱验证码
router.post('/send-verify-code', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: '邮箱不能为空' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }

    await sendVerifyCode(email);

    res.json({
      success: true,
      message: '验证码已发送到您的邮箱',
      data: null
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '发送验证码失败'
    });
  }
});

// 家长注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, password, name, email, verifyCode, childAccount } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '手机号和密码不能为空' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度不能少于6位' });
    }

    const result = await parentAuthService.register({
      phone,
      password,
      name,
      email,
      verifyCode,
      childAccount
    });

    res.json({
      success: true,
      message: '注册成功',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '注册失败'
    });
  }
});

// 家长登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, email, password } = req.body;

    // 支持手机号或邮箱登录
    const loginIdentifier = phone || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: '手机号/邮箱和密码不能为空' });
    }

    const result = await parentAuthService.login({ phone: loginIdentifier, password });

    res.json({
      success: true,
      message: '登录成功',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

// 获取家长信息
router.get('/profile', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const parent = await parentAuthService.verifyToken(token!);

    res.json({
      success: true,
      data: parent
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '获取信息失败'
    });
  }
});

// 更新个人信息
router.put('/profile', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const { name, email, avatar } = req.body;
    const parent = await parentAuthService.updateProfile(req.parentId!, { name, email, avatar });

    res.json({
      success: true,
      message: '更新成功',
      data: parent
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '更新失败'
    });
  }
});

// 修改密码
router.post('/change-password', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '原密码和新密码不能为空' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码长度不能少于6位' });
    }

    await parentAuthService.changePassword(req.parentId!, oldPassword, newPassword);

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '密码修改失败'
    });
  }
});

// 更新通知设置
router.put('/notification-settings', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const settings = req.body;
    const result = await parentAuthService.updateNotificationSettings(req.parentId!, settings);

    res.json({
      success: true,
      message: '设置更新成功',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '设置更新失败'
    });
  }
});

// ===== 孩子管理路由 =====

// 获取所有孩子
router.get('/children', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const children = await childrenService.getChildren(req.parentId!);

    res.json({
      success: true,
      data: children
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '获取孩子列表失败'
    });
  }
});

// 添加孩子
router.post('/children', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const { account, nickname, age, gender, grade, avatar } = req.body;

    if (!account || !nickname || !age || !gender || !grade) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const child = await childrenService.addChild(req.parentId!, {
      account,
      nickname,
      age: parseInt(age),
      gender,
      grade,
      avatar: avatar || '👦'
    });

    res.json({
      success: true,
      message: '添加成功',
      data: child
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '添加失败'
    });
  }
});

// 更新孩子信息
router.put('/children/:childId', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const childId = parseInt(req.params.childId);
    const { nickname, age, gender, grade, avatar } = req.body;

    const child = await childrenService.updateChild(req.parentId!, childId, {
      nickname,
      age: age ? parseInt(age) : undefined,
      gender,
      grade,
      avatar
    });

    res.json({
      success: true,
      message: '更新成功',
      data: child
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '更新失败'
    });
  }
});

// 删除（解绑）孩子
router.delete('/children/:childId', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const childId = parseInt(req.params.childId);
    await childrenService.deleteChild(req.parentId!, childId);

    res.json({
      success: true,
      message: '解绑成功'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '解绑失败'
    });
  }
});

// ===== 使用数据路由 =====

// 获取孩子的使用统计
router.get('/usage-stats/:userId', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const stats = await usageDataService.getUsageStats(userId, startDate, endDate);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '获取统计失败'
    });
  }
});

// 获取今日使用时长
router.get('/today-usage/:userId', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const usage = await usageDataService.getTodayUsage(userId);

    res.json({
      success: true,
      data: usage
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '获取数据失败'
    });
  }
});

// 获取成长报告
router.get('/growth-report/:userId', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const reportType = (req.query.type as 'week' | 'month') || 'week';

    const reportData = await usageDataService.getGrowthReportData(userId, reportType);

    res.json({
      success: true,
      data: reportData
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '获取报告失败'
    });
  }
});

// ===== 控制设置路由 =====

// 获取控制设置
router.get('/control-settings/:userId', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const settings = await usageDataService.getControlSettings(userId);

    res.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '获取设置失败'
    });
  }
});

// 更新控制设置
router.put('/control-settings/:userId', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const settings = req.body;

    const updated = await usageDataService.updateControlSettings(userId, settings);

    res.json({
      success: true,
      message: '设置更新成功',
      data: updated
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '设置更新失败'
    });
  }
});

// 检查时间限制
router.get('/check-limit/:userId', parentAuthMiddleware, async (req: ParentRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await usageDataService.checkTimeLimit(userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '检查失败'
    });
  }
});

export default router;
