import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_018_add_more_game_questions: Migration = {
  id: '018',
  name: '018_add_more_game_questions',

  up: async () => {
    // 添加更多游戏题目
    await query(`
      INSERT INTO game_questions (game_type, question_data, difficulty, tags) VALUES
      -- 逻辑推理游戏
      ('logic', '{"question": "小明比小红高，小红比小华高，谁最高？", "options": ["小明", "小红", "小华", "一样高"], "correctAnswer": 0, "explanation": "小明比小红高，小红又比小华高，所以小明最高！"}', 1, ARRAY['逻辑', '比较']),
      ('logic', '{"question": "如果所有的猫都喜欢鱼，小花是一只猫，那么：", "options": ["小花喜欢鱼", "小花不喜欢鱼", "不确定", "小花是鱼"], "correctAnswer": 0, "explanation": "因为所有猫都喜欢鱼，小花是猫，所以小花也喜欢鱼！"}', 2, ARRAY['逻辑', '推理']),
      ('logic', '{"question": "一个星期有7天，2个星期有多少天？", "options": ["7天", "10天", "14天", "20天"], "correctAnswer": 2, "explanation": "一个星期7天，两个星期就是7×2=14天！"}', 1, ARRAY['逻辑', '数学']),

      -- 记忆游戏
      ('memory', '{"question": "记住这些水果：苹果、香蕉、橙子。现在选出你刚才看到的水果：", "options": ["西瓜", "香蕉", "草莓", "葡萄"], "correctAnswer": 1, "explanation": "香蕉是刚才出现的水果之一！"}', 1, ARRAY['记忆', '水果']),
      ('memory', '{"question": "记住这个顺序：红、绿、蓝、黄。第三个颜色是什么？", "options": ["红", "绿", "蓝", "黄"], "correctAnswer": 2, "explanation": "顺序是红、绿、蓝、黄，第三个是蓝色！"}', 2, ARRAY['记忆', '颜色']),

      -- 更多图像识别题（困难级别）
      ('image_recognition', '{"imageUrl": "/images/questions/violin.jpg", "question": "这是什么乐器？", "options": ["小提琴", "钢琴", "吉他", "笛子"], "correctAnswer": 0, "explanation": "这是小提琴，一种用琴弓演奏的弦乐器！"}', 3, ARRAY['音乐', '挑战']),
      ('image_recognition', '{"imageUrl": "/images/questions/eiffel.jpg", "question": "这是哪个著名建筑？", "options": ["埃菲尔铁塔", "比萨斜塔", "自由女神像", "东方明珠"], "correctAnswer": 0, "explanation": "这是法国巴黎的埃菲尔铁塔！"}', 3, ARRAY['建筑', '世界']),

      -- 更多情绪识别题（困难级别）
      ('emotion_recognition', '{"imageUrl": "/images/emotions/proud.jpg", "question": "这个表情是什么情绪？", "options": ["骄傲", "害羞", "困惑", "无聊"], "correctAnswer": 0, "explanation": "这是骄傲的表情，挺胸抬头，满脸自豪！"}', 2, ARRAY['情绪', '进阶']),
      ('emotion_recognition', '{"imageUrl": "/images/emotions/confused.jpg", "question": "这个表情表达了什么？", "options": ["困惑", "开心", "生气", "害怕"], "correctAnswer": 0, "explanation": "这是困惑的表情，眉头紧皱，好像在思考难题。"}', 2, ARRAY['情绪', '进阶']),

      -- 知识问答
      ('knowledge', '{"question": "一年有几个季节？", "options": ["2个", "3个", "4个", "5个"], "correctAnswer": 2, "explanation": "一年有春、夏、秋、冬四个季节！"}', 1, ARRAY['知识', '自然']),
      ('knowledge', '{"question": "地球的卫星是什么？", "options": ["太阳", "月亮", "火星", "金星"], "correctAnswer": 1, "explanation": "月亮是地球唯一的天然卫星！"}', 1, ARRAY['知识', '天文']),
      ('knowledge', '{"question": "哪种动物会冬眠？", "options": ["熊", "狗", "猫", "鸡"], "correctAnswer": 0, "explanation": "熊在冬天会冬眠，储存能量度过寒冷的冬季！"}', 2, ARRAY['知识', '动物'])
    `);

    console.log('✓ Added more game questions (12 new questions)');
  },

  down: async () => {
    await query(`
      DELETE FROM game_questions
      WHERE game_type IN ('logic', 'memory', 'knowledge')
    `);
    console.log('✓ Removed additional game questions');
  }
};
