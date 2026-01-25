import { Migration } from './migrationRunner';

/**
 * 迁移：创建多人竞技PK系统表
 *
 * 功能说明：
 * - 1v1实时答题对战
 * - 好友邀请和匹配系统
 * - 排行榜和段位系统
 * - 对战历史记录
 */

export const migration_030_create_pk_system: Migration = {
  name: '030_create_pk_system',
  async up(client) {
    await client.query('BEGIN')

    try {
      // 1. PK房间表
      await client.query(`
        CREATE TABLE IF NOT EXISTS pk_rooms (
          id SERIAL PRIMARY KEY,
          room_code VARCHAR(20) UNIQUE NOT NULL,      -- 房间码
          game_type VARCHAR(50) NOT NULL,              -- 游戏类型
          subject VARCHAR(50),                         -- 科目
          difficulty VARCHAR(20),                      -- 难度
          question_count INTEGER DEFAULT 10,           -- 题目数量
          time_limit INTEGER DEFAULT 300,              -- 时间限制（秒）
          room_status VARCHAR(20) DEFAULT 'waiting',   -- 状态：waiting, playing, finished
          created_by UUID REFERENCES users(id),        -- 创建者（改为UUID）
          is_private BOOLEAN DEFAULT false,            -- 是否私密房间
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          started_at TIMESTAMP,
          finished_at TIMESTAMP
        )
      `)

      // 2. PK参与者表
      await client.query(`
        CREATE TABLE IF NOT EXISTS pk_participants (
          id SERIAL PRIMARY KEY,
          room_id INTEGER NOT NULL REFERENCES pk_rooms(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 改为UUID
          player_slot INTEGER NOT NULL,               -- 玩家位置：1或2
          is_ready BOOLEAN DEFAULT false,             -- 是否准备
          score INTEGER DEFAULT 0,                    -- 得分
          correct_count INTEGER DEFAULT 0,            -- 答对题数
          combo_count INTEGER DEFAULT 0,              -- 最高连击
          total_time INTEGER DEFAULT 0,               -- 总用时（毫秒）
          rank_change INTEGER DEFAULT 0,              -- 段位分变化
          is_winner BOOLEAN,                          -- 是否获胜
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_room_user UNIQUE (room_id, user_id),
          CONSTRAINT unique_room_slot UNIQUE (room_id, player_slot)
        )
      `)

      // 3. PK题目表
      await client.query(`
        CREATE TABLE IF NOT EXISTS pk_questions (
          id SERIAL PRIMARY KEY,
          room_id INTEGER NOT NULL REFERENCES pk_rooms(id) ON DELETE CASCADE,
          question_number INTEGER NOT NULL,           -- 题号
          question_data JSONB NOT NULL,               -- 题目数据
          correct_answer TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_room_question UNIQUE (room_id, question_number)
        )
      `)

      // 4. PK答题记录表
      await client.query(`
        CREATE TABLE IF NOT EXISTS pk_answers (
          id SERIAL PRIMARY KEY,
          room_id INTEGER NOT NULL REFERENCES pk_rooms(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 改为UUID
          question_number INTEGER NOT NULL,
          user_answer TEXT NOT NULL,
          is_correct BOOLEAN NOT NULL,
          time_spent INTEGER NOT NULL,                -- 用时（毫秒）
          answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // 5. 段位系统表
      await client.query(`
        CREATE TABLE IF NOT EXISTS pk_ranks (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 改为UUID
          game_type VARCHAR(50) NOT NULL,
          rank_level VARCHAR(50) DEFAULT 'bronze',    -- 段位：bronze, silver, gold, platinum, diamond, master, grandmaster
          rank_stars INTEGER DEFAULT 0,               -- 段位内星星数（0-5）
          rank_points INTEGER DEFAULT 0,              -- 段位分
          total_wins INTEGER DEFAULT 0,               -- 总胜场
          total_losses INTEGER DEFAULT 0,             -- 总败场
          win_streak INTEGER DEFAULT 0,               -- 连胜
          max_win_streak INTEGER DEFAULT 0,           -- 最高连胜
          season VARCHAR(20),                         -- 赛季
          highest_rank VARCHAR(50),                   -- 历史最高段位
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_user_game_rank UNIQUE (user_id, game_type, season)
        )
      `)

      // 6. 好友系统表
      await client.query(`
        CREATE TABLE IF NOT EXISTS friendships (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 改为UUID
          friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 改为UUID
          status VARCHAR(20) DEFAULT 'pending',       -- 状态：pending, accepted, rejected, blocked
          requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          responded_at TIMESTAMP,
          CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
          CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
        )
      `)

      // 7. PK邀请表
      await client.query(`
        CREATE TABLE IF NOT EXISTS pk_invitations (
          id SERIAL PRIMARY KEY,
          room_id INTEGER NOT NULL REFERENCES pk_rooms(id) ON DELETE CASCADE,
          inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 改为UUID
          invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 改为UUID
          status VARCHAR(20) DEFAULT 'pending',       -- 状态：pending, accepted, rejected, expired
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          responded_at TIMESTAMP
        )
      `)

      // 创建索引
      await client.query('CREATE INDEX IF NOT EXISTS idx_pk_rooms_status ON pk_rooms(room_status)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_pk_rooms_created_by ON pk_rooms(created_by)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_pk_participants_room ON pk_participants(room_id)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_pk_participants_user ON pk_participants(user_id)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_pk_ranks_user_game ON pk_ranks(user_id, game_type)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id)')
      await client.query('CREATE INDEX IF NOT EXISTS idx_pk_invitations_invitee ON pk_invitations(invitee_id)')

      // 插入初始段位配置数据（前5个用户）
      await client.query(`
        INSERT INTO pk_ranks (user_id, game_type, season)
        SELECT id, 'math-quiz', '2025-S1'
        FROM users
        LIMIT 5
        ON CONFLICT DO NOTHING
      `)

      await client.query('COMMIT')
      console.log('✅ 迁移 030: 多人竞技PK系统表创建成功')
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ 迁移 030 失败:', error)
      throw error
    }
  },

  async down(client) {
    await client.query('BEGIN')

    try {
      await client.query('DROP TABLE IF EXISTS pk_invitations CASCADE')
      await client.query('DROP TABLE IF EXISTS friendships CASCADE')
      await client.query('DROP TABLE IF EXISTS pk_ranks CASCADE')
      await client.query('DROP TABLE IF EXISTS pk_answers CASCADE')
      await client.query('DROP TABLE IF EXISTS pk_questions CASCADE')
      await client.query('DROP TABLE IF EXISTS pk_participants CASCADE')
      await client.query('DROP TABLE IF EXISTS pk_rooms CASCADE')

      await client.query('COMMIT')
      console.log('✅ 迁移 030 回滚成功')
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ 迁移 030 回滚失败:', error)
      throw error
    }
  }
};
