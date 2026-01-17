import { query } from '../config/database';

// 对话消息接口
interface ConversationMessage {
  id: string;
  userId?: string;
  companionId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

// 格式化对话消息
function formatMessage(row: any): ConversationMessage {
  return {
    id: row.id,
    userId: row.user_id,
    companionId: row.companion_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

export class ConversationService {
  /**
   * 保存对话消息
   */
  async saveMessage(
    userId: string | undefined,
    companionId: string | undefined,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<ConversationMessage> {
    const sql = `
      INSERT INTO conversation_history (user_id, companion_id, role, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await query(sql, [userId || null, companionId || null, role, content]);
    return formatMessage(result.rows[0]);
  }

  /**
   * 获取对话历史
   */
  async getHistory(userId: string, companionId?: string, limit: number = 50): Promise<ConversationMessage[]> {
    let sql = `
      SELECT * FROM conversation_history
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (companionId) {
      sql += ` AND companion_id = $2`;
      params.push(companionId);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows.map(formatMessage).reverse();
  }
}

export const conversationService = new ConversationService();
