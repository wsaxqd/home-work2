import { query } from '../config/database';

export interface PKQuestion {
  id: string;
  subject: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

/**
 * 从题库中获取PK题目
 * @param subject 科目 (math, chinese, english, science)
 * @param difficulty 难度 (easy, medium, hard)
 * @param count 题目数量
 */
export async function getPKQuestions(
  subject: string,
  difficulty: string,
  count: number
): Promise<PKQuestion[]> {
  try {
    // 将难度映射到数字等级
    const difficultyMap: { [key: string]: number } = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    };
    const difficultyLevel = difficultyMap[difficulty] || 2;

    // 从questions表中随机获取题目
    const result = await query(
      `SELECT
        q.id,
        q.subject,
        q.difficulty,
        q.question_text as question,
        q.correct_answer,
        q.explanation,
        COALESCE(
          json_agg(
            json_build_object(
              'label', qo.option_label,
              'text', qo.option_text
            ) ORDER BY qo.option_label
          ) FILTER (WHERE qo.id IS NOT NULL),
          '[]'::json
        ) as options
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.subject = $1
        AND q.difficulty = $2
        AND q.question_type = 'single_choice'
      GROUP BY q.id, q.subject, q.difficulty, q.question_text, q.correct_answer, q.explanation
      ORDER BY RANDOM()
      LIMIT $3`,
      [subject, difficultyLevel, count]
    );

    // 如果题库中没有足够的题目，使用模拟数据补充
    if (result.rows.length < count) {
      const mockQuestions = generateMockQuestions(subject, difficulty, count - result.rows.length);
      return [...result.rows.map(formatQuestion), ...mockQuestions];
    }

    return result.rows.map(formatQuestion);
  } catch (error) {
    console.error('获取PK题目失败:', error);
    // 如果数据库查询失败，返回模拟数据
    return generateMockQuestions(subject, difficulty, count);
  }
}

/**
 * 格式化题目数据
 */
function formatQuestion(row: any): PKQuestion {
  const options = Array.isArray(row.options)
    ? row.options.map((opt: any) => opt.text)
    : [];

  return {
    id: row.id,
    subject: row.subject,
    difficulty: getDifficultyString(row.difficulty),
    question: row.question,
    options: options,
    correctAnswer: row.correct_answer,
    explanation: row.explanation
  };
}

/**
 * 将数字难度转换为字符串
 */
function getDifficultyString(level: number): string {
  const map: { [key: number]: string } = {
    1: 'easy',
    2: 'medium',
    3: 'hard'
  };
  return map[level] || 'medium';
}

/**
 * 生成模拟题目（当题库中没有足够题目时使用）
 */
function generateMockQuestions(
  subject: string,
  difficulty: string,
  count: number
): PKQuestion[] {
  const questions: PKQuestion[] = [];

  for (let i = 0; i < count; i++) {
    questions.push(generateMockQuestion(i + 1, subject, difficulty));
  }

  return questions;
}

/**
 * 生成单个模拟题目
 */
function generateMockQuestion(
  questionNumber: number,
  subject: string,
  difficulty: string
): PKQuestion {
  const questionBank: { [key: string]: any[] } = {
    math: [
      {
        question: '计算：25 × 4 = ?',
        options: ['80', '90', '100', '110'],
        correctAnswer: '100',
        explanation: '25 × 4 = 100'
      },
      {
        question: '一个长方形的长是8厘米，宽是5厘米，周长是多少厘米？',
        options: ['13', '26', '40', '52'],
        correctAnswer: '26',
        explanation: '周长 = (长 + 宽) × 2 = (8 + 5) × 2 = 26厘米'
      },
      {
        question: '小明有36颗糖，平均分给6个小朋友，每人分到几颗？',
        options: ['4', '5', '6', '7'],
        correctAnswer: '6',
        explanation: '36 ÷ 6 = 6颗'
      },
      {
        question: '计算：15 + 28 = ?',
        options: ['41', '42', '43', '44'],
        correctAnswer: '43',
        explanation: '15 + 28 = 43'
      },
      {
        question: '一个正方形的边长是7厘米，它的周长是多少厘米？',
        options: ['14', '21', '28', '49'],
        correctAnswer: '28',
        explanation: '正方形周长 = 边长 × 4 = 7 × 4 = 28厘米'
      }
    ],
    chinese: [
      {
        question: '下列词语中，没有错别字的一项是：',
        options: ['再接再励', '川流不息', '迫不急待', '走头无路'],
        correctAnswer: '川流不息',
        explanation: '正确答案是"川流不息"。其他选项的正确写法是：再接再厉、迫不及待、走投无路'
      },
      {
        question: '"春眠不觉晓"的下一句是：',
        options: ['处处闻啼鸟', '夜来风雨声', '花落知多少', '春来江水绿如蓝'],
        correctAnswer: '处处闻啼鸟',
        explanation: '这是孟浩然《春晓》中的诗句'
      },
      {
        question: '下列成语中，与"画蛇添足"意思最接近的是：',
        options: ['锦上添花', '多此一举', '雪中送炭', '画龙点睛'],
        correctAnswer: '多此一举',
        explanation: '"画蛇添足"和"多此一举"都表示做了不必要的事情'
      }
    ],
    english: [
      {
        question: 'What is the past tense of "go"?',
        options: ['goed', 'went', 'gone', 'going'],
        correctAnswer: 'went',
        explanation: 'The past tense of "go" is "went"'
      },
      {
        question: 'Choose the correct word: I ___ a student.',
        options: ['am', 'is', 'are', 'be'],
        correctAnswer: 'am',
        explanation: 'Use "am" with "I"'
      },
      {
        question: 'What does "apple" mean in Chinese?',
        options: ['香蕉', '苹果', '橙子', '梨'],
        correctAnswer: '苹果',
        explanation: 'Apple means 苹果 in Chinese'
      }
    ],
    science: [
      {
        question: '地球自转一周需要多长时间？',
        options: ['12小时', '24小时', '365天', '30天'],
        correctAnswer: '24小时',
        explanation: '地球自转一周需要约24小时，这就是一天的时间'
      },
      {
        question: '水的化学式是什么？',
        options: ['H2O', 'CO2', 'O2', 'H2'],
        correctAnswer: 'H2O',
        explanation: '水的化学式是H2O，由两个氢原子和一个氧原子组成'
      },
      {
        question: '植物进行光合作用需要什么？',
        options: ['阳光、水和二氧化碳', '阳光和氧气', '水和氧气', '二氧化碳和氧气'],
        correctAnswer: '阳光、水和二氧化碳',
        explanation: '植物光合作用需要阳光、水和二氧化碳，产生氧气和葡萄糖'
      }
    ]
  };

  const subjectQuestions = questionBank[subject] || questionBank.math;
  const selectedQuestion = subjectQuestions[questionNumber % subjectQuestions.length];

  return {
    id: `mock_${subject}_${questionNumber}`,
    subject,
    difficulty,
    ...selectedQuestion
  };
}
