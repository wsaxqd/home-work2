import { describe, it, expect, beforeEach, jest } from '@jest/globals';

/**
 * 积分系统服务单元测试
 *
 * 测试范围：
 * - 积分查询和余额获取
 * - 积分增加和扣除
 * - 等级升级逻辑
 * - 边界条件和异常处理
 */

// Mock 积分服务
class PointsService {
  private mockDatabase: Map<string, { points: number; level: number }>;
  private mockLevelConfigs: Array<{ level: number; min_points: number; max_points: number; title: string }>;

  constructor() {
    this.mockDatabase = new Map();
    this.mockLevelConfigs = [
      { level: 1, min_points: 0, max_points: 99, title: '初学者' },
      { level: 2, min_points: 100, max_points: 299, title: '学徒' },
      { level: 3, min_points: 300, max_points: 599, title: '进阶者' },
      { level: 4, min_points: 600, max_points: 999, title: '专家' },
      { level: 5, min_points: 1000, max_points: 999999, title: '大师' },
    ];
  }

  /**
   * 获取用户积分信息
   */
  async getUserPoints(userId: string) {
    const user = this.mockDatabase.get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const levelConfig = this.mockLevelConfigs.find(c => c.level === user.level);
    const nextLevelConfig = this.mockLevelConfigs.find(c => c.level === user.level + 1);

    const progressToNext = nextLevelConfig
      ? Math.min(100, ((user.points - (levelConfig?.min_points || 0)) /
        ((nextLevelConfig?.min_points || 0) - (levelConfig?.min_points || 0))) * 100)
      : 100;

    return {
      currentPoints: user.points,
      level: user.level,
      levelConfig,
      nextLevelConfig,
      progressToNext: Math.round(progressToNext * 100) / 100,
    };
  }

  /**
   * 增加积分
   */
  async addPoints(userId: string, amount: number, reason: string) {
    if (amount <= 0) {
      throw new Error('积分数量必须大于0');
    }

    const user = this.mockDatabase.get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    user.points += amount;

    // 检查升级
    const newLevel = this.calculateLevel(user.points);
    const leveledUp = newLevel > user.level;
    user.level = newLevel;

    this.mockDatabase.set(userId, user);

    return {
      success: true,
      newBalance: user.points,
      amount,
      leveledUp,
      newLevel: user.level,
    };
  }

  /**
   * 扣除积分
   */
  async deductPoints(userId: string, amount: number, reason: string) {
    if (amount <= 0) {
      throw new Error('积分数量必须大于0');
    }

    const user = this.mockDatabase.get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.points < amount) {
      throw new Error('积分不足');
    }

    user.points -= amount;
    this.mockDatabase.set(userId, user);

    return {
      success: true,
      newBalance: user.points,
      amount,
    };
  }

  /**
   * 计算等级
   */
  private calculateLevel(points: number): number {
    for (let i = this.mockLevelConfigs.length - 1; i >= 0; i--) {
      if (points >= this.mockLevelConfigs[i].min_points) {
        return this.mockLevelConfigs[i].level;
      }
    }
    return 1;
  }

  /**
   * 创建测试用户
   */
  createTestUser(userId: string, points: number = 0, level: number = 1) {
    this.mockDatabase.set(userId, { points, level });
  }

  /**
   * 清空测试数据
   */
  clearTestData() {
    this.mockDatabase.clear();
  }
}

