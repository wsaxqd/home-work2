# 其他核心功能详细分析

## 7. PK对战系统

### 核心功能
**文件：** `server/src/routes/pk.ts`

### 实现原理

#### 7.1 房间管理

**创建房间**
```typescript
POST /api/pk/rooms/create
```

**参数：**
- `gameType` - 游戏类型（速算、成语接龙等）
- `subject` - 学科
- `difficulty` - 难度（1-5）
- `questionCount` - 题目数量（默认10）
- `timeLimit` - 时间限制（秒，默认300）
- `isPrivate` - 是否私密房间

**流程：**
1. 生成6位随机房间码（A-Z0-9）
2. 创建房间记录到 `pk_rooms` 表
3. 创建者自动加入房间（槽位1）
4. 返回房间信息

**加入房间**
```typescript
POST /api/pk/rooms/join
```

**流程：**
1. 通过房间码查找房间
2. 检查房间状态（waiting/playing/finished）
3. 检查是否已满（最多2人）
4. 加入房间（槽位2）
5. 如果房间满员，自动开始游戏

#### 7.2 游戏流程

**开始游戏**
```typescript
POST /api/pk/rooms/:roomId/start
```

**流程：**
1. 检查房间人数（至少2人）
2. 生成题目（从题库或动态生成）
3. 更新房间状态为 `playing`
4. 记录开始时间

**提交答案**
```typescript
POST /api/pk/rooms/:roomId/answer
```

**参数：**
- `questionNumber` - 题目序号
- `answer` - 用户答案
- `answerTime` - 答题时长（毫秒）

**流程：**
1. 验证答案正确性
2. 记录答题结果到 `pk_answers` 表
3. 计算得分：
   - 正确：基础分 + 速度加分
   - 错误：0分
4. 更新参与者分数
5. 检查是否所有题目完成

**结束游戏**
```typescript
POST /api/pk/rooms/:roomId/finish
```

**流程：**
1. 计算最终分数
2. 判定胜负
3. 计算段位分变化
4. 更新用户段位和战绩
5. 保存对战记录

#### 7.3 段位系统

**段位分计算公式**
```typescript
calculateRankChange(winner, myRank, opponentRank, winStreak)
```

**计算逻辑：**
1. **基础分** = 20分
2. **连胜加成**：
   - 连胜3场及以上：+2分/场（最多+20分）
3. **段位差异调整**：
   - 对手段位高：+段位差（最多+10分）
   - 对手段位低：-段位差（最多-5分）
4. **胜负结果**：
   - 胜利：+基础分
   - 失败：-基础分/2（最少-10分）

**段位等级：**
- 青铜（0-999分）
- 白银（1000-1999分）
- 黄金（2000-2999分）
- 铂金（3000-3999分）
- 钻石（4000-4999分）
- 王者（5000+分）

#### 7.4 匹配系统

**快速匹配**
```typescript
POST /api/pk/match/quick
```

**匹配算法：**
1. 查找等待中的公开房间
2. 段位差在±2级以内
3. 优先匹配相同学科和难度
4. 如果没有合适房间，自动创建新房间

**排行榜**
```typescript
GET /api/pk/leaderboard
```

**排名规则：**
- 按段位分降序排列
- 相同分数按胜场数排序
- 显示前100名

---

## 8. AI助手系统

### 核心功能
**文件：** `server/src/routes/aiAssistant.ts`

### 实现原理

#### 8.1 AI学习诊断

**诊断接口**
```typescript
POST /api/ai-assistant/diagnosis
```

**诊断流程：**

1. **获取错题数据**
   - 查询最近30天的错题记录
   - 按学科筛选（可选）

2. **分析薄弱点**
   - 统计各知识点错误次数
   - 计算错误频率
   - 确定优先级：
     - high：错误≥5次
     - medium：错误3-4次
     - low：错误1-2次

3. **计算综合评分**
   ```
   综合评分 = max(60, 100 - 错题总数 × 2)
   ```

4. **生成AI建议**
   - 总结学习情况
   - 推荐学习重点
   - 提供改进建议

**返回数据：**
```json
{
  "overallScore": 85,
  "weaknesses": [
    {
      "area": "分数加减法",
      "errorCount": 8,
      "priority": "high",
      "score": 60
    }
  ],
  "aiSummary": "通过分析你最近30天的学习数据...",
  "aiRecommendations": "建议优先学习：分数加减法、小数运算..."
}
```

#### 8.2 AI学习计划生成

**生成接口**
```typescript
POST /api/ai-assistant/generate-plan
```

**输入参数：**
- `subject` - 学科
- `targetScore` - 目标分数
- `durationDays` - 持续天数（7/14/21天）
- `dailyTime` - 每日学习时长（分钟）

**生成流程：**

