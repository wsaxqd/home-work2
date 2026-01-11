# 功能实施计划 - 草稿箱 & 成就系统

## 📦 第一部分：草稿箱功能实施方案

### 🎯 功能概述
允许用户保存未完成的创作内容，随时继续编辑

### 📋 数据结构设计

```typescript
// app/src/types/draft.ts
export interface Draft {
  id: string
  userId: number
  type: 'story' | 'poem' | 'art' | 'music'
  title: string
  content: any // 根据type存储不同格式数据
  thumbnail?: string // 缩略图
  progress: number // 完成度 0-100
  createdAt: string
  updatedAt: string
}
```

### 🗄️ 数据库迁移

```typescript
// server/src/migrations/022_create_drafts.ts
export const up = async (client: any) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS drafts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('story', 'poem', 'art', 'music')),
      title VARCHAR(200),
      content JSONB NOT NULL,
      thumbnail TEXT,
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, type, title)
    );

    CREATE INDEX idx_drafts_user_id ON drafts(user_id);
    CREATE INDEX idx_drafts_type ON drafts(type);
    CREATE INDEX idx_drafts_updated_at ON drafts(updated_at DESC);
  `);
};

export const down = async (client: any) => {
  await client.query(`DROP TABLE IF EXISTS drafts CASCADE;`);
};
```

### 🔧 后端API实现

```typescript
// server/src/routes/drafts.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 获取草稿列表
router.get('/', authMiddleware, async (req, res) => {
  const { type } = req.query;
  const userId = req.user!.id;

  let query = 'SELECT * FROM drafts WHERE user_id = $1';
  const params = [userId];

  if (type) {
    query += ' AND type = $2';
    params.push(type as string);
  }

  query += ' ORDER BY updated_at DESC LIMIT 50';

  const result = await pool.query(query, params);
  res.json({ success: true, data: result.rows });
});

