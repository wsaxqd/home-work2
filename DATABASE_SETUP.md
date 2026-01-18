# 数据库设置指南

## 方案1: 使用Docker (推荐)

### 步骤1: 启动Docker Desktop

确保Docker Desktop正在运行

### 步骤2: 启动PostgreSQL数据库

```bash
# 使用开发环境配置启动
docker-compose -f docker-compose.dev.yml up -d

# 查看日志确认启动成功
docker-compose -f docker-compose.dev.yml logs -f postgres
```

### 步骤3: 运行数据库迁移

```bash
cd server
bash run-migrations.sh
```

或者使用npm脚本:

```bash
cd server
npm run migrate
```

### 步骤4: 验证数据库

```bash
# 进入数据库容器
docker exec -it qmzg-postgres-dev psql -U admin -d qmzg

# 查看所有表
\dt

# 退出
\q
```

---

## 方案2: 本地PostgreSQL安装

如果你已经安装了PostgreSQL,可以直接使用:

### 步骤1: 创建数据库

```bash
# 使用psql创建数据库
psql -U postgres -c "CREATE DATABASE qmzg;"
psql -U postgres -c "CREATE USER admin WITH ENCRYPTED PASSWORD 'dev_password_123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE qmzg TO admin;"
```

### 步骤2: 更新server/.env配置

```env
DB_HOST=localhost
DB_PORT=5432  # 注意: 本地默认端口是5432，不是5433
DB_NAME=qmzg
DB_USER=admin
DB_PASSWORD=dev_password_123
```

### 步骤3: 运行迁移

```bash
cd server
bash run-migrations.sh
```

---

## 数据库Schema说明

已创建的数据库表(共40+张表):

### 核心表:
- **users** - 用户(儿童)信息
- **parents** - 家长信息  
- **parental_controls** - 家长控制设置
- **user_preferences** - 用户偏好设置
- **refresh_tokens** - 刷新令牌

### 创作与作品:
- **works** - 作品
- **work_likes** - 作品点赞
- **work_comments** - 作品评论
- **favorites** - 收藏
- **creation_drafts** - 创作草稿
- **ai_generation_history** - AI生成历史

### 情感与日记:
- **diaries** - 日记
- **mood_tracking** - 情绪追踪
- **wishes** - 心愿
- **conversation_history** - AI对话历史

### 游戏与学习:
- **game_records** - 游戏记录
- **game_leaderboard** - 游戏排行榜
- **story_play_records** - 故事播放记录
- **reading_progress** - 阅读进度
- **assessments** - 测评记录
- **learning_progress** - 学习进度

### 社区与互动:
- **community_posts** - 社区帖子
- **community_comments** - 社区评论
- **community_likes** - 社区点赞
- **user_follows** - 关注关系

### 成就与奖励:
- **achievements** - 成就
- **user_achievements** - 用户成就
- **points_history** - 积分历史

### 统计与监控:
- **daily_usage_stats** - 每日使用统计
- **screen_time_sessions** - 屏幕时间会话
- **user_activity_logs** - 用户活动日志

### 通知与消息:
- **notifications** - 通知
- **family_messages** - 家庭消息

### 其他:
- **content_reports** - 内容举报

---

## 常见问题

### Q: Docker启动失败怎么办?

A: 
1. 确保Docker Desktop已安装并运行
2. 检查5433端口是否被占用: `netstat -ano | findstr :5433`
3. 如果端口被占用,修改docker-compose.dev.yml中的端口映射

### Q: 迁移失败怎么办?

A:
1. 检查数据库连接: `docker exec -it qmzg-postgres-dev psql -U admin -d qmzg`
2. 查看详细错误日志
3. 如需重置数据库:
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d
   ```

### Q: 如何备份数据库?

A:
```bash
# Docker方式
docker exec qmzg-postgres-dev pg_dump -U admin qmzg > backup.sql

# 本地方式
pg_dump -U admin -h localhost -p 5433 qmzg > backup.sql
```

### Q: 如何恢复数据库?

A:
```bash
# Docker方式
cat backup.sql | docker exec -i qmzg-postgres-dev psql -U admin -d qmzg

# 本地方式
psql -U admin -h localhost -p 5433 qmzg < backup.sql
```

---

## 下一步

数据库设置完成后,请参考 [DIFY_SETUP.md](./DIFY_SETUP.md) 配置AI服务