1. **获取薄弱点数据**
   - 从诊断结果获取
   - 按优先级排序

2. **计算每日学习量**
   ```
   每日题目数 = 每日时长 / 平均答题时间
   ```

3. **生成每日计划**
   - 前7天：简单题（难度1-2）
   - 8-14天：中等题（难度2-3）
   - 15-21天：困难题（难度3-4）

4. **设置里程碑**
   - 第7天：完成第一周学习（奖励50积分）
   - 第14天：完成两周学习（奖励100积分）
   - 第21天：完成三周学习（奖励200积分）

5. **设置学习目标**
   - 掌握前3个薄弱知识点
   - 目标分数90分

**返回数据：**
```json
{
  "planId": "uuid",
  "title": "21天数学提升计划",
  "dailySchedule": [
    {
      "day": 1,
      "topic": "分数加减法",
      "exercises": [],
      "estimated_time": 30,
      "difficulty": "easy"
    }
  ],
  "milestones": [...],
  "goals": [...]
}
```

#### 8.3 AI对话辅导

**对话接口**
```typescript
POST /api/ai-assistant/chat
```

**功能特点：**
- 苏格拉底式提问（引导思考）
- 上下文记忆（保持对话连贯）
- 多轮对话支持
- 个性化回答

---

## 9. 家长端功能

### 核心功能
**文件：** `server/src/routes/parent.ts`

### 实现原理

#### 9.1 家长认证

**注册流程**
```typescript
POST /api/parent/register
```

**步骤：**
1. 发送邮箱验证码
2. 验证验证码
3. 创建家长账号
4. 绑定孩子账号（通过账号或邀请码）
5. 返回JWT token

**登录流程**
```typescript
POST /api/parent/login
```

**支持方式：**
- 手机号+密码
- 邮箱+密码

#### 9.2 孩子管理

**绑定孩子**
```typescript
POST /api/parent/bind-child
```

**绑定方式：**
1. 通过孩子账号
2. 通过邀请码

**获取孩子列表**
```typescript
GET /api/parent/children
```

**返回信息：**
- 孩子基本信息
- 学习统计
- 最近活动

#### 9.3 学习监控

**获取学习数据**
```typescript
GET /api/parent/learning-data/:userId
```

**数据维度：**
- 学习时长（每日/每周/每月）
- 学习科目分布
- 正确率趋势
- 知识点掌握情况

**获取使用记录**
```typescript
GET /api/parent/usage-records/:userId
```

**记录内容：**
- 活动类型（学习/游戏/创作）
- 活动时长
- 活动内容
- 时间戳

#### 9.4 时间控制

**设置时间限制**
```typescript
POST /api/parent/time-control/:userId
```

**控制维度：**
1. **每日总时长限制**
   - 设置每日最大使用时长
   - 超时自动锁定

2. **时间段限制**
   - 设置可用时间段
   - 例如：周一至周五 18:00-20:00

3. **内容访问控制**
   - 禁用特定功能（游戏/社区等）
   - 设置内容分级

**检查时间限制**
```typescript
GET /api/parent/check-limit/:userId
```

**返回结果：**
```json
{
  "allowed": false,
  "reason": "已超过每日使用时长限制",
  "remainingTime": 0,
  "nextAvailableTime": "2024-01-02 18:00:00"
}
```

#### 9.5 成长报告

**生成报告**
```typescript
GET /api/parent/growth-report/:userId
```

**报告内容：**
1. **学习概况**
   - 总学习时长
   - 完成题目数
   - 平均正确率

2. **进步分析**
   - 各科目进步情况
   - 知识点掌握度变化
   - 学习习惯分析

3. **薄弱点提醒**
   - 需要加强的知识点
   - 改进建议

4. **成就展示**
   - 获得的勋章
   - 完成的里程碑
   - 排名变化

---

## 10. 游戏系统

### 核心功能
**文件：** `server/src/routes/games.ts`

### 实现原理

#### 10.1 游戏题目管理

**获取题目**
```typescript
GET /api/games/questions?gameType=math&difficulty=2&limit=10
```

**题目类型：**
- `expression` - 表情识别
- `image_recognition` - 图片识别
- `math_speed` - 速算
- `idiom_chain` - 成语接龙
- `english_spelling` - 英语拼写
- `science_quiz` - 科学问答
- `memory_card` - 记忆卡片

**题目生成：**
- 从题库随机抽取
- 根据难度筛选
- 避免重复（记录最近做过的题）

**验证答案**
```typescript
POST /api/games/verify-answer
```

**返回：**
- 是否正确
- 正确答案
- 解析说明

#### 10.2 成绩记录

**保存成绩**
```typescript
POST /api/games/score
```

**记录内容：**
- 游戏类型
- 分数
- 关卡
- 正确率
- 游戏时长

