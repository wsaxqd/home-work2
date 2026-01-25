-- PK系统完整建表SQL

-- 1. PK房间表
CREATE TABLE IF NOT EXISTS pk_rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(20) UNIQUE NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  subject VARCHAR(50),
  difficulty VARCHAR(20),
  question_count INTEGER DEFAULT 10,
  time_limit INTEGER DEFAULT 300,
  room_status VARCHAR(20) DEFAULT 'waiting',
  created_by UUID REFERENCES users(id),
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

-- 2. PK参与者表
CREATE TABLE IF NOT EXISTS pk_participants (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES pk_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_slot INTEGER NOT NULL,
  is_ready BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  combo_count INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  rank_change INTEGER DEFAULT 0,
  is_winner BOOLEAN,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_room_user UNIQUE (room_id, user_id),
  CONSTRAINT unique_room_slot UNIQUE (room_id, player_slot)
);

-- 3. PK题目表
CREATE TABLE IF NOT EXISTS pk_questions (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES pk_rooms(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_data JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_room_question UNIQUE (room_id, question_number)
);

-- 4. PK答题记录表
CREATE TABLE IF NOT EXISTS pk_answers (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES pk_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER NOT NULL,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 段位系统表
CREATE TABLE IF NOT EXISTS pk_ranks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL,
  rank_level VARCHAR(50) DEFAULT 'bronze',
  rank_stars INTEGER DEFAULT 0,
  rank_points INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  max_win_streak INTEGER DEFAULT 0,
  season VARCHAR(20),
  highest_rank VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_game_rank UNIQUE (user_id, game_type, season)
);

-- 6. 好友系统表
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- 7. PK邀请表
CREATE TABLE IF NOT EXISTS pk_invitations (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES pk_rooms(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_pk_rooms_status ON pk_rooms(room_status);
CREATE INDEX IF NOT EXISTS idx_pk_rooms_created_by ON pk_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_pk_participants_room ON pk_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_pk_participants_user ON pk_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_pk_ranks_user_game ON pk_ranks(user_id, game_type);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_pk_invitations_invitee ON pk_invitations(invitee_id);

-- 插入初始段位数据
INSERT INTO pk_ranks (user_id, game_type, season)
SELECT id, 'math-quiz', '2025-S1'
FROM users
LIMIT 5
ON CONFLICT DO NOTHING;
