# 数据库迁移指南

## 📋 目录
- [迁移概述](#迁移概述)
- [迁移列表](#迁移列表)
- [使用方法](#使用方法)
- [常见问题](#常见问题)

---

## 🔄 迁移概述

本项目使用自定义的数据库迁移系统，基于 PostgreSQL。所有迁移文件位于 `server/src/migrations/` 目录。

### 迁移统计

- **总迁移数**: 46 个
- **数据库表**: 约 60+ 个
- **迁移类型**: 表创建、数据插入、表结构修改

---

## 📝 迁移列表

### 基础功能 (001-010)

| 编号 | 名称 | 说明 |
|------|------|------|
| 001 | create_users | 创建用户表 |
| 002 | create_works | 创建作品表 |
| 003 | create_comments | 创建评论表 |
| 004 | create_likes | 创建点赞表 |
| 005 | create_follows | 创建关注表 |
| 006 | create_diaries | 创建日记表 |
| 007 | create_games | 创建游戏表 |
| 008 | create_achievements | 创建成就表 |
| 009 | create_wishes | 创建愿望表 |
| 010 | create_notifications | 创建通知表 |

### 学习功能 (011-018)

| 编号 | 名称 | 说明 |
|------|------|------|
| 011 | create_assessments | 创建评估表 |
| 012 | create_learning_progress | 创建学习进度表 |
| 013 | create_ai_conversations | 创建AI对话表 |
| 014 | create_ai_generations | 创建AI生成内容表 |
| 015 | update_users_table | 更新用户表结构 |
| 016 | create_game_questions | 创建游戏题目表 |
| 017 | create_advanced_features | 创建高级功能表 |
| 018 | add_more_game_questions | 添加更多游戏题目 |

### 内容管理 (019-028)

| 编号 | 名称 | 说明 |
|------|------|------|
| 019 | create_moderation_system | 创建内容审核系统 |
| 020 | add_last_login | 添加最后登录时间 |
| 021 | add_email_to_users | 添加邮箱字段 |
| 022 | create_encyclopedia | 创建百科表 |
| 023 | create_parent_tables | 创建家长端表 |
| 024 | create_email_verify_codes | 创建邮箱验证码表 |
| 025 | create_reading_progress | 创建阅读进度表 |
| 026 | create_story_play_records | 创建故事播放记录表 |
| 027 | create_conversation_history | 创建对话历史表 |
| 028 | create_community_topics | 创建社区话题表 |

### 高级功能 (029-040)

| 编号 | 名称 | 说明 |
|------|------|------|
| 029 | create_homework_helper | 创建作业辅助表（OCR识别） |
| 030 | create_pk_system | 创建PK对战系统 |
| 031 | create_adaptive_learning | 创建自适应学习系统 |
| 032 | insert_knowledge_points | 插入知识点数据 |
| 033 | create_questions_table | 创建题目表 |
| 034 | insert_sample_questions | 插入示例题目 |
| 035 | create_points_system | 创建积分系统 |
| 036 | insert_points_data | 插入积分规则数据 |
| 037 | create_learning_analytics | 创建学习分析表 |
| 038 | enhance_notification_system | 增强通知系统 |
| 039 | create_learning_plan | 创建学习计划表 |
| 040 | create_skill_tree | 创建技能树表 |

### 扩展功能 (041-046)

| 编号 | 名称 | 说明 |
|------|------|------|
| 041 | create_sms_verify_codes | 创建短信验证码表 |
| 042 | create_feedback | 创建用户反馈表 |
| 043 | create_shop_system | 创建商城系统（道具、装饰、工具） |
| 044 | create_bookmarks_notes | 创建书签和笔记表 |
| 045 | enhance_achievements | 增强成就系统（24个新成就） |
| 046 | create_game_records | 创建游戏记录和排行榜系统 |

---

## 🚀 使用方法

### 1. 查看迁移状态

```bash
cd server
npm run migrate:status
```

输出示例：
```
📊 数据库迁移状态

================================================================================

✅ 已执行: 46/46 个迁移

✅ [001] 001_create_users
✅ [002] 002_create_works
...
⏳ [046] 046_create_game_records

🎉 所有迁移已执行完毕！
```

### 2. 执行待执行的迁移

```bash
npm run migrate
```

### 3. 查看数据库表列表

```bash
npm run migrate:tables
```

### 4. 查看迁移历史

```bash
npm run migrate:history
```

### 5. 回滚最后一次迁移

```bash
npm run migrate:rollback
```

**⚠️ 警告**: 回滚操作会删除数据，请谨慎使用！

---

## 🗄️ 主要数据库表

### 用户相关
- `users` - 用户基础信息
- `user_profiles` - 用户详细资料
- `follows` - 关注关系
- `user_items` - 用户拥有的道具

### 学习相关
- `learning_progress` - 学习进度
- `learning_paths` - 学习路径
- `knowledge_points` - 知识点
- `questions` - 题目库
- `adaptive_learning_records` - 自适应学习记录
- `homework_questions` - 作业题目（OCR识别）

### 内容相关
- `works` - 用户作品
- `comments` - 评论
- `likes` - 点赞
- `diaries` - 日记
- `stories` - 故事
- `encyclopedia_entries` - 百科条目

### 游戏相关
- `games` - 游戏基础信息
- `game_questions` - 游戏题目
- `game_records` - 游戏记录
- `game_statistics` - 游戏统计
- `global_leaderboard` - 全局排行榜
- `pk_matches` - PK对战记录

### 成就与积分
- `achievements` - 成就定义
- `user_achievements` - 用户成就
- `achievement_progress` - 成就进度
- `points_transactions` - 积分交易记录
- `points_rules` - 积分规则

### 社交相关
- `community_topics` - 社区话题
- `notifications` - 通知
- `feedback` - 用户反馈

### 商城系统
- `shop_items` - 商城物品
- `user_items` - 用户物品
- `purchase_history` - 购买历史

### 家长端
- `parent_accounts` - 家长账号
- `parent_child_relations` - 家长-孩子关系
- `parent_settings` - 家长设置

### 验证与安全
- `email_verify_codes` - 邮箱验证码
- `sms_verify_codes` - 短信验证码
- `sms_send_logs` - 短信发送日志

---

## ⚙️ 迁移系统架构

### 文件结构

```
server/src/migrations/
├── migrationRunner.ts      # 迁移运行器核心
├── run.ts                  # 执行迁移脚本
├── rollback.ts             # 回滚脚本
├── status.ts               # 状态查看脚本
├── 001_create_users.ts     # 迁移文件
├── 002_create_works.ts
└── ...
```

### Migration 接口

```typescript
export interface Migration {
  id: string;              // 迁移ID（如 "001"）
  name: string;            // 迁移名称
  up: (client?: PoolClient) => Promise<void>;    // 执行迁移
  down: (client?: PoolClient) => Promise<void>;  // 回滚迁移
}
```

### 迁移记录表

```sql
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 常见问题

### Q1: 如何创建新的迁移？

1. 在 `server/src/migrations/` 创建新文件，命名格式：`047_description.ts`
2. 使用 Migration 接口模板：

```typescript
import { Migration } from './migrationRunner';

export const migration_047_your_feature: Migration = {
  id: '047',
  name: '047_your_feature',
  async up(client) {
    await client!.query(`
      CREATE TABLE IF NOT EXISTS your_table (
        id SERIAL PRIMARY KEY,
        -- 字段定义
      );
    `);
  },
  async down(client) {
    await client!.query('DROP TABLE IF EXISTS your_table CASCADE;');
  }
};
```

3. 在 `run.ts` 中导入并添加到迁移数组

### Q2: 迁移执行失败怎么办？

1. 查看错误信息，确定失败原因
2. 修复迁移文件中的问题
3. 如果迁移已部分执行，手动清理数据库
4. 从 `migrations` 表中删除失败的记录：
   ```sql
   DELETE FROM migrations WHERE name = '046_create_game_records';
   ```
5. 重新执行迁移

### Q3: 如何在生产环境执行迁移？

1. **备份数据库**（非常重要！）
   ```bash
   pg_dump -U username -d qmzg_production > backup_$(date +%Y%m%d).sql
   ```

2. 在测试环境先执行一遍
3. 确认无误后在生产环境执行：
   ```bash
   npm run migrate:status  # 查看状态
   npm run migrate         # 执行迁移
   ```

### Q4: 迁移可以重复执行吗？

可以。所有迁移都使用 `CREATE TABLE IF NOT EXISTS` 和 `INSERT ... ON CONFLICT DO NOTHING`，确保幂等性。

### Q5: 如何处理迁移冲突？

如果多个开发者同时创建迁移：
1. 协调迁移编号，避免重复
2. 按时间顺序合并迁移
3. 更新 `run.ts` 中的迁移列表

---

## 📊 数据库性能优化

### 已创建的索引

迁移系统已自动创建以下类型的索引：

- **主键索引**: 所有表的 `id` 字段
- **外键索引**: 所有关联字段（如 `user_id`）
- **时间索引**: `created_at`, `updated_at` 字段
- **查询索引**: 常用查询字段（如 `status`, `type`）
- **GIN索引**: JSONB 和数组字段（如 `tags`）

### 性能建议

1. **定期 VACUUM**: 清理死元组
   ```sql
   VACUUM ANALYZE;
   ```

2. **监控慢查询**: 启用慢查询日志
   ```sql
   ALTER DATABASE qmzg SET log_min_duration_statement = 1000;
   ```

3. **查看表大小**:
   ```bash
   npm run migrate:tables
   ```

---

## 🔒 安全注意事项

1. **永远不要在生产环境直接修改数据库结构**
2. **所有结构变更必须通过迁移系统**
3. **执行迁移前务必备份数据库**
4. **测试环境先验证迁移**
5. **回滚操作会删除数据，谨慎使用**

---

## 📞 支持

如有问题，请查看：
- [数据库设计文档](./DATABASE_DESIGN.md)
- [API 文档](./API_DOCUMENTATION.md)
- [故障排查指南](./TROUBLESHOOTING.md)

**最后更新**: 2026-02-13