// 保存草稿
router.post('/', authMiddleware, async (req, res) => {
  const { type, title, content, thumbnail, progress } = req.body;
  const userId = req.user!.id;

  const result = await pool.query(
    `INSERT INTO drafts (user_id, type, title, content, thumbnail, progress)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, type, title)
     DO UPDATE SET content = $4, thumbnail = $5, progress = $6, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, type, title, content, thumbnail, progress]
  );

  res.json({ success: true, data: result.rows[0] });
});

// 删除草稿
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  await pool.query(
    'DELETE FROM drafts WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  res.json({ success: true, message: '草稿已删除' });
});

export default router;
```

### 💻 前端组件实现

```tsx
// app/src/components/DraftsSection.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { draftsApi } from '../services/api'
import './DraftsSection.css'

interface Draft {
  id: string
  type: string
  title: string
  progress: number
  thumbnail?: string
  updatedAt: string
}

export default function DraftsSection({ type }: { type?: string }) {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDrafts()
  }, [type])

  const loadDrafts = async () => {
    try {
      const response = await draftsApi.getList(type)
      if (response.success) {
        setDrafts(response.data)
      }
    } catch (error) {
      console.error('加载草稿失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDraft = async (id: string) => {
    if (!confirm('确定删除这个草稿吗？')) return

    try {
      await draftsApi.delete(id)
      setDrafts(drafts.filter(d => d.id !== id))
    } catch (error) {
      console.error('删除草稿失败', error)
    }
  }

  const handleContinueEdit = (draft: Draft) => {
    const routeMap: Record<string, string> = {
      story: '/story-creator',
      poem: '/poem-creator',
      art: '/art-creator',
      music: '/music-creator'
    }
    navigate(`${routeMap[draft.type]}?draftId=${draft.id}`)
  }

  if (loading) return <div className="drafts-loading">加载中...</div>
  if (drafts.length === 0) return null

  return (
    <div className="drafts-section">
      <div className="drafts-header">
        <h3>📝 我的草稿</h3>
        <span className="drafts-count">{drafts.length}</span>
      </div>
      <div className="drafts-list">
        {drafts.map(draft => (
          <div key={draft.id} className="draft-card">
            {draft.thumbnail && (
              <div className="draft-thumbnail">
                <img src={draft.thumbnail} alt={draft.title} />
              </div>
            )}
            <div className="draft-info">
              <div className="draft-title">{draft.title || '未命名'}</div>
              <div className="draft-meta">
                <span className="draft-type">{getDraftTypeLabel(draft.type)}</span>
                <span className="draft-progress">{draft.progress}% 完成</span>
              </div>
              <div className="draft-progress-bar">
                <div className="progress-fill" style={{width: `${draft.progress}%`}}></div>
              </div>
            </div>
            <div className="draft-actions">
              <button
                className="btn-continue"
                onClick={() => handleContinueEdit(draft)}
              >
                继续编辑
              </button>
              <button
                className="btn-delete"
                onClick={() => handleDeleteDraft(draft.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getDraftTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    story: '故事',
    poem: '诗词',
    art: '绘画',
    music: '音乐'
  }
  return labels[type] || type
}
```

### 🎨 样式文件

```css
/* app/src/components/DraftsSection.css */
.drafts-section {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 14px rgba(251, 191, 36, 0.2);
}

.drafts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.drafts-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #78350f;
  margin: 0;
}

.drafts-count {
  background: rgba(120, 53, 15, 0.15);
  color: #78350f;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
}

.drafts-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.draft-card {
  min-width: 260px;
  background: white;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.draft-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.draft-thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f3f4f6;
}

.draft-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.draft-info {
  flex: 1;
  min-width: 0;
}

.draft-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.draft-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.draft-type {
  font-size: 11px;
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
}

.draft-progress {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
}

.draft-progress-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.3s ease;
}

.draft-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.btn-continue {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-continue:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-delete {
  width: 32px;
  height: 32px;
  background: #fee2e2;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: #fecaca;
  transform: scale(1.1);
}
```

---

## 🏆 第二部分：成就系统实施方案

### 🎯 功能概述
通过完成任务解锁徽章，提升用户参与度和成就感

### 📋 数据结构设计

```typescript
// app/src/types/achievement.ts
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'game' | 'create' | 'social' | 'explore'
  requirement: {
    type: 'count' | 'streak' | 'score'
    target: number
  }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  coins: number // 奖励金币数
}

export interface UserAchievement {
  achievementId: string
  unlockedAt: string
  progress: number
}
```

### 🗄️ 数据库迁移

```typescript
// server/src/migrations/023_create_achievements.ts
export const up = async (client: any) => {
  // 成就定义表
  await client.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      icon VARCHAR(10) NOT NULL,
      category VARCHAR(20) NOT NULL CHECK (category IN ('game', 'create', 'social', 'explore')),
      requirement_type VARCHAR(20) NOT NULL CHECK (requirement_type IN ('count', 'streak', 'score')),
      requirement_target INTEGER NOT NULL,
      rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
      coins INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 用户成就解锁记录表
    CREATE TABLE IF NOT EXISTS user_achievements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
      progress INTEGER DEFAULT 0,
      unlocked_at TIMESTAMP,
      UNIQUE(user_id, achievement_id)
    );

    CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
    CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked_at DESC);

    -- 插入预设成就
    INSERT INTO achievements (id, name, description, icon, category, requirement_type, requirement_target, rarity, coins) VALUES
    ('game_beginner', '游戏新手', '完成第1个游戏', '🎮', 'game', 'count', 1, 'common', 10),
    ('game_player', '游戏达人', '完成10个游戏', '🎯', 'game', 'count', 10, 'rare', 50),
    ('game_master', '游戏大师', '完成50个游戏', '👑', 'game', 'count', 50, 'epic', 200),
    ('create_first', '创作起步', '完成第1个创作', '✨', 'create', 'count', 1, 'common', 10),
    ('create_artist', '小小艺术家', '完成10个创作', '🎨', 'create', 'count', 10, 'rare', 50),
    ('create_genius', '创意天才', '完成50个创作', '🌟', 'create', 'count', 50, 'epic', 200),
    ('streak_3', '连续3天', '连续登录3天', '🔥', 'explore', 'streak', 3, 'common', 20),
    ('streak_7', '连续1周', '连续登录7天', '💪', 'explore', 'streak', 7, 'rare', 100),
    ('streak_30', '连续1月', '连续登录30天', '💎', 'explore', 'streak', 30, 'legendary', 500),
    ('social_friend', '社交新手', '关注1个好友', '👥', 'social', 'count', 1, 'common', 10),
    ('social_popular', '人气之星', '获得100个赞', '❤️', 'social', 'count', 100, 'epic', 300);
  `);
};

export const down = async (client: any) => {
  await client.query(`DROP TABLE IF EXISTS user_achievements CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS achievements CASCADE;`);
};
```

### 🔧 后端API实现

```typescript
// server/src/services/achievementService.ts
import { pool } from '../config/database';

export class AchievementService {
  // 检查并解锁成就
  static async checkAndUnlock(userId: number, category: string, progress: number) {
    const result = await pool.query(
      `SELECT a.*, ua.progress as user_progress, ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       WHERE a.category = $2 AND (ua.unlocked_at IS NULL OR ua.progress < a.requirement_target)`,
      [userId, category]
    );

    const newUnlocks: any[] = [];

    for (const achievement of result.rows) {
      const shouldUnlock = progress >= achievement.requirement_target;

      if (shouldUnlock && !achievement.unlocked_at) {
        // 解锁成就
        await pool.query(
          `INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, achievement_id)
           DO UPDATE SET progress = $3, unlocked_at = CURRENT_TIMESTAMP`,
          [userId, achievement.id, progress]
        );

        // 奖励金币
        if (achievement.coins > 0) {
          await pool.query(
            'UPDATE users SET coins = coins + $1 WHERE id = $2',
            [achievement.coins, userId]
          );
        }

        newUnlocks.push(achievement);
      } else {
        // 更新进度
        await pool.query(
          `INSERT INTO user_achievements (user_id, achievement_id, progress)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, achievement_id)
           DO UPDATE SET progress = $3`,
          [userId, achievement.id, progress]
        );
      }
    }

    return newUnlocks;
  }

  // 获取用户成就列表
  static async getUserAchievements(userId: number) {
    const result = await pool.query(
      `SELECT a.*,
              COALESCE(ua.progress, 0) as progress,
              ua.unlocked_at,
              CASE WHEN ua.unlocked_at IS NOT NULL THEN true ELSE false END as unlocked
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       ORDER BY
         CASE a.rarity
           WHEN 'legendary' THEN 1
           WHEN 'epic' THEN 2
           WHEN 'rare' THEN 3
           ELSE 4
         END,
         unlocked DESC,
         a.requirement_target ASC`,
      [userId]
    );

    return result.rows;
  }
}
```

### 💻 前端组件实现

```tsx
// app/src/components/AchievementsShowcase.tsx
import { useEffect, useState } from 'react'
import { achievementsApi } from '../services/api'
import './AchievementsShowcase.css'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: string
  progress: number
  requirementTarget: number
  unlocked: boolean
  coins: number
}

