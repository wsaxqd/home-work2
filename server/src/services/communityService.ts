import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export class CommunityService {
  // ============ 点赞功能 ============

  // 点赞作品
  async likeWork(workId: string, userId: string) {
    // 检查作品是否存在
    const workResult = await query('SELECT id FROM works WHERE id = $1', [workId]);
    if (workResult.rows.length === 0) {
      throw new AppError('作品不存在', 404);
    }

    // 检查是否已点赞
    const existingLike = await query(
      'SELECT id FROM likes WHERE work_id = $1 AND user_id = $2',
      [workId, userId]
    );

    if (existingLike.rows.length > 0) {
      throw new AppError('已点赞该作品', 400);
    }

    // 添加点赞
    await query(
      'INSERT INTO likes (work_id, user_id) VALUES ($1, $2)',
      [workId, userId]
    );

    // 更新作品点赞数
    await query(
      'UPDATE works SET like_count = like_count + 1 WHERE id = $1',
      [workId]
    );

    return { message: '点赞成功' };
  }

  // 取消点赞
  async unlikeWork(workId: string, userId: string) {
    const result = await query(
      'DELETE FROM likes WHERE work_id = $1 AND user_id = $2 RETURNING id',
      [workId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('未点赞该作品', 400);
    }

    // 更新作品点赞数
    await query(
      'UPDATE works SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
      [workId]
    );

    return { message: '取消点赞成功' };
  }

  // ============ 评论功能 ============

  // 发表评论
  async createComment(workId: string, userId: string, content: string, parentId?: string) {
    // 检查作品是否存在
    const workResult = await query('SELECT id FROM works WHERE id = $1', [workId]);
    if (workResult.rows.length === 0) {
      throw new AppError('作品不存在', 404);
    }

    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const parentResult = await query('SELECT id FROM comments WHERE id = $1', [parentId]);
      if (parentResult.rows.length === 0) {
        throw new AppError('父评论不存在', 404);
      }
    }

    const result = await query(
      `INSERT INTO comments (work_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [workId, userId, content, parentId || null]
    );

    // 更新作品评论数
    await query(
      'UPDATE works SET comment_count = comment_count + 1 WHERE id = $1',
      [workId]
    );

    return result.rows[0];
  }

  // 获取评论列表
  async getComments(workId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const countResult = await query(
      'SELECT COUNT(*) FROM comments WHERE work_id = $1 AND parent_id IS NULL',
      [workId]
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取主评论
    const result = await query(
      `SELECT c.*, u.nickname, u.avatar_url as avatar,
        (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as reply_count
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.work_id = $1 AND c.parent_id IS NULL
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [workId, pageSize, offset]
    );

    return {
      list: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取评论回复
  async getCommentReplies(commentId: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const countResult = await query(
      'SELECT COUNT(*) FROM comments WHERE parent_id = $1',
      [commentId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT c.*, u.nickname, u.avatar_url as avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.parent_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [commentId, pageSize, offset]
    );

    return {
      list: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 删除评论
  async deleteComment(commentId: string, userId: string) {
    const result = await query(
      'SELECT work_id, user_id FROM comments WHERE id = $1',
      [commentId]
    );

    if (result.rows.length === 0) {
      throw new AppError('评论不存在', 404);
    }

    if (result.rows[0].user_id !== userId) {
      throw new AppError('无权删除该评论', 403);
    }

    const workId = result.rows[0].work_id;

    // 删除评论及其回复
    const deleteResult = await query(
      'DELETE FROM comments WHERE id = $1 OR parent_id = $1 RETURNING id',
      [commentId]
    );

    // 更新作品评论数
    await query(
      'UPDATE works SET comment_count = GREATEST(comment_count - $1, 0) WHERE id = $2',
      [deleteResult.rows.length, workId]
    );

    return { message: '删除成功' };
  }

  // ============ 心愿墙功能 ============

  // 发布心愿
  async createWish(userId: string, content: string) {
    const result = await query(
      'INSERT INTO wishes (user_id, content) VALUES ($1, $2) RETURNING *',
      [userId, content]
    );

    return result.rows[0];
  }

  // 获取心愿墙
  async getWishes(page: number = 1, pageSize: number = 20, status?: string) {
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause = `WHERE w.status = $${paramIndex++}`;
      params.push(status);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM wishes w ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(pageSize, offset);
    const result = await query(
      `SELECT w.*, u.nickname, u.avatar_url as avatar
       FROM wishes w
       JOIN users u ON w.user_id = u.id
       ${whereClause}
       ORDER BY w.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return {
      list: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 支持心愿（点赞）
  async supportWish(wishId: string, userId: string) {
    // 检查心愿是否存在
    const wishResult = await query('SELECT id FROM wishes WHERE id = $1', [wishId]);
    if (wishResult.rows.length === 0) {
      throw new AppError('心愿不存在', 404);
    }

    // 更新点赞数
    await query(
      'UPDATE wishes SET like_count = like_count + 1 WHERE id = $1',
      [wishId]
    );

    return { message: '支持成功' };
  }

  // 更新心愿状态
  async updateWishStatus(wishId: string, userId: string, status: 'pending' | 'in_progress' | 'completed') {
    const result = await query(
      'SELECT user_id FROM wishes WHERE id = $1',
      [wishId]
    );

    if (result.rows.length === 0) {
      throw new AppError('心愿不存在', 404);
    }

    if (result.rows[0].user_id !== userId) {
      throw new AppError('无权修改该心愿', 403);
    }

    const updateResult = await query(
      `UPDATE wishes SET status = $1,
       completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = $2
       RETURNING *`,
      [status, wishId]
    );

    return updateResult.rows[0];
  }

  // ============ 社区帖子功能 ============

  // 获取帖子列表
  async getPosts(page: number = 1, pageSize: number = 10, userId?: string) {
    const offset = (page - 1) * pageSize;

    const countResult = await query(
      `SELECT COUNT(*) FROM community_posts WHERE status = 'published'`
    );
    const total = parseInt(countResult.rows[0].count);

    // 构建查询，包含用户信息和点赞状态
    let queryText = `
      SELECT
        p.*,
        u.id as user_id,
        u.nickname,
        u.username,
        u.avatar_url as avatar
    `;

    if (userId) {
      queryText += `,
        EXISTS(
          SELECT 1 FROM community_likes
          WHERE post_id = p.id AND user_id = $3
        ) as is_liked
      `;
    }

    queryText += `
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const params = userId ? [pageSize, offset, userId] : [pageSize, offset];
    const result = await query(queryText, params);

    return {
      data: result.rows,
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取单个帖子
  async getPost(postId: string, userId?: string) {
    let queryText = `
      SELECT
        p.*,
        u.id as user_id,
        u.nickname,
        u.username,
        u.avatar_url as avatar
    `;

    if (userId) {
      queryText += `,
        EXISTS(
          SELECT 1 FROM community_likes
          WHERE post_id = p.id AND user_id = $2
        ) as is_liked
      `;
    }

    queryText += `
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.status = 'published'
    `;

    const params = userId ? [postId, userId] : [postId];
    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      throw new AppError('帖子不存在', 404);
    }

    // 更新浏览数
    await query(
      'UPDATE community_posts SET view_count = view_count + 1 WHERE id = $1',
      [postId]
    );

    return result.rows[0];
  }

  // 发布帖子
  async createPost(userId: string, content: string, images?: string[], title?: string) {
    const result = await query(
      `INSERT INTO community_posts (user_id, title, content, images, status)
       VALUES ($1, $2, $3, $4, 'published')
       RETURNING *`,
      [userId, title || '分享', content, images || []]
    );

    return result.rows[0];
  }

  // 删除帖子
  async deletePost(postId: string, userId: string) {
    const result = await query(
      'SELECT user_id FROM community_posts WHERE id = $1',
      [postId]
    );

    if (result.rows.length === 0) {
      throw new AppError('帖子不存在', 404);
    }

    if (result.rows[0].user_id !== userId) {
      throw new AppError('无权删除该帖子', 403);
    }

    await query(
      'UPDATE community_posts SET status = $1 WHERE id = $2',
      ['deleted', postId]
    );

    return { message: '删除成功' };
  }

  // 点赞帖子
  async likePost(postId: string, userId: string) {
    // 检查帖子是否存在
    const postResult = await query(
      'SELECT id FROM community_posts WHERE id = $1 AND status = $2',
      [postId, 'published']
    );
    if (postResult.rows.length === 0) {
      throw new AppError('帖子不存在', 404);
    }

    // 检查是否已点赞
    const existingLike = await query(
      'SELECT id FROM community_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (existingLike.rows.length > 0) {
      throw new AppError('已点赞该帖子', 400);
    }

    // 添加点赞（触发器会自动更新点赞数）
    await query(
      'INSERT INTO community_likes (post_id, user_id) VALUES ($1, $2)',
      [postId, userId]
    );

    return { message: '点赞成功' };
  }

  // 取消点赞帖子
  async unlikePost(postId: string, userId: string) {
    const result = await query(
      'DELETE FROM community_likes WHERE post_id = $1 AND user_id = $2 RETURNING id',
      [postId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('未点赞该帖子', 400);
    }

    return { message: '取消点赞成功' };
  }

  // ============ 话题功能 ============

  // 获取话题列表
  async getTopics() {
    const result = await query(
      `SELECT * FROM community_topics
       WHERE is_active = true
       ORDER BY is_featured DESC, sort_order ASC, post_count DESC`
    );

    return result.rows;
  }

  // 获取话题详情
  async getTopic(topicId: string) {
    const result = await query(
      'SELECT * FROM community_topics WHERE id = $1 AND is_active = true',
      [topicId]
    );

    if (result.rows.length === 0) {
      throw new AppError('话题不存在', 404);
    }

    return result.rows[0];
  }

  // 获取话题下的帖子
  async getTopicPosts(topicId: string, page: number = 1, pageSize: number = 10, userId?: string) {
    const offset = (page - 1) * pageSize;

    // 检查话题是否存在
    const topicResult = await query(
      'SELECT id FROM community_topics WHERE id = $1',
      [topicId]
    );
    if (topicResult.rows.length === 0) {
      throw new AppError('话题不存在', 404);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM post_topics pt
       JOIN community_posts p ON pt.post_id = p.id
       WHERE pt.topic_id = $1 AND p.status = 'published'`,
      [topicId]
    );
    const total = parseInt(countResult.rows[0].count);

    let queryText = `
      SELECT
        p.*,
        u.id as user_id,
        u.nickname,
        u.username,
        u.avatar_url as avatar
    `;

    if (userId) {
      queryText += `,
        EXISTS(
          SELECT 1 FROM community_likes
          WHERE post_id = p.id AND user_id = $4
        ) as is_liked
      `;
    }

    queryText += `
      FROM post_topics pt
      JOIN community_posts p ON pt.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE pt.topic_id = $1 AND p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const params = userId ? [topicId, pageSize, offset, userId] : [topicId, pageSize, offset];
    const result = await query(queryText, params);

    return {
      data: result.rows,
      total,
      page,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const communityService = new CommunityService();
