import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export type GameQuestionType = 'image_recognition' | 'emotion_recognition' | 'logic' | 'memory';

export interface GameQuestion {
  id: string;
  gameType: GameQuestionType;
  questionData: {
    imageUrl?: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  };
  difficulty: number;
  tags: string[];
}

export class QuestionService {
  /**
   * 获取游戏题目
   * @param gameType 游戏类型
   * @param difficulty 难度等级（1-5）
   * @param limit 题目数量
   */
  async getQuestions(
    gameType: GameQuestionType,
    difficulty?: number,
    limit: number = 10
  ): Promise<GameQuestion[]> {
    let whereClause = 'WHERE game_type = $1 AND is_active = true';
    const params: any[] = [gameType];
    let paramIndex = 2;

    if (difficulty) {
      whereClause += ` AND difficulty = $${paramIndex++}`;
      params.push(difficulty);
    }

    params.push(limit);

    const result = await query(
      `SELECT id, game_type, question_data, difficulty, tags
       FROM game_questions
       ${whereClause}
       ORDER BY RANDOM()
       LIMIT $${paramIndex}`,
      params
    );

    return result.rows.map(row => ({
      id: row.id,
      gameType: row.game_type,
      questionData: row.question_data,
      difficulty: row.difficulty,
      tags: row.tags || [],
    }));
  }

  /**
   * 验证答案
   * @param questionId 题目ID
   * @param answer 用户答案
   */
  async verifyAnswer(questionId: string, answer: number): Promise<{
    correct: boolean;
    correctAnswer: number;
    explanation?: string;
  }> {
    const result = await query(
      'SELECT question_data FROM game_questions WHERE id = $1',
      [questionId]
    );

    if (result.rows.length === 0) {
      throw new AppError('题目不存在', 404);
    }

    const questionData = result.rows[0].question_data;
    const correct = questionData.correctAnswer === answer;

    return {
      correct,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
    };
  }

  /**
   * 添加题目（管理功能）
   * @param gameType 游戏类型
   * @param questionData 题目数据
   * @param difficulty 难度
   * @param tags 标签
   */
  async addQuestion(
    gameType: GameQuestionType,
    questionData: any,
    difficulty: number = 1,
    tags: string[] = []
  ) {
    const result = await query(
      `INSERT INTO game_questions (game_type, question_data, difficulty, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [gameType, JSON.stringify(questionData), difficulty, tags]
    );

    return result.rows[0];
  }

  /**
   * 获取题目统计
   * @param gameType 游戏类型
   */
  async getQuestionStats(gameType?: GameQuestionType) {
    let whereClause = 'WHERE is_active = true';
    const params: any[] = [];

    if (gameType) {
      whereClause += ' AND game_type = $1';
      params.push(gameType);
    }

    const result = await query(
      `SELECT
        game_type,
        difficulty,
        COUNT(*) as count
       FROM game_questions
       ${whereClause}
       GROUP BY game_type, difficulty
       ORDER BY game_type, difficulty`,
      params
    );

    return result.rows;
  }
}

export const questionService = new QuestionService();