export default function AchievementsShowcase() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      const response = await achievementsApi.getList()
      if (response.success) {
        setAchievements(response.data)
      }
    } catch (error) {
      console.error('加载成就失败', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked
    if (filter === 'locked') return !a.unlocked
    return true
  })

  const unlockedCount = achievements.filter(a => a.unlocked).length

  if (loading) return <div>加载中...</div>

  return (
    <div className="achievements-showcase">
      <div className="achievements-header">
        <div className="achievements-title">
          <span className="title-icon">🏆</span>
          <span>我的成就</span>
        </div>
        <div className="achievements-stats">
          {unlockedCount} / {achievements.length} 已解锁
        </div>
      </div>

      <div className="achievements-filter">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button
          className={`filter-btn ${filter === 'unlocked' ? 'active' : ''}`}
          onClick={() => setFilter('unlocked')}
        >
          已解锁
        </button>
        <button
          className={`filter-btn ${filter === 'locked' ? 'active' : ''}`}
          onClick={() => setFilter('locked')}
        >
          未解锁
        </button>
      </div>

      <div className="achievements-grid">
        {filteredAchievements.map(achievement => (
          <div
            key={achievement.id}
            className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} rarity-${achievement.rarity}`}
          >
            <div className="achievement-icon">{achievement.icon}</div>
            <div className="achievement-name">{achievement.name}</div>
            <div className="achievement-desc">{achievement.description}</div>
            {!achievement.unlocked && (
              <div className="achievement-progress">
                <div className="progress-text">
                  {achievement.progress} / {achievement.requirementTarget}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (achievement.progress / achievement.requirementTarget) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
            {achievement.unlocked && achievement.coins > 0 && (
              <div className="achievement-reward">+{achievement.coins} ⭐</div>
            )}
            <div className={`rarity-badge rarity-${achievement.rarity}`}>
              {getRarityLabel(achievement.rarity)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getRarityLabel(rarity: string): string {
  const labels: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return labels[rarity] || rarity
}
```

由于响应长度限制，完整文档已保存！现在让我生成最后的重构实施计划：
