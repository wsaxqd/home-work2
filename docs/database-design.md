# 启蒙之光 - 数据库设计文档

## 项目概述
本文档描述了"启蒙之光"AI通用教育平台的完整数据库设计。

## 数据库信息
- **数据库类型**: PostgreSQL
- **字符集**: UTF-8
- **迁移工具**: 自定义TypeScript迁移系统

---

## 📋 数据表清单

| 序号 | 表名 | 说明 | 迁移文件 |
|------|------|------|----------|
| 1 | users | 用户信息表 | 001_create_users.ts |
| 2 | works | 作品表 | 002_create_works.ts |
| 3 | comments | 评论表 | 003_create_comments.ts |
| 4 | likes | 点赞表 | 004_create_likes.ts |
| 5 | follows | 关注关系表 | 005_create_follows.ts |
| 6 | diaries | 日记表 | 006_create_diaries.ts |
| 7 | games | 游戏记录表 | 007_create_games.ts |
| 8 | achievements | 成就表 | 008_create_achievements.ts |
| 9 | wishes | 心愿表 | 009_create_wishes.ts |
| 10 | notifications | 通知表 | 010_create_notifications.ts |
| 11 | questions | 题目表 | 011_create_assessments.ts |
| 12 | assessment_records | 评估记录表 | 011_create_assessments.ts |
| 13 | learning_progress | 学习进度表 | 012_create_learning_progress.ts |

---

## 📊 表结构详细设计

### 1. users - 用户信息表

**表说明**: 存储系统用户的基本信息

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 用户ID |
| phone | VARCHAR(20) | NOT NULL, UNIQUE | - | 手机号（登录账号） |
| password | VARCHAR(255) | NOT NULL | - | 加密后的密码 |
| nickname | VARCHAR(50) | - | - | 用户昵称 |
| avatar | VARCHAR(255) | - | - | 头像URL |
| bio | TEXT | - | - | 个人简介 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- `idx_users_phone` - phone字段索引，加速登录查询

**约束**:
- phone字段必须唯一，用于用户登录
- password必须经过bcrypt加密后存储

---

### 2. works - 作品表

**表说明**: 存储用户创作的各类作品（故事、音乐、绘画、诗歌）

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 作品ID |
| user_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 作者ID |
| type | work_type | NOT NULL | - | 作品类型 |
| title | VARCHAR(100) | NOT NULL | - | 作品标题 |
| content | TEXT | - | - | 作品内容 |
| cover_image | VARCHAR(255) | - | - | 封面图片URL |
| audio_url | VARCHAR(255) | - | - | 音频文件URL |
| status | work_status | - | 'draft' | 作品状态 |
| like_count | INTEGER | - | 0 | 点赞数 |
| comment_count | INTEGER | - | 0 | 评论数 |
| view_count | INTEGER | - | 0 | 浏览数 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 更新时间 |
| published_at | TIMESTAMP | - | - | 发布时间 |

**枚举类型**:
- `work_type`: 'story' | 'music' | 'art' | 'poem'
- `work_status`: 'draft' | 'published' | 'archived'

**索引**:
- `idx_works_user_id` - 用户ID索引
- `idx_works_type` - 作品类型索引
- `idx_works_status` - 作品状态索引
- `idx_works_created_at` - 创建时间降序索引

**外键关系**:
- user_id → users(id) - 级联删除

---

### 3. comments - 评论表

**表说明**: 存储作品的评论和回复

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 评论ID |
| work_id | UUID | NOT NULL, FK(works.id) ON DELETE CASCADE | - | 作品ID |
| user_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 评论者ID |
| content | TEXT | NOT NULL | - | 评论内容 |
| parent_id | UUID | FK(comments.id) ON DELETE CASCADE | - | 父评论ID（回复） |
| like_count | INTEGER | - | 0 | 点赞数 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- `idx_comments_work_id` - 作品ID索引
- `idx_comments_user_id` - 用户ID索引
- `idx_comments_parent_id` - 父评论ID索引

**外键关系**:
- work_id → works(id) - 级联删除
- user_id → users(id) - 级联删除
- parent_id → comments(id) - 级联删除（回复评论）

---

### 4. likes - 点赞表

**表说明**: 记录用户对作品的点赞关系

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 点赞ID |
| work_id | UUID | NOT NULL, FK(works.id) ON DELETE CASCADE | - | 作品ID |
| user_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 用户ID |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 点赞时间 |

**唯一约束**:
- UNIQUE(work_id, user_id) - 防止重复点赞

**索引**:
- `idx_likes_work_id` - 作品ID索引
- `idx_likes_user_id` - 用户ID索引

**外键关系**:
- work_id → works(id) - 级联删除
- user_id → users(id) - 级联删除

---

### 5. follows - 关注关系表

**表说明**: 记录用户之间的关注关系

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 关系ID |
| follower_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 关注者ID |
| following_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 被关注者ID |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 关注时间 |

**唯一约束**:
- UNIQUE(follower_id, following_id) - 防止重复关注

