import { query } from '../config/database';

export interface Question {
  id: string;
  subject: string;
  grade: string;
  knowledge_point_id: string;
  question_type: 'single_choice' | 'multiple_choice' | 'fill_blank' | 'true_false' | 'subjective';
  question_text: string;
  question_image?: string;
  correct_answer: string;
  explanation: string;
  difficulty: number;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_label: string;
  option_text: string;
  option_image?: string;
}

export interface QuestionWithOptions extends Question {
  options?: QuestionOption[];
}

/**
 * 根据知识点获取题目列表
 */
export async function getQuestionsByKnowledgePoint(
  knowledgePointId: string,
  options?: {
    difficulty?: number;
    questionType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<QuestionWithOptions[]> {
  let sql = `
    SELECT * FROM questions
    WHERE knowledge_point_id = $1
  `;
  const params: any[] = [knowledgePointId];
  let paramIndex = 2;

  if (options?.difficulty) {
    sql += ` AND difficulty = $${paramIndex}`;
    params.push(options.difficulty);
    paramIndex++;
  }

  if (options?.questionType) {
    sql += ` AND question_type = $${paramIndex}`;
    params.push(options.questionType);
    paramIndex++;
  }

  sql += ` ORDER BY difficulty ASC, created_at DESC`;

  if (options?.limit) {
    sql += ` LIMIT $${paramIndex}`;
    params.push(options.limit);
    paramIndex++;
  }

  if (options?.offset) {
    sql += ` OFFSET $${paramIndex}`;
    params.push(options.offset);
  }

  const result = await query(sql, params);
  const questions: QuestionWithOptions[] = result.rows;

  // 获取选择题的选项
  for (const question of questions) {
    if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
      const optionsResult = await query(
        'SELECT * FROM question_options WHERE question_id = $1 ORDER BY option_label',
        [question.id]
      );
      question.options = optionsResult.rows;
    }
  }

  return questions;
}

/**
 * 根据多个条件获取题目
 */
export async function getQuestions(params: {
  subject?: string;
  grade?: string;
  knowledgePointIds?: string[];
  difficulty?: number;
  questionType?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}): Promise<QuestionWithOptions[]> {
  let sql = 'SELECT * FROM questions WHERE 1=1';
  const sqlParams: any[] = [];
  let paramIndex = 1;

  if (params.subject) {
    sql += ` AND subject = $${paramIndex}`;
    sqlParams.push(params.subject);
    paramIndex++;
  }

  if (params.grade) {
    sql += ` AND grade = $${paramIndex}`;
    sqlParams.push(params.grade);
    paramIndex++;
  }

  if (params.knowledgePointIds && params.knowledgePointIds.length > 0) {
    sql += ` AND knowledge_point_id = ANY($${paramIndex})`;
    sqlParams.push(params.knowledgePointIds);
    paramIndex++;
  }

  if (params.difficulty) {
    sql += ` AND difficulty = $${paramIndex}`;
    sqlParams.push(params.difficulty);
    paramIndex++;
  }

  if (params.questionType) {
    sql += ` AND question_type = $${paramIndex}`;
    sqlParams.push(params.questionType);
    paramIndex++;
  }

  if (params.tags && params.tags.length > 0) {
    sql += ` AND tags && $${paramIndex}`;
    sqlParams.push(params.tags);
    paramIndex++;
  }

  sql += ' ORDER BY difficulty ASC, created_at DESC';

  if (params.limit) {
    sql += ` LIMIT $${paramIndex}`;
    sqlParams.push(params.limit);
    paramIndex++;
  }

  if (params.offset) {
    sql += ` OFFSET $${paramIndex}`;
    sqlParams.push(params.offset);
  }

  const result = await query(sql, sqlParams);
  const questions: QuestionWithOptions[] = result.rows;

  // 获取选择题的选项
  for (const question of questions) {
    if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
      const optionsResult = await query(
        'SELECT * FROM question_options WHERE question_id = $1 ORDER BY option_label',
        [question.id]
      );
      question.options = optionsResult.rows;
    }
  }

  return questions;
}

/**
 * 根据用户学习情况推荐题目
 */
