import { Migration } from './migrationRunner';
import { query } from '../config/database';

export const migration_033_create_questions_table: Migration = {
  id: '033',
  name: '033_create_questions_table',

  up: async () => {
    console.log('Creating questions tables...');

    // 先删除可能存在的残留表
    await query(`DROP TABLE IF EXISTS question_options CASCADE;`);
    await query(`DROP TABLE IF EXISTS questions CASCADE;`);

    // 创建题目表
    await query(`
      CREATE TABLE questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject VARCHAR(20) NOT NULL,
        grade VARCHAR(20) NOT NULL,
        knowledge_point_id VARCHAR(50) NOT NULL,
        question_type VARCHAR(20) NOT NULL,
        question_text TEXT NOT NULL,
        question_image TEXT,
        correct_answer TEXT NOT NULL,
        explanation TEXT NOT NULL,
        difficulty INT NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建题目选项表
    await query(`
      CREATE TABLE question_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
        option_label VARCHAR(5) NOT NULL,
        option_text TEXT NOT NULL,
        option_image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建索引
    await query(`CREATE INDEX idx_questions_knowledge_point ON questions(knowledge_point_id);`);
    await query(`CREATE INDEX idx_questions_subject ON questions(subject);`);
    await query(`CREATE INDEX idx_questions_difficulty ON questions(difficulty);`);
    await query(`CREATE INDEX idx_question_options_question ON question_options(question_id);`);

    // 添加注释
    await query(`COMMENT ON TABLE questions IS '题目表';`);
    await query(`COMMENT ON TABLE question_options IS '题目选项表';`);
    await query(`COMMENT ON COLUMN questions.question_type IS '题型:single_choice单选,multiple_choice多选,fill_blank填空,true_false判断,subjective主观题';`);
    await query(`COMMENT ON COLUMN questions.difficulty IS '难度等级:1-5,1最简单,5最难';`);

    console.log('✅ 题库表创建成功');
  },

  down: async () => {
    console.log('Dropping questions tables...');

    await query(`
      DROP TABLE IF EXISTS question_options CASCADE;
      DROP TABLE IF EXISTS questions CASCADE;
    `);

    console.log('✅ 题库表删除成功');
  }
};
