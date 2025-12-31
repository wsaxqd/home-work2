import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import { difyAdapter } from './difyAdapter';

export interface ModerationResult {
  safe: boolean;
  score: number; // 0-100, 越高越安全
  categories: {
    violence: number;
    inappropriate: number;
    personal_info: number;
    bullying: number;
  };
  flaggedTerms: string[];
  suggestions?: string[];
}

export interface SafetyReport {
  contentId: string;
  contentType: string;
  moderationResult: ModerationResult;
  action: 'approved' | 'flagged' | 'blocked';
  timestamp: Date;
}

export class ModerationService {
  // 敏感词库（示例，实际应该从数据库加载）
  private blockedWords = [
    '暴力', '欺凌', '攻击', '伤害',
    // 实际应该有更完整的词库
  ];

  // 个人信息模式
  private personalInfoPatterns = [
    /\d{11}/, // 手机号
    /\d{15,18}/, // 身份证号
    /[\w\-\.]+@[\w\-\.]+\.\w+/, // 邮箱
  ];

  /**
   * 内容审核 - 主方法
   */
  async moderateContent(
    userId: string,
    content: string,
    contentType: 'text' | 'comment' | 'work' | 'message'
  ): Promise<ModerationResult> {
    // 1. 基础关键词过滤
    const keywordCheck = this.checkKeywords(content);

    // 2. 个人信息检测
    const personalInfoCheck = this.checkPersonalInfo(content);

    // 3. AI语义分析（使用Dify）
    const aiCheck = await this.aiModerationCheck(userId, content, contentType);

    // 综合评分
    const finalScore = this.calculateFinalScore(keywordCheck, personalInfoCheck, aiCheck);

    const result: ModerationResult = {
      safe: finalScore >= 70, // 70分以上认为安全
      score: finalScore,
      categories: {
        violence: aiCheck.categories.violence || 0,
        inappropriate: aiCheck.categories.inappropriate || 0,
        personal_info: personalInfoCheck.score,
        bullying: aiCheck.categories.bullying || 0,
      },
      flaggedTerms: [...keywordCheck.flaggedWords, ...personalInfoCheck.flaggedPatterns],
      suggestions: this.generateSuggestions(finalScore, keywordCheck, personalInfoCheck),
    };

    // 记录审核日志
    await this.logModeration(userId, content, contentType, result);

    return result;
  }

  /**
   * 批量审核
   */
  async moderateBatch(
    userId: string,
    contents: Array<{ id: string; content: string; type: string }>
  ) {
    const results = [];

    for (const item of contents) {
      const result = await this.moderateContent(userId, item.content, item.type as any);
      results.push({
        id: item.id,
        ...result,
      });
    }

    return results;
  }