export async function getRecommendedQuestions(
  userId: string,
  knowledgePointId: string,
  count: number = 5
): Promise<QuestionWithOptions[]> {
  // 获取用户在该知识点的学习情况
  const behaviorResult = await query(
    `SELECT mastery_level, accuracy_rate, average_difficulty
     FROM learning_behaviors
     WHERE user_id = $1 AND knowledge_point_id = $2
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId, knowledgePointId]
  );

  let recommendedDifficulty = 1;

  if (behaviorResult.rows.length > 0) {
    const behavior = behaviorResult.rows[0];
    const masteryLevel = behavior.mastery_level || 0;
    const accuracyRate = behavior.accuracy_rate || 0;

    // 根据掌握程度推荐难度
    if (masteryLevel >= 80 && accuracyRate >= 0.8) {
      recommendedDifficulty = 4; // 推荐较难题目
    } else if (masteryLevel >= 60 && accuracyRate >= 0.7) {
      recommendedDifficulty = 3; // 推荐中等题目
    } else if (masteryLevel >= 40) {
      recommendedDifficulty = 2; // 推荐简单偏中等题目
    } else {
      recommendedDifficulty = 1; // 推荐简单题目
    }
  }

  // 获取用户已经做过的题目ID
  const attemptedResult = await query(
    `SELECT DISTINCT question_id
     FROM question_attempts
     WHERE user_id = $1 AND knowledge_point_id = $2`,
    [userId, knowledgePointId]
  );
  const attemptedIds = attemptedResult.rows.map((row: any) => row.question_id);

  // 推荐题目:主要是推荐难度,混合一些其他难度
  const questions: QuestionWithOptions[] = [];

  // 60% 推荐难度的题目
  const mainCount = Math.ceil(count * 0.6);
  let mainQuestions = await getQuestionsByKnowledgePoint(knowledgePointId, {
    difficulty: recommendedDifficulty,
    limit: mainCount * 2 // 多获取一些,以便过滤
  });

  // 过滤已做过的题目
  mainQuestions = mainQuestions.filter(q => !attemptedIds.includes(q.id));
  questions.push(...mainQuestions.slice(0, mainCount));

  // 40% 其他难度的题目
  const remainCount = count - questions.length;
  if (remainCount > 0) {
    const otherDifficulty = recommendedDifficulty > 1 ? recommendedDifficulty - 1 : recommendedDifficulty + 1;
    let otherQuestions = await getQuestionsByKnowledgePoint(knowledgePointId, {
      difficulty: otherDifficulty,
      limit: remainCount * 2
    });

    otherQuestions = otherQuestions.filter(q => !attemptedIds.includes(q.id));
    questions.push(...otherQuestions.slice(0, remainCount));
  }

  // 如果还不够,补充任意难度的题目
  if (questions.length < count) {
    const remainCount = count - questions.length;
    const existingIds = questions.map(q => q.id);
    let moreQuestions = await getQuestionsByKnowledgePoint(knowledgePointId, {
      limit: remainCount * 2
    });

    moreQuestions = moreQuestions.filter(q => !attemptedIds.includes(q.id) && !existingIds.includes(q.id));
    questions.push(...moreQuestions.slice(0, remainCount));
  }

  return questions;
}

/**
 * 获取题目详情
 */
export async function getQuestionById(questionId: string): Promise<QuestionWithOptions | null> {
  const result = await query('SELECT * FROM questions WHERE id = $1', [questionId]);

  if (result.rows.length === 0) {
    return null;
  }

  const question: QuestionWithOptions = result.rows[0];

  // 如果是选择题,获取选项
  if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
    const optionsResult = await query(
      'SELECT * FROM question_options WHERE question_id = $1 ORDER BY option_label',
      [questionId]
    );
    question.options = optionsResult.rows;
  }

  return question;
}

/**
 * 统计知识点下的题目数量
 */
export async function countQuestionsByKnowledgePoint(
  knowledgePointId: string,
  difficulty?: number
): Promise<number> {
  let sql = 'SELECT COUNT(*) as count FROM questions WHERE knowledge_point_id = $1';
  const params: any[] = [knowledgePointId];

  if (difficulty) {
    sql += ' AND difficulty = $2';
    params.push(difficulty);
  }

  const result = await query(sql, params);
  return parseInt(result.rows[0].count);
}

export const learningQuestionService = {
  getQuestionsByKnowledgePoint,
  getQuestions,
  getRecommendedQuestions,
  getQuestionById,
  countQuestionsByKnowledgePoint
};
