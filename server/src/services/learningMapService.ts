import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

/**
 * 学习地图服务
 * 提供关卡解锁、勋章检查等功能
 */
export class LearningMapService {
  /**
   * 检查关卡是否解锁
   * @param userId 用户ID
   * @param stageId 关卡ID
   */
  async checkStageUnlock(userId: string, stageId: number): Promise<{
    isUnlocked: boolean;
    reason?: string;
  }> {
    try {
      // 获取关卡信息
      const stageResult = await query(
        'SELECT * FROM learning_stages WHERE id = $1',
        [stageId]
      );

      if (stageResult.rows.length === 0) {
        throw new AppError('关卡不存在', 404);
      }

      const stage = stageResult.rows[0];
      const unlockCondition = stage.unlock_condition || {};

      // 获取用户进度
      const progressResult = await query(
        'SELECT * FROM user_learning_progress WHERE user_id = $1 AND map_id = $2',
        [userId, stage.map_id]
      );

      const userProgress = progressResult.rows[0];

      // 检查解锁条件
      switch (unlockCondition.type) {
        case 'always':
          // 始终解锁（第一关）
          return { isUnlocked: true };

        case 'previous_stage':
          // 需要完成前置关卡
          const requiredStage = unlockCondition.stage || stage.stage_number - 1;

          if (!userProgress || userProgress.current_stage < requiredStage) {
            return {
              isUnlocked: false,
              reason: `需要先完成第${requiredStage}关`
            };
          }
          return { isUnlocked: true };

        case 'stars':
          // 需要收集足够的星星
          const requiredStars = unlockCondition.stars || 0;
          const userStars = userProgress?.total_stars_earned || 0;

          if (userStars < requiredStars) {
            return {
              isUnlocked: false,
              reason: `需要收集${requiredStars}颗星星（当前${userStars}颗）`
            };
          }
          return { isUnlocked: true };

        case 'perfect_stages':
          // 需要完美通关指定数量的关卡
          const requiredPerfect = unlockCondition.count || 0;
          const perfectResult = await query(
            `SELECT COUNT(*) as count FROM stage_completions
             WHERE user_id = $1 AND is_perfect = true`,
            [userId]
          );
          const perfectCount = parseInt(perfectResult.rows[0].count);

          if (perfectCount < requiredPerfect) {
            return {
              isUnlocked: false,
              reason: `需要完美通关${requiredPerfect}个关卡（当前${perfectCount}个）`
            };
          }
          return { isUnlocked: true };

        case 'badge':
          // 需要获得指定勋章
          const requiredBadgeId = unlockCondition.badge_id;
          const badgeResult = await query(
            'SELECT * FROM user_badges WHERE user_id = $1 AND badge_id = $2',
            [userId, requiredBadgeId]
          );

          if (badgeResult.rows.length === 0) {
            const badgeInfo = await query(
              'SELECT badge_name FROM badges WHERE id = $1',
              [requiredBadgeId]
            );
            const badgeName = badgeInfo.rows[0]?.badge_name || '指定勋章';
            return {
              isUnlocked: false,
              reason: `需要获得"${badgeName}"勋章`
            };
          }
          return { isUnlocked: true };

        case 'level':
          // 需要达到指定等级
          const requiredLevel = unlockCondition.level || 1;
          const userResult = await query(
            'SELECT level FROM users WHERE id = $1',
            [userId]
          );
          const userLevel = userResult.rows[0]?.level || 1;

          if (userLevel < requiredLevel) {
            return {
              isUnlocked: false,
              reason: `需要达到${requiredLevel}级（当前${userLevel}级）`
            };
          }
          return { isUnlocked: true };

        default:
          // 默认解锁
          return { isUnlocked: true };
      }
    } catch (error: any) {
      console.error('检查关卡解锁失败:', error);
      throw error;
    }
  }

