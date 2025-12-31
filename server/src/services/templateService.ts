import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface CreationTemplate {
  id: string;
  type: string;
  title: string;
  description?: string;
  templateData: any;
  thumbnail?: string;
  difficulty: number;
  tags: string[];
  isFeatured: boolean;
  usageCount: number;
}

export class TemplateService {
  /**
   * 获取创作模板列表
   */
  async getTemplates(type?: string, difficulty?: number): Promise<CreationTemplate[]> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (difficulty) {
      whereClause += ` AND difficulty = $${paramIndex++}`;
      params.push(difficulty);
    }

    const result = await query(
      `SELECT * FROM creation_templates ${whereClause} ORDER BY is_featured DESC, usage_count DESC`,
      params
    );

    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      templateData: row.template_data,
      thumbnail: row.thumbnail,
      difficulty: row.difficulty,
      tags: row.tags || [],
      isFeatured: row.is_featured,
      usageCount: row.usage_count,
    }));
  }

  /**
   * 使用模板（增加使用次数）
   */
  async useTemplate(templateId: string) {
    await query(
      'UPDATE creation_templates SET usage_count = usage_count + 1 WHERE id = $1',
      [templateId]
    );
  }

  /**
   * 收藏/取消收藏
   */
  async toggleFavorite(userId: string, itemType: string, itemId: string) {
    const existing = await query(
      'SELECT id FROM user_favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
      [userId, itemType, itemId]
    );

    if (existing.rows.length > 0) {
      await query('DELETE FROM user_favorites WHERE id = $1', [existing.rows[0].id]);
      return { favorited: false, message: '已取消收藏' };
    } else {
      await query(
        'INSERT INTO user_favorites (user_id, item_type, item_id) VALUES ($1, $2, $3)',
        [userId, itemType, itemId]
      );
      return { favorited: true, message: '收藏成功' };
    }
  }

  /**
   * 获取用户收藏列表
   */
  async getUserFavorites(userId: string, itemType?: string) {
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (itemType) {
      whereClause += ' AND item_type = $2';
      params.push(itemType);
    }

    const result = await query(
      `SELECT * FROM user_favorites ${whereClause} ORDER BY created_at DESC`,
      params
    );

    return result.rows;
  }
}

export const templateService = new TemplateService();