  /**
   * 检查用户行为模式
   */
  async checkUserBehavior(userId: string): Promise<{
    risk: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestions: string[];
  }> {
    // 获取用户最近的审核记录
    const recentModerations = await query(
      `SELECT moderation_result, content_type, created_at
       FROM moderation_logs
       WHERE user_id = $1
       AND created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    const logs = recentModerations.rows;

    if (logs.length === 0) {
      return {
        risk: 'low',
        reasons: [],
        suggestions: [],
      };
    }

    // 分析违规次数
    const flaggedCount = logs.filter(
      (log) => JSON.parse(log.moderation_result).safe === false
    ).length;

    const flaggedRate = flaggedCount / logs.length;

    let risk: 'low' | 'medium' | 'high' = 'low';
    const reasons: string[] = [];
    const suggestions: string[] = [];

    if (flaggedRate >= 0.3) {
      risk = 'high';
      reasons.push(`近期内容有${(flaggedRate * 100).toFixed(0)}%被标记为不当`);
      suggestions.push('建议家长关注孩子的在线行为');
      suggestions.push('可以启用更严格的内容过滤');
    } else if (flaggedRate >= 0.15) {
      risk = 'medium';
      reasons.push('有少量内容被标记');
      suggestions.push('建议适当引导孩子的内容创作');
    } else {
      risk = 'low';
    }

    // 检查发布频率异常
    if (logs.length > 30) {
      reasons.push('内容发布频率较高');
      suggestions.push('注意控制使用时间');
    }

    return { risk, reasons, suggestions };
  }

  /**
   * 获取审核统计
   */
  async getModerationStats(userId?: string, days: number = 7) {
    let whereClause = 'WHERE created_at >= NOW() - INTERVAL $1';
    const params: any[] = [`${days} days`];

    if (userId) {
      whereClause += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await query(
      `SELECT
         COUNT(*) as total_checks,
         COUNT(*) FILTER (WHERE (moderation_result->>'safe')::boolean = false) as flagged_count,
         AVG((moderation_result->>'score')::numeric) as avg_score,
         content_type,
         action
       FROM moderation_logs
       ${whereClause}
       GROUP BY content_type, action`,
      params
    );

    return result.rows;
  }

  /**
   * 获取被标记的内容列表
   */
  async getFlaggedContent(limit: number = 20) {
    const result = await query(
      `SELECT
         ml.id,
         ml.user_id,
         u.nickname,
         ml.content,
         ml.content_type,
         ml.moderation_result,
         ml.action,
         ml.created_at
       FROM moderation_logs ml
       JOIN users u ON ml.user_id = u.id
       WHERE (ml.moderation_result->>'safe')::boolean = false
       AND ml.reviewed = false
       ORDER BY ml.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * 人工审核标记的内容
   */
  async reviewFlaggedContent(
    logId: string,
    reviewerId: string,
    decision: 'approve' | 'block' | 'warn',
    note?: string
  ) {
    await query(
      `UPDATE moderation_logs
       SET reviewed = true,
           reviewer_id = $1,
           review_decision = $2,
           review_note = $3,
           reviewed_at = NOW()
       WHERE id = $4`,
      [reviewerId, decision, note || '', logId]
    );

    return { success: true };
  }

  // ========== 私有方法 ==========

  /**
   * 关键词检查
   */
  private checkKeywords(content: string): {
    score: number;
    flaggedWords: string[];
  } {
    const flaggedWords: string[] = [];

    for (const word of this.blockedWords) {
      if (content.includes(word)) {
        flaggedWords.push(word);
      }
    }

    // 每个敏感词扣20分
    const score = Math.max(0, 100 - flaggedWords.length * 20);

    return { score, flaggedWords };
  }

  /**
   * 个人信息检查
   */
  private checkPersonalInfo(content: string): {
    score: number;
    flaggedPatterns: string[];
  } {
    const flaggedPatterns: string[] = [];

    for (const pattern of this.personalInfoPatterns) {
      if (pattern.test(content)) {
        if (pattern.source.includes('11')) {
          flaggedPatterns.push('疑似手机号');
        } else if (pattern.source.includes('15,18')) {
          flaggedPatterns.push('疑似身份证号');
        } else if (pattern.source.includes('@')) {
          flaggedPatterns.push('疑似邮箱地址');
        }
      }
    }

    const score = flaggedPatterns.length > 0 ? 30 : 100;
    return { score, flaggedPatterns };
  }

  /**
   * AI语义分析
   */
  private async aiModerationCheck(
    userId: string,
    content: string,
    contentType: string
  ): Promise<{
    score: number;
    categories: {
      violence?: number;
      inappropriate?: number;
      bullying?: number;
    };
  }> {
    try {
      const response = await difyAdapter.completion(
        difyAdapter.getTutoringAppKey(), // 或创建专门的moderation app key
        userId,
        {
          content,
          contentType,
          task: 'content_moderation',
          prompt: `请分析以下儿童平台用户内容的安全性，从以下维度评分（0-100）：
1. 暴力内容
2. 不当内容
3. 欺凌内容

内容：${content}

请返回JSON格式：{"violence": 分数, "inappropriate": 分数, "bullying": 分数, "overall": 综合分数}`,
        }
      );

      // 尝试解析AI返回
      try {
        const parsed = JSON.parse(response.answer);
        return {
          score: parsed.overall || 80,
          categories: {
            violence: 100 - (parsed.violence || 0),
            inappropriate: 100 - (parsed.inappropriate || 0),
            bullying: 100 - (parsed.bullying || 0),
          },
        };
      } catch {
        // 解析失败，返回默认值
        return {
          score: 80,
          categories: {},
        };
      }
    } catch (error) {
      console.error('AI moderation check failed:', error);
      // AI检查失败，返回中等分数
      return {
        score: 70,
        categories: {},
      };
    }
  }

  /**
   * 计算最终得分
   */
  private calculateFinalScore(
    keywordCheck: any,
    personalInfoCheck: any,
    aiCheck: any
  ): number {
    // 加权平均
    const weights = {
      keyword: 0.3,
      personalInfo: 0.3,
      ai: 0.4,
    };

    return Math.round(
      keywordCheck.score * weights.keyword +
      personalInfoCheck.score * weights.personalInfo +
      aiCheck.score * weights.ai
    );
  }

  /**
   * 生成建议
   */
  private generateSuggestions(
    score: number,
    keywordCheck: any,
    personalInfoCheck: any
  ): string[] {
    const suggestions: string[] = [];

    if (score < 70) {
      if (keywordCheck.flaggedWords.length > 0) {
        suggestions.push(`请避免使用：${keywordCheck.flaggedWords.join('、')}`);
      }

      if (personalInfoCheck.flaggedPatterns.length > 0) {
        suggestions.push('请不要分享个人信息，保护自己的隐私');
      }

      suggestions.push('请使用友好、积极的语言');
    }

    return suggestions;
  }

  /**
   * 记录审核日志
   */
  private async logModeration(
    userId: string,
    content: string,
    contentType: string,
    result: ModerationResult
  ) {
    const action = result.safe ? 'approved' : result.score < 50 ? 'blocked' : 'flagged';

    await query(
      `INSERT INTO moderation_logs
       (id, user_id, content, content_type, moderation_result, action)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
      [userId, content, contentType, JSON.stringify(result), action]
    );
  }
}

export const moderationService = new ModerationService();