  /**
   * 检查并授予勋章
   * @param userId 用户ID
   * @param mapId 地图ID（可选）
   */
  async checkAndAwardBadges(userId: string, mapId?: number): Promise<number[]> {
    try {
      const awardedBadges: number[] = [];

      // 获取所有勋章
      const badgesResult = await query(
        'SELECT * FROM badges WHERE is_active = true ORDER BY id'
      );

      for (const badge of badgesResult.rows) {
        // 检查用户是否已获得该勋章
        const existingResult = await query(
          'SELECT * FROM user_badges WHERE user_id = $1 AND badge_id = $2',
          [userId, badge.id]
        );

        if (existingResult.rows.length > 0) {
          continue; // 已获得，跳过
        }

        // 检查是否满足条件
        const isEligible = await this.checkBadgeEligibility(userId, badge, mapId);

        if (isEligible) {
          // 授予勋章
          await query(
            `INSERT INTO user_badges (user_id, badge_id, earned_at)
             VALUES ($1, $2, NOW())`,
            [userId, badge.id]
          );

          // 添加积分奖励
          if (badge.points_reward) {
            await query(
              'UPDATE users SET total_points = total_points + $1 WHERE id = $2',
              [badge.points_reward, userId]
            );
          }

          awardedBadges.push(badge.id);
        }
      }

      return awardedBadges;
    } catch (error: any) {
      console.error('检查勋章失败:', error);
      return [];
    }
  }

  /**
   * 检查用户是否符合勋章条件
   */
  private async checkBadgeEligibility(
    userId: string,
    badge: any,
    mapId?: number
  ): Promise<boolean> {
    const condition = badge.unlock_condition || {};

    try {
      switch (condition.type) {
        case 'complete_stages':
          // 完成指定数量的关卡
          const requiredStages = condition.count || 0;
          const completedResult = await query(
            'SELECT COUNT(DISTINCT stage_id) as count FROM stage_completions WHERE user_id = $1',
            [userId]
          );
          const completedCount = parseInt(completedResult.rows[0].count);
          return completedCount >= requiredStages;

        case 'collect_stars':
          // 收集指定数量的星星
          const requiredStars = condition.count || 0;
          const starsResult = await query(
            'SELECT SUM(stars_earned) as total FROM stage_completions WHERE user_id = $1',
            [userId]
          );
          const totalStars = parseInt(starsResult.rows[0].total || 0);
          return totalStars >= requiredStars;

        case 'perfect_stages':
          // 完美通关指定数量的关卡
          const requiredPerfect = condition.count || 0;
          const perfectResult = await query(
            'SELECT COUNT(*) as count FROM stage_completions WHERE user_id = $1 AND is_perfect = true',
            [userId]
          );
          const perfectCount = parseInt(perfectResult.rows[0].count);
          return perfectCount >= requiredPerfect;

        case 'complete_map':
          // 完成整个地图
          if (!mapId) return false;

          const mapStagesResult = await query(
            'SELECT COUNT(*) as total FROM learning_stages WHERE map_id = $1',
            [mapId]
          );
          const totalMapStages = parseInt(mapStagesResult.rows[0].total);

          const completedMapResult = await query(
            `SELECT COUNT(DISTINCT sc.stage_id) as count
             FROM stage_completions sc
             JOIN learning_stages ls ON sc.stage_id = ls.id
             WHERE sc.user_id = $1 AND ls.map_id = $2`,
            [userId, mapId]
          );
          const completedMapStages = parseInt(completedMapResult.rows[0].count);

          return completedMapStages >= totalMapStages;

        case 'consecutive_perfect':
          // 连续完美通关
          const requiredConsecutive = condition.count || 0;
          const recentResult = await query(
            `SELECT is_perfect FROM stage_completions
             WHERE user_id = $1
             ORDER BY completed_at DESC
             LIMIT $2`,
            [userId, requiredConsecutive]
          );

          if (recentResult.rows.length < requiredConsecutive) {
            return false;
          }

          return recentResult.rows.every((row: any) => row.is_perfect);

        case 'speed_run':
          // 快速通关（在指定时间内完成关卡）
          const maxTime = condition.time || 0;
          const speedResult = await query(
            `SELECT COUNT(*) as count FROM stage_completions
             WHERE user_id = $1 AND time_spent <= $2`,
            [userId, maxTime]
          );
          const speedCount = parseInt(speedResult.rows[0].count);
          return speedCount >= (condition.count || 1);

        case 'subject_master':
          // 学科大师（完成某学科的所有关卡）
          const subject = condition.subject;
          if (!subject) return false;

          const subjectStagesResult = await query(
            `SELECT COUNT(*) as total FROM learning_stages ls
             JOIN learning_maps lm ON ls.map_id = lm.id
             WHERE lm.subject = $1`,
            [subject]
          );
          const totalSubjectStages = parseInt(subjectStagesResult.rows[0].total);

          const completedSubjectResult = await query(
            `SELECT COUNT(DISTINCT sc.stage_id) as count
             FROM stage_completions sc
             JOIN learning_stages ls ON sc.stage_id = ls.id
             JOIN learning_maps lm ON ls.map_id = lm.id
             WHERE sc.user_id = $1 AND lm.subject = $2`,
            [userId, subject]
          );
          const completedSubjectStages = parseInt(completedSubjectResult.rows[0].count);

          return completedSubjectStages >= totalSubjectStages;

        case 'daily_streak':
          // 连续签到天数
          const requiredDays = condition.days || 0;
          const streakResult = await query(
            `SELECT MAX(streak_days) as max_streak FROM user_activity_logs
             WHERE user_id = $1`,
            [userId]
          );
          const maxStreak = parseInt(streakResult.rows[0]?.max_streak || 0);
          return maxStreak >= requiredDays;

        default:
          return false;
      }
    } catch (error: any) {
      console.error('检查勋章条件失败:', error);
      return false;
    }
  }