**索引**:
- `idx_follows_follower_id` - 关注者ID索引
- `idx_follows_following_id` - 被关注者ID索引

**外键关系**:
- follower_id → users(id) - 级联删除
- following_id → users(id) - 级联删除

**约束**:
- follower_id ≠ following_id（不能关注自己）

---

### 6. diaries - 日记表

**表说明**: 存储用户的成长日记

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 日记ID |
| user_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 用户ID |
| title | VARCHAR(100) | - | - | 日记标题 |
| content | TEXT | NOT NULL | - | 日记内容 |
| mood | mood_type | - | - | 心情 |
| weather | VARCHAR(20) | - | - | 天气 |
| images | JSONB | - | - | 图片数组 |
| is_private | BOOLEAN | - | false | 是否私密 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 更新时间 |

**枚举类型**:
- `mood_type`: 'happy' | 'sad' | 'excited' | 'calm' | 'anxious' | 'angry' | 'surprised'

**索引**:
- `idx_diaries_user_id` - 用户ID索引
- `idx_diaries_created_at` - 创建时间降序索引

**外键关系**:
- user_id → users(id) - 级联删除

---

### 7. games - 游戏记录表

**表说明**: 记录用户的游戏成绩和进度

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 记录ID |
| user_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 用户ID |
| game_type | game_type | NOT NULL | - | 游戏类型 |
| score | INTEGER | NOT NULL | - | 得分 |
| level | INTEGER | - | 1 | 关卡/难度 |
| accuracy | DECIMAL(5,2) | - | - | 准确率(%) |
| duration | INTEGER | - | - | 用时(秒) |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**枚举类型**:
- `game_type`: 'image_recognition' | 'expression_recognition' | 'music_rhythm' | 'story_continuation'

**索引**:
- `idx_games_user_id` - 用户ID索引
- `idx_games_game_type` - 游戏类型索引
- `idx_games_score` - 得分降序索引（排行榜）

**外键关系**:
- user_id → users(id) - 级联删除

**约束**:
- score >= 0
- level >= 1
- accuracy BETWEEN 0 AND 100

---

### 8. achievements - 成就表

**表说明**: 定义系统中的所有成就和用户获得的成就记录

**8.1 achievement_definitions - 成就定义表**

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 成就ID |
| code | VARCHAR(50) | NOT NULL, UNIQUE | - | 成就代码 |
| name | VARCHAR(100) | NOT NULL | - | 成就名称 |
| description | TEXT | - | - | 成就描述 |
| icon | VARCHAR(255) | - | - | 图标URL |
| category | achievement_category | NOT NULL | - | 成就类别 |
| points | INTEGER | - | 100 | 奖励积分 |
| condition_type | VARCHAR(50) | - | - | 条件类型 |
| condition_value | INTEGER | - | - | 条件值 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**8.2 user_achievements - 用户成就表**

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 记录ID |
| user_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 用户ID |
| achievement_id | UUID | NOT NULL, FK(achievement_definitions.id) | - | 成就ID |
| progress | INTEGER | - | 0 | 当前进度 |
| achieved | BOOLEAN | - | false | 是否已获得 |
| achieved_at | TIMESTAMP | - | - | 获得时间 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**枚举类型**:
- `achievement_category`: 'creation' | 'learning' | 'social' | 'game' | 'special'

**索引**:
- `idx_achievement_definitions_code` - 成就代码索引
- `idx_user_achievements_user_id` - 用户ID索引
- `idx_user_achievements_achievement_id` - 成就ID索引

---

### 9. wishes - 心愿表

**表说明**: 存储用户发布的心愿

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 心愿ID |
| user_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 用户ID |
| content | TEXT | NOT NULL | - | 心愿内容 |
| support_count | INTEGER | - | 0 | 支持数 |
| status | wish_status | - | 'pending' | 心愿状态 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| fulfilled_at | TIMESTAMP | - | - | 实现时间 |

**枚举类型**:
- `wish_status`: 'pending' | 'in_progress' | 'fulfilled'

**索引**:
- `idx_wishes_user_id` - 用户ID索引
- `idx_wishes_status` - 状态索引
- `idx_wishes_support_count` - 支持数降序索引

**外键关系**:
- user_id → users(id) - 级联删除

---

### 10. notifications - 通知表

**表说明**: 存储系统通知和用户消息

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 通知ID |
| user_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 接收用户ID |
| type | notification_type | NOT NULL | - | 通知类型 |
| title | VARCHAR(100) | NOT NULL | - | 通知标题 |
| content | TEXT | - | - | 通知内容 |
| link | VARCHAR(255) | - | - | 相关链接 |
| is_read | BOOLEAN | - | false | 是否已读 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**枚举类型**:
- `notification_type`: 'system' | 'comment' | 'like' | 'follow' | 'achievement'

**索引**:
- `idx_notifications_user_id` - 用户ID索引
- `idx_notifications_is_read` - 已读状态索引
- `idx_notifications_created_at` - 创建时间降序索引

**外键关系**:
- user_id → users(id) - 级联删除

---

### 11. questions - 题目表