**获取进度**
```typescript
GET /api/games/progress?gameType=math
```

**返回数据：**
- 当前关卡
- 最高分数
- 总游戏次数
- 平均正确率

#### 10.3 排行榜系统

**获取排行榜**
```typescript
GET /api/games/leaderboard?gameType=math&limit=100
```

**排名规则：**
- 按最高分降序
- 相同分数按时间先后
- 显示用户昵称、头像、分数

**获取个人排名**
```typescript
GET /api/games/rank?gameType=math
```

**返回：**
- 当前排名
- 超越百分比
- 与前一名的分差

#### 10.4 游戏历史

**获取历史记录**
```typescript
GET /api/games/history?gameType=math&page=1&pageSize=20
```

**记录内容：**
- 游戏时间
- 分数
- 关卡
- 正确率
- 用时

---

## 11. 社区功能

### 核心功能
**文件：** `server/src/routes/community.ts`

### 实现原理

#### 11.1 帖子系统

**发布帖子**
```typescript
POST /api/community/posts
```

**内容：**
- 标题（可选）
- 正文内容
- 图片（最多9张）
- 话题标签

**获取帖子列表**
```typescript
GET /api/community/posts?page=1&limit=10
```

**排序方式：**
- 最新发布
- 最多点赞
- 最多评论

**帖子详情**
```typescript
GET /api/community/posts/:id
```

**包含：**
- 帖子内容
- 作者信息
- 点赞数、评论数
- 是否已点赞
- 评论列表

#### 11.2 互动功能

**点赞/取消点赞**
```typescript
POST /api/community/posts/:id/like
DELETE /api/community/posts/:id/like
```

**评论**
```typescript
POST /api/community/posts/:id/comments
```

**评论内容：**
- 评论文本
- 回复对象（可选）
- @提及用户

**删除评论**
```typescript
DELETE /api/community/comments/:id
```

**权限：**
- 评论作者可删除
- 帖子作者可删除任何评论

#### 11.3 话题系统

**获取话题列表**
```typescript
GET /api/community/topics
```

**话题分类：**
- 学习交流
- 作品展示
- 问题求助
- 趣味分享

**话题详情**
```typescript
GET /api/community/topics/:id
```

**包含：**
- 话题信息
- 参与人数
- 帖子数量
- 热门帖子

#### 11.4 心愿墙

**发布心愿**
```typescript
POST /api/community/wishes
```

**心愿内容：**
- 心愿文本
- 心愿类别（学习/生活/梦想）
- 目标日期

**获取心愿墙**
```typescript
GET /api/community/wishes?status=pending
```

**心愿状态：**
- `pending` - 进行中
- `achieved` - 已实现
- `expired` - 已过期

**支持心愿**
```typescript
POST /api/community/wishes/:id/support
```

**支持方式：**
- 点赞鼓励
- 留言祝福
- 分享传播

---

## 12. 积分商城系统

### 核心功能
**文件：** `server/src/routes/points.ts`

### 实现原理

#### 12.1 积分管理

**获取积分信息**
```typescript
GET /api/points/info
```

**返回数据：**
- 当前积分
- 累计获得积分
- 累计消费积分
- 等级信息

**积分记录**
```typescript
GET /api/points/records?filter=earn&limit=50
```

**记录类型：**
- `earn` - 获得积分
- `spend` - 消费积分

**获得积分途径：**
- 每日签到：+10分
- 完成学习任务：+20-50分
- 游戏通关：+30分
- 发布作品：+15分
- 帮助他人：+5分
- 连续学习：+额外奖励

#### 12.2 等级系统

**等级配置**
```typescript
GET /api/points/levels
```

**等级划分：**
- Lv1：0-99分（新手）
- Lv2：100-299分（初学者）
- Lv3：300-599分（学习者）
- Lv4：600-999分（进阶者）
- Lv5：1000-1999分（优秀者）
- Lv6：2000-3999分（卓越者）
- Lv7：4000-6999分（大师）
- Lv8：7000-9999分（宗师）
- Lv9：10000+分（传奇）

**等级特权：**
- 专属头像框
- 昵称颜色
- 商城折扣
- 优先匹配

#### 12.3 商城系统

**商品分类：**
- 学习道具（提示卡、时间卡）
- 装饰物品（头像框、称号）
- 虚拟礼物
- 实物奖品

**获取商品列表**
```typescript
GET /api/points/shop/items?category=props
```

**商品信息：**
- 商品名称、描述
- 所需积分
- 库存数量
- 兑换限制

**兑换商品**
```typescript
POST /api/points/shop/exchange
```

**兑换流程：**
1. 检查积分是否足够
2. 检查库存是否充足
3. 检查兑换限制（每日/每周）
4. 扣除积分
5. 发放商品
6. 记录兑换记录

