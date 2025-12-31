import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_016_create_game_questions: Migration = {
  id: '016',
  name: '016_create_game_questions',

  up: async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS game_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_type VARCHAR(50) NOT NULL,
        question_data JSONB NOT NULL,
        difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
        tags TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_game_questions_type ON game_questions(game_type)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_game_questions_difficulty ON game_questions(difficulty)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_game_questions_active ON game_questions(is_active)
    `);

    // 插入示例题目数据 - 图像识别游戏
    await query(`
      INSERT INTO game_questions (game_type, question_data, difficulty, tags) VALUES
      -- 简单级别
      ('image_recognition', '{"imageUrl": "/images/questions/cat.jpg", "question": "这是什么动物？", "options": ["猫", "狗", "兔子", "老虎"], "correctAnswer": 0, "explanation": "这是一只可爱的猫咪！"}', 1, ARRAY['动物', '基础']),
      ('image_recognition', '{"imageUrl": "/images/questions/apple.jpg", "question": "这是什么水果？", "options": ["苹果", "梨", "香蕉", "橙子"], "correctAnswer": 0, "explanation": "这是红红的苹果！"}', 1, ARRAY['水果', '基础']),
      ('image_recognition', '{"imageUrl": "/images/questions/car.jpg", "question": "这是什么交通工具？", "options": ["汽车", "飞机", "轮船", "自行车"], "correctAnswer": 0, "explanation": "这是一辆汽车！"}', 1, ARRAY['交通', '基础']),
      ('image_recognition', '{"imageUrl": "/images/questions/sun.jpg", "question": "这是什么？", "options": ["太阳", "月亮", "星星", "云朵"], "correctAnswer": 0, "explanation": "这是温暖的太阳！"}', 1, ARRAY['自然', '基础']),
      ('image_recognition', '{"imageUrl": "/images/questions/book.jpg", "question": "这是什么？", "options": ["书本", "笔记本", "报纸", "杂志"], "correctAnswer": 0, "explanation": "这是一本书！"}', 1, ARRAY['物品', '基础']),

      -- 中等级别
      ('image_recognition', '{"imageUrl": "/images/questions/panda.jpg", "question": "这是什么动物？", "options": ["熊猫", "熊", "浣熊", "考拉"], "correctAnswer": 0, "explanation": "这是中国的国宝大熊猫！"}', 2, ARRAY['动物', '进阶']),
      ('image_recognition', '{"imageUrl": "/images/questions/pyramid.jpg", "question": "这是什么建筑？", "options": ["金字塔", "长城", "教堂", "城堡"], "correctAnswer": 0, "explanation": "这是埃及的金字塔！"}', 2, ARRAY['建筑', '进阶']),
      ('image_recognition', '{"imageUrl": "/images/questions/rainbow.jpg", "question": "这是什么自然现象？", "options": ["彩虹", "闪电", "极光", "彗星"], "correctAnswer": 0, "explanation": "这是美丽的彩虹！"}', 2, ARRAY['自然', '进阶']),

      -- 情绪识别游戏
      ('emotion_recognition', '{"imageUrl": "/images/emotions/happy.jpg", "question": "这个表情是什么情绪？", "options": ["开心", "伤心", "生气", "害怕"], "correctAnswer": 0, "explanation": "这是开心的表情，眼睛弯弯，嘴角上扬！"}', 1, ARRAY['情绪', '基础']),
      ('emotion_recognition', '{"imageUrl": "/images/emotions/sad.jpg", "question": "这个表情是什么情绪？", "options": ["伤心", "开心", "生气", "惊讶"], "correctAnswer": 0, "explanation": "这是伤心的表情，眼睛向下，嘴角下垂。"}', 1, ARRAY['情绪', '基础']),
      ('emotion_recognition', '{"imageUrl": "/images/emotions/angry.jpg", "question": "这个表情是什么情绪？", "options": ["生气", "开心", "伤心", "害怕"], "correctAnswer": 0, "explanation": "这是生气的表情，眉毛竖起，嘴巴紧闭！"}', 1, ARRAY['情绪', '基础']),
      ('emotion_recognition', '{"imageUrl": "/images/emotions/surprised.jpg", "question": "这个表情是什么情绪？", "options": ["惊讶", "开心", "生气", "伤心"], "correctAnswer": 0, "explanation": "这是惊讶的表情，眼睛睁大，嘴巴张开！"}', 1, ARRAY['情绪', '基础']),
      ('emotion_recognition', '{"imageUrl": "/images/emotions/scared.jpg", "question": "这个表情是什么情绪？", "options": ["害怕", "开心", "生气", "伤心"], "correctAnswer": 0, "explanation": "这是害怕的表情，眼睛瞪大，身体颤抖。"}', 1, ARRAY['情绪', '基础'])
    `);

    console.log('✓ game_questions table created and seeded with sample data');
  },

  down: async () => {
    await query('DROP TABLE IF EXISTS game_questions CASCADE');
    console.log('✓ game_questions table dropped');
  }
};
