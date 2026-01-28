import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_034_insert_sample_questions: Migration = {
  id: '034',
  name: '034_insert_sample_questions',

  up: async () => {
    console.log('Inserting sample questions...');

    // 三年级数学填空题数据
    const fillBlankQuestions = [
      // 乘法基础(8道)
      ['math', 'grade_3', 'math_grade3_unit2_1', 'fill_blank', '3 × 5 = ?', '15', '3 × 5 = 15。可以理解为3个5相加:5 + 5 + 5 = 15', 1],
      ['math', 'grade_3', 'math_grade3_unit2_1', 'fill_blank', '2 × 7 = ?', '14', '2 × 7 = 14。可以理解为2个7相加:7 + 7 = 14', 1],
      ['math', 'grade_3', 'math_grade3_unit2_1', 'fill_blank', '4 × 6 = ?', '24', '4 × 6 = 24。这是乘法口诀:四六二十四', 1],
      ['math', 'grade_3', 'math_grade3_unit2_1', 'fill_blank', '5 × 8 = ?', '40', '5 × 8 = 40。这是乘法口诀:五八四十', 1],
      ['math', 'grade_3', 'math_grade3_unit2_1', 'fill_blank', '6 × 7 = ?', '42', '6 × 7 = 42。这是乘法口诀:六七四十二', 2],
      ['math', 'grade_3', 'math_grade3_unit2_1', 'fill_blank', '7 × 8 = ?', '56', '7 × 8 = 56。这是乘法口诀:七八五十六', 2],
      ['math', 'grade_3', 'math_grade3_unit2_1', 'fill_blank', '8 × 9 = ?', '72', '8 × 9 = 72。这是乘法口诀:八九七十二', 2],
      ['math', 'grade_3', 'math_grade3_unit2_1', 'fill_blank', '9 × 6 = ?', '54', '9 × 6 = 54。这是乘法口诀:九六五十四', 2],

      // 两位数乘法(6道)
      ['math', 'grade_3', 'math_grade3_unit2_2', 'fill_blank', '12 × 3 = ?', '36', '12 × 3 = 36。可以拆分为:(10 + 2) × 3 = 10×3 + 2×3 = 30 + 6 = 36', 3],
      ['math', 'grade_3', 'math_grade3_unit2_2', 'fill_blank', '15 × 4 = ?', '60', '15 × 4 = 60。可以拆分为:(10 + 5) × 4 = 10×4 + 5×4 = 40 + 20 = 60', 3],
      ['math', 'grade_3', 'math_grade3_unit2_2', 'fill_blank', '13 × 5 = ?', '65', '13 × 5 = 65。可以拆分为:(10 + 3) × 5 = 10×5 + 3×5 = 50 + 15 = 65', 3],
      ['math', 'grade_3', 'math_grade3_unit2_2', 'fill_blank', '14 × 6 = ?', '84', '14 × 6 = 84。可以拆分为:(10 + 4) × 6 = 10×6 + 4×6 = 60 + 24 = 84', 3],
      ['math', 'grade_3', 'math_grade3_unit2_2', 'fill_blank', '25 × 4 = ?', '100', '25 × 4 = 100。这是一个特殊的乘法:25×4 = 100', 4],
      ['math', 'grade_3', 'math_grade3_unit2_2', 'fill_blank', '18 × 5 = ?', '90', '18 × 5 = 90。可以拆分为:(10 + 8) × 5 = 10×5 + 8×5 = 50 + 40 = 90', 4],

      // 除法基础(7道)
      ['math', 'grade_3', 'math_grade3_unit3_1', 'fill_blank', '15 ÷ 3 = ?', '5', '15 ÷ 3 = 5。因为3 × 5 = 15', 1],
      ['math', 'grade_3', 'math_grade3_unit3_1', 'fill_blank', '20 ÷ 4 = ?', '5', '20 ÷ 4 = 5。因为4 × 5 = 20', 1],
      ['math', 'grade_3', 'math_grade3_unit3_1', 'fill_blank', '24 ÷ 6 = ?', '4', '24 ÷ 6 = 4。因为6 × 4 = 24', 1],
      ['math', 'grade_3', 'math_grade3_unit3_1', 'fill_blank', '36 ÷ 9 = ?', '4', '36 ÷ 9 = 4。因为9 × 4 = 36', 2],
      ['math', 'grade_3', 'math_grade3_unit3_1', 'fill_blank', '48 ÷ 8 = ?', '6', '48 ÷ 8 = 6。因为8 × 6 = 48', 2],
      ['math', 'grade_3', 'math_grade3_unit3_1', 'fill_blank', '56 ÷ 7 = ?', '8', '56 ÷ 7 = 8。因为7 × 8 = 56', 2],
      ['math', 'grade_3', 'math_grade3_unit3_1', 'fill_blank', '72 ÷ 9 = ?', '8', '72 ÷ 9 = 8。因为9 × 8 = 72', 2],

      // 加减法混合运算(5道)
      ['math', 'grade_3', 'math_grade3_unit1_1', 'fill_blank', '25 + 17 - 12 = ?', '30', '先算加法:25 + 17 = 42,再算减法:42 - 12 = 30', 2],
      ['math', 'grade_3', 'math_grade3_unit1_1', 'fill_blank', '50 - 18 + 23 = ?', '55', '从左到右计算:50 - 18 = 32,32 + 23 = 55', 2],
      ['math', 'grade_3', 'math_grade3_unit1_1', 'fill_blank', '34 + 26 - 15 = ?', '45', '先算加法:34 + 26 = 60,再算减法:60 - 15 = 45', 2],
      ['math', 'grade_3', 'math_grade3_unit1_2', 'fill_blank', '(25 + 15) - 20 = ?', '20', '先算括号内:25 + 15 = 40,再算减法:40 - 20 = 20', 3],
      ['math', 'grade_3', 'math_grade3_unit1_2', 'fill_blank', '50 - (18 + 12) = ?', '20', '先算括号内:18 + 12 = 30,再算减法:50 - 30 = 20', 3],

      // 长度单位(4道)
      ['math', 'grade_3', 'math_grade3_unit4_1', 'fill_blank', '1米 = ? 厘米', '100', '1米 = 100厘米。米和厘米的换算关系是:1米 = 100厘米', 1],
      ['math', 'grade_3', 'math_grade3_unit4_1', 'fill_blank', '1分米 = ? 厘米', '10', '1分米 = 10厘米。分米和厘米的换算关系是:1分米 = 10厘米', 1],
      ['math', 'grade_3', 'math_grade3_unit4_1', 'fill_blank', '200厘米 = ? 米', '2', '200厘米 = 2米。因为100厘米 = 1米', 2],
      ['math', 'grade_3', 'math_grade3_unit4_1', 'fill_blank', '3米5分米 = ? 分米', '35', '3米 = 30分米,30分米 + 5分米 = 35分米', 3],
    ];

    for (const q of fillBlankQuestions) {
      await query(
        `INSERT INTO questions (subject, grade, knowledge_point_id, question_type, question_text, correct_answer, explanation, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        q
      );
    }

    console.log(`✅ 成功插入 ${fillBlankQuestions.length} 道填空题`);

    // 插入单选题(需要包含选项)
    const singleChoiceQuestions = [
      {
        text: '小明有3盒铅笔,每盒5支,他一共有多少支铅笔?',
        options: [
          { label: 'A', text: '8支' },
          { label: 'B', text: '15支' },
          { label: 'C', text: '12支' },
          { label: 'D', text: '10支' }
        ],
        answer: 'B',
        explanation: '每盒5支,3盒就是3×5=15支',
        difficulty: 2,
        kpId: 'math_grade3_unit2_1'
      },
      {
        text: '学校买了40个足球,平均分给8个班,每个班分到几个?',
        options: [
          { label: 'A', text: '4个' },
          { label: 'B', text: '5个' },
          { label: 'C', text: '6个' },
          { label: 'D', text: '8个' }
        ],
        answer: 'B',
        explanation: '40个平均分给8个班,就是40÷8=5个',
        difficulty: 2,
        kpId: 'math_grade3_unit3_1'
      },
      {
        text: '哪个长度最长?',
        options: [
          { label: 'A', text: '90厘米' },
          { label: 'B', text: '1米' },
          { label: 'C', text: '8分米' },
          { label: 'D', text: '110厘米' }
        ],
        answer: 'D',
        explanation: '换算成同一单位比较:A=90厘米,B=100厘米,C=80厘米,D=110厘米,所以D最长',
        difficulty: 3,
        kpId: 'math_grade3_unit4_1'
      },
      {
        text: '计算:25 × 4 = ?',
        options: [
          { label: 'A', text: '90' },
          { label: 'B', text: '100' },
          { label: 'C', text: '110' },
          { label: 'D', text: '120' }
        ],
        answer: 'B',
        explanation: '25×4=100,这是一个常用的乘法算式',
        difficulty: 2,
        kpId: 'math_grade3_unit2_2'
      },
      {
        text: '下面哪个算式的结果最大?',
        options: [
          { label: 'A', text: '8 × 6' },
          { label: 'B', text: '7 × 7' },
          { label: 'C', text: '9 × 5' },
          { label: 'D', text: '6 × 8' }
        ],
        answer: 'B',
        explanation: 'A=48,B=49,C=45,D=48,所以B最大',
        difficulty: 3,
        kpId: 'math_grade3_unit2_1'
      },
    ];

    for (const q of singleChoiceQuestions) {
      const result = await query(
        `INSERT INTO questions (subject, grade, knowledge_point_id, question_type, question_text, correct_answer, explanation, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        ['math', 'grade_3', q.kpId, 'single_choice', q.text, q.answer, q.explanation, q.difficulty]
      );

      const questionId = result.rows[0].id;

      // 插入选项
      for (const option of q.options) {
        await query(
          `INSERT INTO question_options (question_id, option_label, option_text)
           VALUES ($1, $2, $3)`,
          [questionId, option.label, option.text]
        );
      }
    }

    console.log(`✅ 成功插入 ${singleChoiceQuestions.length} 道单选题`);

    // 插入判断题
    const trueFalseQuestions = [
      ['math', 'grade_3', 'math_grade3_unit2_1', 'true_false', '7 × 8 = 54', 'false', '错误。7 × 8 = 56,不是54', 1],
      ['math', 'grade_3', 'math_grade3_unit4_1', 'true_false', '1米 = 100厘米', 'true', '正确。1米等于100厘米', 1],
      ['math', 'grade_3', 'math_grade3_unit3_1', 'true_false', '48 ÷ 6 = 7', 'false', '错误。48 ÷ 6 = 8,不是7', 1],
      ['math', 'grade_3', 'math_grade3_unit1_1', 'true_false', '25 + 15 - 10 = 30', 'true', '正确。先算25+15=40,再算40-10=30', 2],
      ['math', 'grade_3', 'math_grade3_unit2_1', 'true_false', '9 × 9 = 81', 'true', '正确。九九八十一', 1],
    ];

    for (const q of trueFalseQuestions) {
      await query(
        `INSERT INTO questions (subject, grade, knowledge_point_id, question_type, question_text, correct_answer, explanation, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        q
      );
    }

    console.log(`✅ 成功插入 ${trueFalseQuestions.length} 道判断题`);

    const total = fillBlankQuestions.length + singleChoiceQuestions.length + trueFalseQuestions.length;
    console.log(`✅ 题库总计: ${total} 道题`);
  },

  down: async () => {
    console.log('Deleting sample questions...');

    await query(`DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE grade = 'grade_3')`);
    await query(`DELETE FROM questions WHERE grade = 'grade_3'`);

    console.log('✅ 示例题目数据删除成功');
  }
};