  /**
   * 获取用户可解锁的下一个关卡
   */
  async getNextUnlockedStage(userId: string, mapId: number): Promise<number | null> {
    try {
      // 获取所有关卡
      const stagesResult = await query(
        'SELECT id, stage_number FROM learning_stages WHERE map_id = $1 ORDER BY stage_number',
        [mapId]
      );

      // 检查每个关卡的解锁状态
      for (const stage of stagesResult.rows) {
        const unlockStatus = await this.checkStageUnlock(userId, stage.id);
        if (unlockStatus.isUnlocked) {
          // 检查是否已完成
          const completionResult = await query(
            'SELECT * FROM stage_completions WHERE user_id = $1 AND stage_id = $2',
            [userId, stage.id]
          );

          if (completionResult.rows.length === 0) {
            return stage.id; // 找到第一个未完成且已解锁的关卡
          }
        }
      }

      return null; // 所有关卡都已完成或都未解锁
    } catch (error: any) {
      console.error('获取下一个关卡失败:', error);
      return null;
    }
  }

  /**
   * 获取勋章详情（包括进度）
   */
  async getBadgeProgress(userId: string, badgeId: number): Promise<any> {
    try {
      const badgeResult = await query(
        'SELECT * FROM badges WHERE id = $1',
        [badgeId]
      );

      if (badgeResult.rows.length === 0) {
        throw new AppError('勋章不存在', 404);
      }

      const badge = badgeResult.rows[0];
      const condition = badge.unlock_condition || {};

      let current = 0;
      let required = 0;
      let progress = 0;

      // 根据条件类型计算进度
      switch (condition.type) {
        case 'complete_stages':
          required = condition.count || 0;
          const completedResult = await query(
            'SELECT COUNT(DISTINCT stage_id) as count FROM stage_completions WHERE user_id = $1',
            [userId]
          );
          current = parseInt(completedResult.rows[0].count);
          break;

        case 'collect_stars':
          required = condition.count || 0;
          const starsResult = await query(
            'SELECT SUM(stars_earned) as total FROM stage_completions WHERE user_id = $1',
            [userId]
          );
          current = parseInt(starsResult.rows[0].total || 0);
          break;

        case 'perfect_stages':
          required = condition.count || 0;
          const perfectResult = await query(
            'SELECT COUNT(*) as count FROM stage_completions WHERE user_id = $1 AND is_perfect = true',
            [userId]
          );
          current = parseInt(perfectResult.rows[0].count);
          break;
      }

      if (required > 0) {
        progress = Math.min(100, Math.round((current / required) * 100));
      }

      return {
        ...badge,
        progress: {
          current,
          required,
          percentage: progress
        }
      };
    } catch (error: any) {
      console.error('获取勋章进度失败:', error);
      throw error;
    }
  }
}

export const learningMapService = new LearningMapService();