describe('PointsService - 积分系统服务单元测试', () => {
  let pointsService: PointsService;

  beforeEach(() => {
    pointsService = new PointsService();
  });

  describe('getUserPoints - 获取用户积分信息', () => {
    it('应该成功获取用户积分信息', async () => {
      // 真实业务场景：用户查看自己的积分和等级
      const userId = 'test-user-1';
      pointsService.createTestUser(userId, 150, 2);

      const result = await pointsService.getUserPoints(userId);

      expect(result.currentPoints).toBe(150);
      expect(result.level).toBe(2);
      expect(result.levelConfig?.title).toBe('学徒');
      expect(result.nextLevelConfig?.level).toBe(3);
      expect(result.progressToNext).toBeGreaterThan(0);
      expect(result.progressToNext).toBeLessThanOrEqual(100);
    });

    it('应该正确计算升级进度', async () => {
      const userId = 'test-user-2';
      // Level 2: 100-299, Level 3: 300+
      // 200 点在 Level 2 的进度: (200-100)/(300-100) = 50%
      pointsService.createTestUser(userId, 200, 2);

      const result = await pointsService.getUserPoints(userId);

      expect(result.progressToNext).toBe(50);
    });

    it('最高等级用户进度应该是100%', async () => {
      const userId = 'test-user-3';
      pointsService.createTestUser(userId, 10000, 5);

      const result = await pointsService.getUserPoints(userId);

      expect(result.level).toBe(5);
      expect(result.nextLevelConfig).toBeUndefined();
      expect(result.progressToNext).toBe(100);
    });

    it('边界条件：应该拒绝不存在的用户', async () => {
      await expect(pointsService.getUserPoints('non-existent-user'))
        .rejects.toThrow('用户不存在');
    });
  });

  describe('addPoints - 增加积分', () => {
    it('应该成功增加积分', async () => {
      const userId = 'test-user-4';
      pointsService.createTestUser(userId, 50, 1);

      const result = await pointsService.addPoints(userId, 30, '完成任务');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(80);
      expect(result.amount).toBe(30);
    });

    it('增加积分后应该自动升级', async () => {
      const userId = 'test-user-5';
      pointsService.createTestUser(userId, 90, 1);

      // 从 90 增加到 110，应该从 Level 1 升到 Level 2
      const result = await pointsService.addPoints(userId, 20, '升级奖励');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(110);
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    it('增加大量积分应该正确计算等级', async () => {
      const userId = 'test-user-6';
      pointsService.createTestUser(userId, 0, 1);

      // 一次性增加 500 积分，应该直接到 Level 3
      const result = await pointsService.addPoints(userId, 500, '大额奖励');

      expect(result.newBalance).toBe(500);
      expect(result.newLevel).toBe(3);
    });

    it('边界条件：应该拒绝负数积分', async () => {
      const userId = 'test-user-7';
      pointsService.createTestUser(userId, 100, 1);

      await expect(pointsService.addPoints(userId, -10, '非法操作'))
        .rejects.toThrow('积分数量必须大于0');
    });

    it('边界条件：应该拒绝零积分', async () => {
      const userId = 'test-user-8';
      pointsService.createTestUser(userId, 100, 1);

      await expect(pointsService.addPoints(userId, 0, '无效操作'))
        .rejects.toThrow('积分数量必须大于0');
    });

    it('边界条件：应该拒绝不存在的用户', async () => {
      await expect(pointsService.addPoints('non-existent', 10, '测试'))
        .rejects.toThrow('用户不存在');
    });

    it('真实场景：多次增加积分应该累计', async () => {
      const userId = 'test-user-9';
      pointsService.createTestUser(userId, 0, 1);

      await pointsService.addPoints(userId, 10, '签到');
      await pointsService.addPoints(userId, 20, '完成作业');
      const result = await pointsService.addPoints(userId, 30, '练习题');

      expect(result.newBalance).toBe(60);
    });
  });

  describe('deductPoints - 扣除积分', () => {
    it('应该成功扣除积分', async () => {
      const userId = 'test-user-10';
      pointsService.createTestUser(userId, 100, 2);

      const result = await pointsService.deductPoints(userId, 30, '商品兑换');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(70);
      expect(result.amount).toBe(30);
    });

    it('应该允许扣除全部积分', async () => {
      const userId = 'test-user-11';
      pointsService.createTestUser(userId, 50, 1);

      const result = await pointsService.deductPoints(userId, 50, '全额兑换');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(0);
    });

    it('边界条件：应该拒绝积分不足的扣除', async () => {
      const userId = 'test-user-12';
      pointsService.createTestUser(userId, 50, 1);

      await expect(pointsService.deductPoints(userId, 100, '超额兑换'))
        .rejects.toThrow('积分不足');
    });

    it('边界条件：应该拒绝负数扣除', async () => {
      const userId = 'test-user-13';
      pointsService.createTestUser(userId, 100, 1);

      await expect(pointsService.deductPoints(userId, -10, '非法操作'))
        .rejects.toThrow('积分数量必须大于0');
    });

    it('边界条件：应该拒绝零积分扣除', async () => {
      const userId = 'test-user-14';
      pointsService.createTestUser(userId, 100, 1);

      await expect(pointsService.deductPoints(userId, 0, '无效操作'))
        .rejects.toThrow('积分数量必须大于0');
    });

    it('边界条件：应该拒绝不存在的用户', async () => {
      await expect(pointsService.deductPoints('non-existent', 10, '测试'))
        .rejects.toThrow('用户不存在');
    });

    it('真实场景：先增加后扣除应该正确计算余额', async () => {
      const userId = 'test-user-15';
      pointsService.createTestUser(userId, 100, 2);

      await pointsService.addPoints(userId, 50, '奖励');
      const result = await pointsService.deductPoints(userId, 80, '兑换');

      expect(result.newBalance).toBe(70); // 100 + 50 - 80 = 70
    });
  });

  describe('等级系统 - Level System', () => {
    it('应该正确识别等级1（0-99积分）', async () => {
      const userId = 'test-level-1';
      pointsService.createTestUser(userId, 50, 1);

      const result = await pointsService.getUserPoints(userId);
      expect(result.level).toBe(1);
      expect(result.levelConfig?.title).toBe('初学者');
    });

    it('应该正确识别等级2（100-299积分）', async () => {
      const userId = 'test-level-2';
      pointsService.createTestUser(userId, 200, 2);

      const result = await pointsService.getUserPoints(userId);
      expect(result.level).toBe(2);
      expect(result.levelConfig?.title).toBe('学徒');
    });

    it('应该正确识别等级3（300-599积分）', async () => {
      const userId = 'test-level-3';
      pointsService.createTestUser(userId, 450, 3);

      const result = await pointsService.getUserPoints(userId);
      expect(result.level).toBe(3);
      expect(result.levelConfig?.title).toBe('进阶者');
    });

    it('应该正确识别等级4（600-999积分）', async () => {
      const userId = 'test-level-4';
      pointsService.createTestUser(userId, 800, 4);

      const result = await pointsService.getUserPoints(userId);
      expect(result.level).toBe(4);
      expect(result.levelConfig?.title).toBe('专家');
    });

    it('应该正确识别等级5（1000+积分）', async () => {
      const userId = 'test-level-5';
      pointsService.createTestUser(userId, 5000, 5);

      const result = await pointsService.getUserPoints(userId);
      expect(result.level).toBe(5);
      expect(result.levelConfig?.title).toBe('大师');
    });

    it('边界值：99积分应该是等级1', async () => {
      const userId = 'test-boundary-1';
      pointsService.createTestUser(userId, 99, 1);

      const result = await pointsService.getUserPoints(userId);
      expect(result.level).toBe(1);
    });

    it('边界值：100积分应该升级到等级2', async () => {
      const userId = 'test-boundary-2';
      pointsService.createTestUser(userId, 99, 1);

      const addResult = await pointsService.addPoints(userId, 1, '升级测试');
      expect(addResult.leveledUp).toBe(true);
      expect(addResult.newLevel).toBe(2);
    });
  });

  describe('真实业务场景测试', () => {
    it('场景1：新用户完成每日任务获取积分', async () => {
      const userId = 'new-user-1';
      pointsService.createTestUser(userId, 0, 1);

      // 签到 +5
      await pointsService.addPoints(userId, 5, '每日签到');
      // 完成作业 +20
      await pointsService.addPoints(userId, 20, '完成作业');
      // 练习题 +10
      const result = await pointsService.addPoints(userId, 10, '练习题');

      expect(result.newBalance).toBe(35);
      expect(result.newLevel).toBe(1);
    });

    it('场景2：用户通过学习升级', async () => {
      const userId = 'student-1';
      pointsService.createTestUser(userId, 80, 1);

      // 连续完成任务
      const tasks = [
        { points: 10, reason: '完成第一课' },
        { points: 15, reason: '完成测验' },
        { points: 20, reason: '获得满分' },
      ];

      let lastResult;
      for (const task of tasks) {
        lastResult = await pointsService.addPoints(userId, task.points, task.reason);
      }

      expect(lastResult?.newBalance).toBe(125); // 80 + 10 + 15 + 20
      expect(lastResult?.newLevel).toBe(2); // 升到 Level 2
    });

    it('场景3：用户兑换商品后积分不足再次兑换', async () => {
      const userId = 'shopper-1';
      pointsService.createTestUser(userId, 100, 2);

      // 第一次兑换成功
      await pointsService.deductPoints(userId, 60, '兑换笔记本');

      // 第二次兑换失败（积分不足）
      await expect(pointsService.deductPoints(userId, 50, '兑换书包'))
        .rejects.toThrow('积分不足');

      // 验证余额
      const result = await pointsService.getUserPoints(userId);
      expect(result.currentPoints).toBe(40); // 100 - 60
    });

    it('场景4：连续多日签到积累积分', async () => {
      const userId = 'daily-user';
      pointsService.createTestUser(userId, 0, 1);

      // 模拟7天签到
      for (let day = 1; day <= 7; day++) {
        await pointsService.addPoints(userId, 5, `第${day}天签到`);
      }

      const result = await pointsService.getUserPoints(userId);
      expect(result.currentPoints).toBe(35); // 7 * 5
    });
  });
});