**使用道具**
```typescript
POST /api/points/shop/use/:exchangeId
```

**道具效果：**
- 提示卡：显示题目提示
- 时间卡：延长答题时间
- 双倍卡：双倍积分奖励

#### 12.4 商城统计

**热门商品**
```typescript
GET /api/points/shop/hot?limit=10
```

**排序依据：**
- 兑换次数
- 最近7天兑换量

**新品推荐**
```typescript
GET /api/points/shop/new?limit=10
```

**筛选条件：**
- 上架时间<30天
- 按上架时间降序

---

## 13. 作业辅导系统

### 核心功能
**文件：** `server/src/routes/homework.ts`, `server/src/routes/wrongQuestions.ts`

### 实现原理

#### 13.1 作业识别

**上传题目**
```typescript
POST /api/homework/upload
Content-Type: multipart/form-data
```

**识别流程：**
1. 接收图片文件
2. 调用OCR识别文字
3. 调用AI识别题目类型
4. 提取题目内容
5. 保存到数据库

**支持题型：**
- 数学计算题
- 应用题
- 语文阅读理解
- 英语翻译
- 科学问答

#### 13.2 AI解答

**获取答案**
```typescript
POST /api/homework/answer/:questionId
```

**解答方式：**

1. **直接答案模式**
   - 给出正确答案
   - 简要解析

2. **苏格拉底式讲解**
   ```typescript
   POST /api/homework/socratic-explain/:questionId
   ```
   - 通过提问引导思考
   - 不直接给答案
   - 培养独立思考能力

3. **分步讲解**
   ```typescript
   POST /api/homework/step-by-step/:questionId
   ```
   - 详细步骤拆解
   - 每步都有说明
   - 适合复杂题目

**AI讲解特点：**
- 根据年级调整语言难度
- 结合知识点讲解
- 提供相似题目练习

#### 13.3 错题本系统

**添加错题**
```typescript
POST /api/wrong-questions
```

**错题信息：**
- 题目内容
- 正确答案
- 用户答案
- 错误类型（概念错误/计算错误/粗心）
- 知识点标签
- 难度等级

**错题管理**
```typescript
GET /api/wrong-questions?subject=math&masteredFilter=false
```

**筛选条件：**
- 按学科筛选
- 按掌握状态筛选
- 按错误次数排序

**错题复习**
```typescript
POST /api/wrong-questions/:id/review
```

**复习机制：**
1. **间隔重复算法**
   - 第1次：1天后复习
   - 第2次：3天后复习
   - 第3次：7天后复习
   - 第4次：15天后复习
   - 第5次：30天后复习

2. **掌握度判定**
   - 连续3次答对 → 标记为已掌握
   - 答错 → 重置复习计划

#### 13.4 知识点薄弱分析

**薄弱点统计**
```typescript
GET /api/wrong-questions/weakness-analysis
```

**分析维度：**
- 各知识点错误次数
- 错误率排名
- 改进建议

**返回数据：**
```json
{
  "weaknesses": [
    {
      "knowledgePoint": "分数加减法",
      "wrongCount": 8,
      "totalCount": 10,
      "errorRate": 0.8,
      "priority": "high",
      "recommendation": "建议重点复习分数通分和约分"
    }
  ]
}
```

---

## 总结

### 系统特点

#### 1. **智能化**
- AI自适应学习推荐
- AI作业辅导
- AI学习诊断
- 智能匹配系统

#### 2. **游戏化**
- PK对战系统
- 积分奖励机制
- 等级成长体系
- 排行榜竞争

#### 3. **社交化**
- 社区互动
- 心愿墙
- 作品分享
- 好友系统

#### 4. **家长监控**
- 学习数据监控
- 时间控制
- 内容过滤
- 成长报告

#### 5. **个性化**
- 个性化学习路径
- 自适应难度调整
- 错题本管理
- 薄弱点诊断

### 技术亮点

1. **实时对战** - WebSocket实现实时PK
2. **图像识别** - OCR识别作业题目
3. **AI对话** - 苏格拉底式教学
4. **间隔重复** - 科学的复习算法
5. **段位系统** - 动态ELO评分
6. **积分经济** - 完整的虚拟经济体系

### 数据库设计

**核心表：**
- `pk_rooms` - PK房间
- `pk_participants` - 参与者
- `pk_answers` - 答题记录
- `wrong_questions` - 错题本
- `knowledge_weakness` - 知识点薄弱分析
- `points_records` - 积分记录
- `shop_items` - 商城商品
- `shop_exchanges` - 兑换记录
- `community_posts` - 社区帖子
- `community_comments` - 评论
- `wishes` - 心愿墙

这是一个功能完整、设计精良的儿童教育平台！
