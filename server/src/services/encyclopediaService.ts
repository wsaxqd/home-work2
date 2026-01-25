import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';
import encyclopediaData from '../data/encyclopedia_knowledge.json';

export interface EncyclopediaQuestion {
  id: number;
  category: string;
  question: string;
  answer: string;
  difficulty: string;
  tags: string[];
  relatedQuestions: number[];
  viewCount?: number;
  likeCount?: number;
  liked?: boolean;
}

export interface EncyclopediaCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  questionCount?: number;
}

export class EncyclopediaService {
  /**
   * 初始化百科数据到数据库
   */
  async initializeData() {
    try {
      // 导入问题数据
      for (const question of encyclopediaData.questions) {
        await query(
          `INSERT INTO encyclopedia_questions
           (id, category_id, question, answer, difficulty, tags, related_question_ids)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
           question = EXCLUDED.question,
           answer = EXCLUDED.answer,
           difficulty = EXCLUDED.difficulty,
           tags = EXCLUDED.tags,
           related_question_ids = EXCLUDED.related_question_ids`,
          [
            question.id,
            question.category,
            question.question,
            question.answer,
            question.difficulty,
            question.tags,
            question.relatedQuestions
          ]
        );
      }

      return { success: true, message: '百科数据初始化成功' };
    } catch (error) {
      throw new AppError('百科数据初始化失败', 500);
    }
  }

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<EncyclopediaCategory[]> {
    const result = await query(
      `SELECT
        c.id, c.name, c.icon, c.description,
        COUNT(q.id) as question_count
       FROM encyclopedia_categories c
       LEFT JOIN encyclopedia_questions q ON c.id = q.category_id
       GROUP BY c.id, c.name, c.icon, c.description
       ORDER BY c.sort_order`
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      description: row.description,
      questionCount: parseInt(row.question_count || 0)
    }));
  }

  /**
   * 获取问题列表
   */
  async getQuestions(
    userId?: string,
    categoryId?: string,
    difficulty?: string,
    searchTerm?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ questions: EncyclopediaQuestion[]; total: number }> {
    let queryText = `
      SELECT
        q.*,
        ${userId ? `EXISTS(SELECT 1 FROM user_favorite_questions WHERE user_id = $1 AND question_id = q.id) as liked` : 'false as liked'}
      FROM encyclopedia_questions q
      WHERE 1=1
    `;

    const params: any[] = userId ? [userId] : [];
    let paramIndex = params.length + 1;

    if (categoryId) {
      queryText += ` AND q.category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (difficulty) {
      queryText += ` AND q.difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (searchTerm) {
      queryText += ` AND (q.question ILIKE $${paramIndex} OR q.answer ILIKE $${paramIndex})`;
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // 获取总数
    const countResult = await query(queryText.replace('SELECT q.*,', 'SELECT COUNT(*) as total,'), params);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // 获取分页数据
    queryText += ` ORDER BY q.id LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    return {
      questions: result.rows.map(row => ({
        id: row.id,
        category: row.category_id,
        question: row.question,
        answer: row.answer,
        difficulty: row.difficulty,
        tags: row.tags || [],
        relatedQuestions: row.related_question_ids || [],
        viewCount: row.view_count,
        likeCount: row.like_count,
        liked: row.liked
      })),
      total
    };
  }

  /**
   * 获取单个问题详情
   */
  async getQuestionById(questionId: number, userId?: string): Promise<EncyclopediaQuestion> {
    const result = await query(
      `SELECT
        q.*,
        ${userId ? `EXISTS(SELECT 1 FROM user_favorite_questions WHERE user_id = $2 AND question_id = q.id) as liked` : 'false as liked'}
       FROM encyclopedia_questions q
       WHERE q.id = $1`,
      userId ? [questionId, userId] : [questionId]
    );

    if (result.rows.length === 0) {
      throw new AppError('问题不存在', 404);
    }

    // 增加浏览次数
    await query(
      'UPDATE encyclopedia_questions SET view_count = view_count + 1 WHERE id = $1',
      [questionId]
    );

    // 记录用户浏览
    if (userId) {
      await query(
        `INSERT INTO user_question_views (user_id, question_id)
         VALUES ($1, $2)`,
        [userId, questionId]
      );
    }

    const row = result.rows[0];
    return {
      id: row.id,
      category: row.category_id,
      question: row.question,
      answer: row.answer,
      difficulty: row.difficulty,
      tags: row.tags || [],
      relatedQuestions: row.related_question_ids || [],
      viewCount: row.view_count + 1,
      likeCount: row.like_count,
      liked: row.liked
    };
  }

  /**
   * 收藏/取消收藏问题
   */
  async toggleFavorite(userId: string, questionId: number): Promise<{ liked: boolean }> {
    const existingResult = await query(
      'SELECT id FROM user_favorite_questions WHERE user_id = $1 AND question_id = $2',
      [userId, questionId]
    );

    if (existingResult.rows.length > 0) {
      // 取消收藏
      await query(
        'DELETE FROM user_favorite_questions WHERE user_id = $1 AND question_id = $2',
        [userId, questionId]
      );
      await query(
        'UPDATE encyclopedia_questions SET like_count = like_count - 1 WHERE id = $1',
        [questionId]
      );
      return { liked: false };
    } else {
      // 添加收藏
      await query(
        'INSERT INTO user_favorite_questions (user_id, question_id) VALUES ($1, $2)',
        [userId, questionId]
      );
      await query(
        'UPDATE encyclopedia_questions SET like_count = like_count + 1 WHERE id = $1',
        [questionId]
      );
      return { liked: true };
    }
  }

  /**
   * 获取用户收藏的问题
   */
  async getUserFavorites(userId: string): Promise<EncyclopediaQuestion[]> {
    const result = await query(
      `SELECT q.*, true as liked
       FROM encyclopedia_questions q
       INNER JOIN user_favorite_questions ufq ON q.id = ufq.question_id
       WHERE ufq.user_id = $1
       ORDER BY ufq.created_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      category: row.category_id,
      question: row.question,
      answer: row.answer,
      difficulty: row.difficulty,
      tags: row.tags || [],
      relatedQuestions: row.related_question_ids || [],
      viewCount: row.view_count,
      likeCount: row.like_count,
      liked: true
    }));
  }

  /**
   * 智能搜索 - 结合AI回答
   */
  async intelligentSearch(userId: string, question: string): Promise<{
    matchedQuestions: EncyclopediaQuestion[];
    aiAnswer?: string;
  }> {
    // 先在知识库中搜索
    const { questions } = await this.getQuestions(userId, undefined, undefined, question, 5);

    // 如果找到相关问题，返回
    if (questions.length > 0) {
      return { matchedQuestions: questions };
    }

    // 如果没找到，可以调用AI生成答案（后续实现）
    return {
      matchedQuestions: [],
      aiAnswer: '让我来帮你解答这个问题...'
    };
  }

  /**
   * 获取经典列表
   */
  async getClassics(): Promise<any[]> {
    // 返回四大名著等经典数据
    const classics = [
      {
        id: 'journey-to-the-west',
        title: '西游记',
        author: '吴承恩',
        period: '明代',
        cover: '/images/classics/journey.jpg',
        color: '#FF6B6B',
        bgColor: '#FFE5E5',
        intro: '讲述唐僧师徒四人西天取经的故事',
        chapters: []
      },
      {
        id: 'dream-of-red-mansions',
        title: '红楼梦',
        author: '曹雪芹',
        period: '清代',
        cover: '/images/classics/dream.jpg',
        color: '#E91E63',
        bgColor: '#FCE4EC',
        intro: '描写贾宝玉、林黛玉等人的爱情悲剧',
        chapters: []
      }
    ];
    return classics;
  }

  /**
   * 获取单个经典详情
   */
  async getClassic(classicId: string): Promise<any> {
    const classics = await this.getClassics();
    return classics.find(c => c.id === classicId);
  }

  /**
   * 记录阅读进度
   */
  async recordReading(userId: string, classicId: string, chapterId: number): Promise<void> {
    const sql = `
      INSERT INTO reading_progress (user_id, classic_id, chapter_id, last_read_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, classic_id)
      DO UPDATE SET
        chapter_id = EXCLUDED.chapter_id,
        last_read_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `;
    await query(sql, [userId, classicId, chapterId]);
  }

  /**
   * 获取阅读进度
   */
  async getReadingProgress(userId: string): Promise<any[]> {
    const sql = `
      SELECT classic_id, chapter_id, last_read_at
      FROM reading_progress
      WHERE user_id = $1
      ORDER BY last_read_at DESC
    `;
    const result = await query(sql, [userId]);
    return result.rows.map(row => ({
      classicId: row.classic_id,
      chapterId: row.chapter_id,
      lastReadAt: row.last_read_at
    }));
  }

  /**
   * 获取推荐经典
   */
  async getRecommended(): Promise<any[]> {
    // 获取所有经典作品
    const allClassics = await this.getClassics();
    
    // 简单的推荐逻辑：返回所有经典作品
    // 可以根据阅读进度、用户偏好等实现更复杂的推荐逻辑
    return allClassics;
  }
}

export const encyclopediaService = new EncyclopediaService();
