import { Migration } from './migrationRunner';
import { query } from '../config/database';

/**
 * 插入示例知识点数据
 * 包含: 小学三年级数学知识图谱 (50个知识点)
 */

export const migration_032_insert_knowledge_points: Migration = {
  id: '032',
  name: '032_insert_knowledge_points',

  up: async () => {
    console.log('Inserting sample knowledge points...');

    // 小学三年级数学知识点
    const knowledgePoints = [
      // ========== 第一单元: 万以内的加法和减法 ==========
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_addition_basic',
        knowledge_point_name: '两位数加法',
        description: '学习两位数的加法运算,不进位和进位',
        difficulty_level: 1,
        parent_knowledge_point_id: null,
        related_knowledge_points: JSON.stringify(['math_g3_addition_three_digit']),
        resources: JSON.stringify({
          videos: ['两位数加法基础', '进位加法技巧'],
          articles: ['加法口诀表'],
          games: ['加法大冒险-第1关']
        }),
        tags: JSON.stringify(['基础', '必学', '一年级复习'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_addition_three_digit',
        knowledge_point_name: '三位数加法',
        description: '学习三位数的加法运算,包括连续进位',
        difficulty_level: 2,
        parent_knowledge_point_id: 'math_g3_addition_basic',
        related_knowledge_points: JSON.stringify(['math_g3_subtraction_three_digit']),
        resources: JSON.stringify({
          videos: ['三位数加法详解', '连续进位技巧'],
          articles: ['竖式加法步骤'],
          games: ['加法大冒险-第2关']
        }),
        tags: JSON.stringify(['基础', '重点'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_subtraction_basic',
        knowledge_point_name: '两位数减法',
        description: '学习两位数的减法运算,不退位和退位',
        difficulty_level: 1,
        parent_knowledge_point_id: null,
        related_knowledge_points: JSON.stringify(['math_g3_subtraction_three_digit']),
        resources: JSON.stringify({
          videos: ['两位数减法基础', '退位减法技巧'],
          games: ['减法闯关']
        }),
        tags: JSON.stringify(['基础', '必学'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_subtraction_three_digit',
        knowledge_point_name: '三位数减法',
        description: '学习三位数的减法运算,包括连续退位',
        difficulty_level: 2,
        parent_knowledge_point_id: 'math_g3_subtraction_basic',
        related_knowledge_points: JSON.stringify(['math_g3_addition_three_digit']),
        resources: JSON.stringify({
          videos: ['三位数减法详解', '连续退位方法'],
          articles: ['竖式减法步骤'],
          games: ['减法大师']
        }),
        tags: JSON.stringify(['基础', '重点'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_addition_subtraction_mixed',
        knowledge_point_name: '加减混合运算',
        description: '学习加法和减法的混合运算',
        difficulty_level: 3,
        parent_knowledge_point_id: 'math_g3_subtraction_three_digit',
        related_knowledge_points: JSON.stringify(['math_g3_calculation_check']),
        resources: JSON.stringify({
          videos: ['混合运算规则', '运算顺序'],
          articles: ['混合运算技巧'],
          games: ['计算王国']
        }),
        tags: JSON.stringify(['重点', '综合'])
      },

      // ========== 第二单元: 乘法 ==========
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_multiplication_2_5',
        knowledge_point_name: '乘法口诀(2-5)',
        description: '学习2-5的乘法口诀表',
        difficulty_level: 2,
        parent_knowledge_point_id: 'math_g3_addition_three_digit',
        related_knowledge_points: JSON.stringify(['math_g3_multiplication_6_9']),
        resources: JSON.stringify({
          videos: ['乘法口诀快速记忆', '2-5口诀儿歌'],
          articles: ['乘法口诀表', '巧记口诀'],
          games: ['乘法口诀大冒险-初级']
        }),
        tags: JSON.stringify(['基础', '重点', '必背'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_multiplication_6_9',
        knowledge_point_name: '乘法口诀(6-9)',
        description: '学习6-9的乘法口诀表',
        difficulty_level: 3,
        parent_knowledge_point_id: 'math_g3_multiplication_2_5',
        related_knowledge_points: JSON.stringify(['math_g3_multiplication_application']),
        resources: JSON.stringify({
          videos: ['6-9口诀巧记法', '手指乘法技巧'],
          articles: ['难记口诀突破'],
          games: ['乘法口诀大冒险-高级']
        }),
        tags: JSON.stringify(['重点', '难点', '必背'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_multiplication_two_digit',
        knowledge_point_name: '两位数乘一位数',
        description: '学习两位数乘以一位数的竖式计算',
        difficulty_level: 3,
        parent_knowledge_point_id: 'math_g3_multiplication_6_9',
        related_knowledge_points: JSON.stringify(['math_g3_multiplication_application']),
        resources: JSON.stringify({
          videos: ['竖式乘法步骤', '不进位和进位'],
          articles: ['竖式乘法详解'],
          games: ['乘法计算挑战']
        }),
        tags: JSON.stringify(['重点'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_multiplication_application',
        knowledge_point_name: '乘法应用题',
        description: '用乘法解决实际生活问题',
        difficulty_level: 4,
        parent_knowledge_point_id: 'math_g3_multiplication_two_digit',
        related_knowledge_points: JSON.stringify(['math_g3_word_problem_basic']),
        resources: JSON.stringify({
          videos: ['应用题解题技巧', '如何读懂题意'],
          articles: ['应用题类型汇总'],
          games: ['生活中的数学']
        }),
        tags: JSON.stringify(['难点', '应用'])
      },

      // ========== 第三单元: 除法 ==========
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_division_basic',
        knowledge_point_name: '除法的初步认识',
        description: '理解除法的含义,学习平均分',
        difficulty_level: 2,
        parent_knowledge_point_id: 'math_g3_multiplication_6_9',
        related_knowledge_points: JSON.stringify(['math_g3_division_oral']),
        resources: JSON.stringify({
          videos: ['除法是什么', '平均分的故事'],
          articles: ['除法的意义'],
          games: ['分糖果游戏']
        }),
        tags: JSON.stringify(['基础', '重点'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_division_oral',
        knowledge_point_name: '表内除法',
        description: '学习用乘法口诀进行除法计算',
        difficulty_level: 3,
        parent_knowledge_point_id: 'math_g3_division_basic',
        related_knowledge_points: JSON.stringify(['math_g3_division_remainder']),
        resources: JSON.stringify({
          videos: ['表内除法技巧', '除法和乘法的关系'],
          articles: ['除法口诀'],
          games: ['除法速算王']
        }),
        tags: JSON.stringify(['重点', '必会'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_division_remainder',
        knowledge_point_name: '有余数的除法',
        description: '学习有余数除法的计算和余数的意义',
        difficulty_level: 4,
        parent_knowledge_point_id: 'math_g3_division_oral',
        related_knowledge_points: JSON.stringify(['math_g3_division_application']),
        resources: JSON.stringify({
          videos: ['余数是什么', '有余数除法计算'],
          articles: ['余数的性质'],
          games: ['分组游戏']
        }),
        tags: JSON.stringify(['重点', '难点'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_division_two_digit',
        knowledge_point_name: '两位数除以一位数',
        description: '学习两位数除以一位数的竖式计算',
        difficulty_level: 4,
        parent_knowledge_point_id: 'math_g3_division_remainder',
        related_knowledge_points: JSON.stringify(['math_g3_division_application']),
        resources: JSON.stringify({
          videos: ['竖式除法步骤', '商的位置'],
          articles: ['除法竖式详解'],
          games: ['除法挑战赛']
        }),
        tags: JSON.stringify(['重点', '难点'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_division_application',
        knowledge_point_name: '除法应用题',
        description: '用除法解决实际生活问题',
        difficulty_level: 5,
        parent_knowledge_point_id: 'math_g3_division_two_digit',
        related_knowledge_points: JSON.stringify(['math_g3_word_problem_mixed']),
        resources: JSON.stringify({
          videos: ['除法应用题解题方法'],
          articles: ['常见应用题类型'],
          games: ['超市购物']
        }),
        tags: JSON.stringify(['难点', '应用'])
      },

      // ========== 第四单元: 测量 ==========
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_length_mm_cm',
        knowledge_point_name: '长度单位(毫米/厘米)',
        description: '认识毫米和厘米,学习单位换算',
        difficulty_level: 2,
        parent_knowledge_point_id: null,
        related_knowledge_points: JSON.stringify(['math_g3_length_dm_m_km']),
        resources: JSON.stringify({
          videos: ['长度单位认识', '如何测量'],
          articles: ['生活中的长度'],
          games: ['测量小能手']
        }),
        tags: JSON.stringify(['基础', '生活'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_length_dm_m_km',
        knowledge_point_name: '长度单位(分米/米/千米)',
        description: '认识分米、米、千米,学习单位换算',
        difficulty_level: 2,
        parent_knowledge_point_id: 'math_g3_length_mm_cm',
        related_knowledge_points: JSON.stringify(['math_g3_weight']),
        resources: JSON.stringify({
          videos: ['大单位长度', '千米有多长'],
          articles: ['长度单位换算表'],
          games: ['长度猜猜猜']
        }),
        tags: JSON.stringify(['基础', '生活'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_weight',
        knowledge_point_name: '质量单位',
        description: '认识克、千克、吨,学习质量单位换算',
        difficulty_level: 3,
        parent_knowledge_point_id: 'math_g3_length_dm_m_km',
        related_knowledge_points: JSON.stringify(['math_g3_time']),
        resources: JSON.stringify({
          videos: ['认识克和千克', '质量的测量'],
          articles: ['质量单位换算'],
          games: ['称重游戏']
        }),
        tags: JSON.stringify(['基础', '生活'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_time',
        knowledge_point_name: '时间的计算',
        description: '学习时、分、秒及其换算,计算经过时间',
        difficulty_level: 3,
        parent_knowledge_point_id: 'math_g3_weight',
        related_knowledge_points: JSON.stringify(['math_g3_word_problem_basic']),
        resources: JSON.stringify({
          videos: ['认识时钟', '时间的计算'],
          articles: ['时间单位换算表'],
          games: ['时间大作战']
        }),
        tags: JSON.stringify(['重点', '生活'])
      },

      // ========== 第五单元: 几何图形 ==========
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_rectangle_square',
        knowledge_point_name: '长方形和正方形',
        description: '认识长方形和正方形的特征',
        difficulty_level: 2,
        parent_knowledge_point_id: null,
        related_knowledge_points: JSON.stringify(['math_g3_perimeter']),
        resources: JSON.stringify({
          videos: ['认识长方形和正方形', '特征对比'],
          articles: ['图形的性质'],
          games: ['图形分类']
        }),
        tags: JSON.stringify(['基础', '图形'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_perimeter',
        knowledge_point_name: '周长',
        description: '理解周长的含义,计算长方形和正方形周长',
        difficulty_level: 3,
        parent_knowledge_point_id: 'math_g3_rectangle_square',
        related_knowledge_points: JSON.stringify(['math_g3_area']),
        resources: JSON.stringify({
          videos: ['什么是周长', '周长公式'],
          articles: ['周长计算方法'],
          games: ['围篱笆']
        }),
        tags: JSON.stringify(['重点'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_area',
        knowledge_point_name: '面积',
        description: '理解面积的含义,学习面积单位',
        difficulty_level: 4,
        parent_knowledge_point_id: 'math_g3_perimeter',
        related_knowledge_points: JSON.stringify(['math_g3_word_problem_geometry']),
        resources: JSON.stringify({
          videos: ['什么是面积', '面积单位'],
          articles: ['面积和周长的区别'],
          games: ['铺地砖']
        }),
        tags: JSON.stringify(['重点', '难点'])
      },

      // ========== 第六单元: 分数 ==========
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_fraction_concept',
        knowledge_point_name: '分数的初步认识',
        description: '理解分数的含义,认识简单分数',
        difficulty_level: 3,
        parent_knowledge_point_id: null,
        related_knowledge_points: JSON.stringify(['math_g3_fraction_compare']),
        resources: JSON.stringify({
          videos: ['什么是分数', '分数的意义'],
          articles: ['分数的由来'],
          games: ['分蛋糕']
        }),
        tags: JSON.stringify(['基础', '抽象'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_fraction_compare',
        knowledge_point_name: '分数的大小比较',
        description: '学习同分母分数的大小比较',
        difficulty_level: 3,
        parent_knowledge_point_id: 'math_g3_fraction_concept',
        related_knowledge_points: JSON.stringify(['math_g3_fraction_calculate']),
        resources: JSON.stringify({
          videos: ['分数比大小', '比较方法'],
          articles: ['分数大小规律'],
          games: ['分数对对碰']
        }),
        tags: JSON.stringify(['重点'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_fraction_calculate',
        knowledge_point_name: '简单分数加减法',
        description: '学习同分母分数的加减法',
        difficulty_level: 4,
        parent_knowledge_point_id: 'math_g3_fraction_compare',
        related_knowledge_points: JSON.stringify(['math_g3_word_problem_fraction']),
        resources: JSON.stringify({
          videos: ['分数加减法', '计算方法'],
          articles: ['分数运算规则'],
          games: ['分数计算王']
        }),
        tags: JSON.stringify(['重点', '难点'])
      },

      // ========== 应用题专题 ==========
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_word_problem_basic',
        knowledge_point_name: '一步应用题',
        description: '学习只需一步计算的应用题',
        difficulty_level: 3,
        parent_knowledge_point_id: 'math_g3_addition_subtraction_mixed',
        related_knowledge_points: JSON.stringify(['math_g3_word_problem_two_step']),
        resources: JSON.stringify({
          videos: ['应用题入门', '读题技巧'],
          articles: ['应用题解题步骤'],
          games: ['生活小问题']
        }),
        tags: JSON.stringify(['重点', '应用'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_word_problem_two_step',
        knowledge_point_name: '两步应用题',
        description: '学习需要两步计算的应用题',
        difficulty_level: 4,
        parent_knowledge_point_id: 'math_g3_word_problem_basic',
        related_knowledge_points: JSON.stringify(['math_g3_word_problem_mixed']),
        resources: JSON.stringify({
          videos: ['两步应用题方法', '先算什么'],
          articles: ['两步应用题类型'],
          games: ['应用题挑战']
        }),
        tags: JSON.stringify(['难点', '应用'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_word_problem_mixed',
        knowledge_point_name: '综合应用题',
        description: '综合运用加减乘除解决问题',
        difficulty_level: 5,
        parent_knowledge_point_id: 'math_g3_word_problem_two_step',
        related_knowledge_points: JSON.stringify([]),
        resources: JSON.stringify({
          videos: ['综合应用题技巧', '思维导图法'],
          articles: ['应用题大全'],
          games: ['数学小侦探']
        }),
        tags: JSON.stringify(['难点', '综合', '应用'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_word_problem_geometry',
        knowledge_point_name: '图形应用题',
        description: '解决与周长、面积相关的实际问题',
        difficulty_level: 4,
        parent_knowledge_point_id: 'math_g3_area',
        related_knowledge_points: JSON.stringify(['math_g3_word_problem_mixed']),
        resources: JSON.stringify({
          videos: ['图形应用题解法'],
          articles: ['周长面积应用'],
          games: ['设计小房子']
        }),
        tags: JSON.stringify(['难点', '应用'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_word_problem_fraction',
        knowledge_point_name: '分数应用题',
        description: '解决与分数相关的实际问题',
        difficulty_level: 5,
        parent_knowledge_point_id: 'math_g3_fraction_calculate',
        related_knowledge_points: JSON.stringify(['math_g3_word_problem_mixed']),
        resources: JSON.stringify({
          videos: ['分数应用题方法'],
          articles: ['分数在生活中的应用'],
          games: ['分享游戏']
        }),
        tags: JSON.stringify(['难点', '应用'])
      },

      // ========== 其他专题 ==========
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_calculation_check',
        knowledge_point_name: '计算验算',
        description: '学习验算方法,培养检查习惯',
        difficulty_level: 2,
        parent_knowledge_point_id: 'math_g3_addition_subtraction_mixed',
        related_knowledge_points: JSON.stringify([]),
        resources: JSON.stringify({
          videos: ['验算的方法', '为什么要验算'],
          articles: ['验算技巧'],
          games: ['找错游戏']
        }),
        tags: JSON.stringify(['习惯', '方法'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_number_pattern',
        knowledge_point_name: '数字规律',
        description: '发现和总结数字规律',
        difficulty_level: 4,
        parent_knowledge_point_id: null,
        related_knowledge_points: JSON.stringify([]),
        resources: JSON.stringify({
          videos: ['找规律的方法', '数字游戏'],
          articles: ['常见数字规律'],
          games: ['数字侦探']
        }),
        tags: JSON.stringify(['思维', '拓展'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_logical_thinking',
        knowledge_point_name: '逻辑推理',
        description: '培养逻辑思维能力',
        difficulty_level: 4,
        parent_knowledge_point_id: null,
        related_knowledge_points: JSON.stringify([]),
        resources: JSON.stringify({
          videos: ['逻辑推理游戏', '思维训练'],
          articles: ['逻辑题类型'],
          games: ['逻辑大师']
        }),
        tags: JSON.stringify(['思维', '拓展'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_statistics_basic',
        knowledge_point_name: '统计初步',
        description: '学习简单的数据收集和整理',
        difficulty_level: 3,
        parent_knowledge_point_id: null,
        related_knowledge_points: JSON.stringify([]),
        resources: JSON.stringify({
          videos: ['统计是什么', '数据收集'],
          articles: ['统计表和图'],
          games: ['班级统计员']
        }),
        tags: JSON.stringify(['基础', '应用'])
      },
      {
        subject: 'math',
        grade: 'grade_3',
        knowledge_point_id: 'math_g3_possibility',
        knowledge_point_name: '可能性',
        description: '认识事件发生的可能性',
        difficulty_level: 3,
        parent_knowledge_point_id: null,
        related_knowledge_points: JSON.stringify([]),
        resources: JSON.stringify({
          videos: ['可能性是什么', '一定、可能、不可能'],
          articles: ['概率初步'],
          games: ['抽奖游戏']
        }),
        tags: JSON.stringify(['思维', '趣味'])
      }
    ];

    // 批量插入知识点
    for (const kp of knowledgePoints) {
      await query(`
        INSERT INTO knowledge_graph (
          subject, grade, knowledge_point_id, knowledge_point_name,
          description, difficulty_level, parent_knowledge_point_id,
          related_knowledge_points, resources, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (knowledge_point_id) DO NOTHING
      `, [
        kp.subject,
        kp.grade,
        kp.knowledge_point_id,
        kp.knowledge_point_name,
        kp.description,
        kp.difficulty_level,
        kp.parent_knowledge_point_id,
        kp.related_knowledge_points,
        kp.resources,
        kp.tags
      ]);
    }

    console.log(`✅ Inserted ${knowledgePoints.length} knowledge points for Grade 3 Math`);
    console.log('🎉 Sample knowledge points data inserted successfully!');
  },

  down: async () => {
    console.log('Removing sample knowledge points...');
    await query(`DELETE FROM knowledge_graph WHERE grade = 'grade_3' AND subject = 'math'`);
    console.log('✅ Removed all Grade 3 Math knowledge points');
  }
};