**表说明**: 存储AI知识评估的题目

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 题目ID |
| category | question_category | NOT NULL | - | 题目分类 |
| type | question_type | NOT NULL | - | 题目类型 |
| content | TEXT | NOT NULL | - | 题目内容 |
| options | JSONB | - | - | 选项（JSON数组） |
| correct_answer | JSONB | NOT NULL | - | 正确答案 |
| explanation | TEXT | - | - | 答案解析 |
| difficulty | INTEGER | CHECK(1-5) | 1 | 难度等级 |
| points | INTEGER | - | 10 | 分值 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**枚举类型**:
- `question_type`: 'single' | 'multiple' | 'truefalse'
- `question_category`: 'ai_basics' | 'ai_application' | 'ai_ethics' | 'ai_future'

**索引**:
- `idx_questions_category` - 题目分类索引

**约束**:
- difficulty BETWEEN 1 AND 5

---

### 12. assessment_records - 评估记录表

**表说明**: 记录用户的评估测试结果

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 记录ID |
| user_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 用户ID |
| total_questions | INTEGER | NOT NULL | - | 总题数 |
| correct_count | INTEGER | NOT NULL | - | 正确题数 |
| score | INTEGER | NOT NULL | - | 总分 |
| duration | INTEGER | - | - | 用时(秒) |
| answers | JSONB | - | - | 答题记录 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- `idx_assessment_records_user_id` - 用户ID索引

**外键关系**:
- user_id → users(id) - 级联删除

---

### 13. learning_progress - 学习进度表

**表说明**: 跟踪用户的学习进度和成长轨迹

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|---------|------|--------|------|
| id | UUID | PRIMARY KEY | gen_random_uuid() | 记录ID |
| user_id | UUID | NOT NULL, FK(users.id) ON DELETE CASCADE | - | 用户ID |
| module | VARCHAR(50) | NOT NULL | - | 学习模块 |
| progress | INTEGER | CHECK(0-100) | 0 | 进度百分比 |
| completed | BOOLEAN | - | false | 是否完成 |
| last_accessed_at | TIMESTAMP | - | - | 最后访问时间 |
| completed_at | TIMESTAMP | - | - | 完成时间 |
| created_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | CURRENT_TIMESTAMP | 更新时间 |

**唯一约束**:
- UNIQUE(user_id, module) - 每个用户每个模块只有一条记录

**索引**:
- `idx_learning_progress_user_id` - 用户ID索引
- `idx_learning_progress_module` - 模块索引

**外键关系**:
- user_id → users(id) - 级联删除

**约束**:
- progress BETWEEN 0 AND 100

---

## 🔗 数据库关系图

```
users (用户)
  ├─→ works (作品) [1:N]
  ├─→ comments (评论) [1:N]
  ├─→ likes (点赞) [1:N]
  ├─→ follows (关注) [1:N - follower]
  ├─→ follows (被关注) [1:N - following]
  ├─→ diaries (日记) [1:N]
  ├─→ games (游戏记录) [1:N]
  ├─→ user_achievements (成就) [1:N]
  ├─→ wishes (心愿) [1:N]
  ├─→ notifications (通知) [1:N]
  ├─→ assessment_records (评估记录) [1:N]
  └─→ learning_progress (学习进度) [1:N]

works (作品)
  ├─→ comments (评论) [1:N]
  └─→ likes (点赞) [1:N]

comments (评论)
  └─→ comments (回复) [1:N - 自关联]
```

---

## 📝 数据库迁移说明

### 迁移文件命名规范
```
{序号}_{描述}.ts
例: 001_create_users.ts
```

### 执行迁移
```bash
# 执行所有待执行的迁移
npm run migrate

# 回滚上一次迁移
npm run migrate:rollback
```

### 迁移跟踪
系统使用 `migrations` 表跟踪已执行的迁移：
```sql
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  migration_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔒 数据安全

### 密码安全
- 使用 bcrypt 加密，salt rounds: 10
- 永不存储明文密码

### 数据隐私
- 用户可设置日记为私密(is_private)
- 删除用户时级联删除所有相关数据

### 索引优化
- 所有外键字段均建立索引
- 高频查询字段建立索引
- 时间字段使用降序索引优化分页查询

---

## 📊 数据统计字段

部分表包含统计字段，需在应用层维护：
- `works.like_count` - 点赞数
- `works.comment_count` - 评论数
- `works.view_count` - 浏览数
- `comments.like_count` - 评论点赞数
- `wishes.support_count` - 心愿支持数

建议使用数据库触发器或应用层事务保证一致性。

---

## 🎯 设计原则

1. **规范化**: 遵循第三范式，减少数据冗余
2. **可扩展性**: 使用枚举类型便于扩展新类型
3. **性能优化**: 合理使用索引，优化查询性能
4. **数据完整性**: 使用外键约束保证引用完整性
5. **软删除**: 重要数据可考虑增加deleted_at字段实现软删除
6. **审计跟踪**: created_at、updated_at记录数据变更时间

---

**文档版本**: v1.0
**最后更新**: 2024-12-21
**维护者**: AI Assistant
