# 学习系统核心功能详细分析

## 1. 知识图谱系统

### 核心功能
**文件：** `server/src/services/knowledgeGraphService.ts`

### 实现原理

#### 1.1 知识图谱构建
```typescript
getKnowledgeGraph(subject, grade, userId)
```

**步骤：**
1. **获取知识点** - 从 `knowledge_graph` 表查询指定学科和年级的所有知识点
2. **获取用户掌握情况** - 从 `learning_behavior_analysis` 表查询用户对每个知识点的掌握度
3. **构建节点数据** - 包含：
   - 知识点基本信息（ID、名称、描述、难度）
   - 父知识点（前置依赖）
   - 相关知识点
   - 题目数量、标签、资源
   - 用户掌握度（0-1）、掌握等级（0-5）、正确率
4. **构建关系边** - 两种关系：
   - `prerequisite`（前置依赖）：父知识点 → 子知识点
   - `related`（相关知识）：知识点 ↔ 相关知识点

#### 1.2 掌握度计算
- **掌握进度** = 掌握等级 / 5
- **掌握等级** (0-5)：基于答题记录计算
- **正确率**：正确题数 / 总题数

#### 1.3 知识点详情
```typescript
getKnowledgePoint(id, userId)
```

**返回信息：**
- 知识点基本信息
- 前置知识点列表（需要先学习的）
- 后续知识点列表（学完后可以学的）
- 相关知识点列表
- 用户学习统计（总题数、正确数、错误数、正确率、平均答题时间）
- 学习资源（视频、文章、练习题）

---

## 2. 自适应推荐算法

### 核心功能
**文件：** `server/src/services/adaptiveLearningService.ts`

### 实现原理

#### 2.1 个性化学习路径生成
```typescript
generateLearningPath(userId, subject, grade, goal, timeConstraint, dailyTimeLimit)
```

**算法流程：**

1. **获取知识图谱** - 包含用户掌握情况
2. **获取学习行为数据** - 用户历史学习记录
3. **根据目标选择知识点**：
   - `improve_weak_points`（薄弱点强化）：选择掌握度低的知识点
   - `review_all`（全面复习）：选择所有已学知识点
   - `advance_learning`（新知识学习）：选择未学习的知识点
4. **拓扑排序** - 确保前置知识点先学习
5. **分配学习资源和时间**：
   - 未学习（掌握度0）：40分钟，完整资源
   - 薄弱（掌握度1-2）：30分钟，练习资源
   - 一般（掌握度3）：20分钟，复习资源
   - 良好（掌握度4-5）：10分钟，巩固资源
6. **生成学习步骤** - 每个步骤包含：
   - 知识点信息
   - 学习资源（视频、文章、练习）
   - 预计时长
   - 学习原因

#### 2.2 自适应题目推荐
```typescript
getAdaptiveQuestions(userId, knowledgePointId, count)
```

**推荐策略：**

1. **获取用户掌握度** - 从学习行为分析获取
2. **根据掌握度选择难度**：
   - 掌握度 0-1：简单题（难度1-2）
   - 掌握度 2-3：中等题（难度2-3）
   - 掌握度 4-5：困难题（难度3-5）
3. **避免重复** - 排除最近做过的题目
4. **难度递进** - 答对后逐渐增加难度

#### 2.3 学习推荐系统
```typescript
getRecommendations(userId, limit)
```

**推荐优先级：**

1. **优先级5（最高）** - 薄弱知识点（掌握度<3，正确率<60%）
2. **优先级4** - 需要复习的知识点（7天未练习）
3. **优先级3** - 前置知识点未掌握
4. **优先级2** - 拓展学习（相关知识点）

---

## 3. AI学习计划生成

### 核心功能
**文件：** `server/src/services/learningPlanService.ts`

### 实现原理

#### 3.1 AI生成学习计划
```typescript
generateAIPlan(userId, preferences)
```

**输入参数：**
- `subjects`：目标学科
- `daily_time`：每日学习时长（分钟）
- `difficulty_level`：难度等级（1-5）
- `start_date`：开始日期
- `duration_days`：持续天数

**生成流程：**

1. **获取用户能力评估** - 分析用户各学科技能掌握情况
2. **计算结束日期** - 开始日期 + 持续天数
3. **创建学习计划** - 保存到 `learning_plans` 表
4. **生成每日任务**：
   - 根据每日时长分配任务
   - 根据难度等级选择内容
   - 根据能力评估优先安排薄弱项
5. **任务类型**：
   - `video`：观看教学视频
   - `practice`：练习题目
   - `review`：复习知识点
   - `test`：测试评估

#### 3.2 计划管理
- **创建计划** - 手动或AI生成
- **获取计划列表** - 按状态筛选（active/paused/completed）
- **获取计划详情** - 包含所有任务
- **添加任务** - 动态添加学习任务
- **完成任务** - 记录完成情况和成绩
- **暂停/恢复** - 灵活控制计划状态
- **删除计划** - 清理无用计划

---

## 4. 学习行为分析

### 核心功能
**文件：** `server/src/services/learningBehaviorService.ts`

### 实现原理

#### 4.1 答题行为记录
```typescript
recordQuestionAttempt(data)
```

**记录内容：**
- 用户ID、题目ID、知识点ID
- 难度等级、答案、是否正确
- 答题时长、是否使用提示、尝试次数

**处理流程：**
1. **记录答题记录** - 保存到 `question_attempts` 表
2. **更新学习行为分析** - 更新统计数据
3. **计算掌握度** - 实时计算知识点掌握度

#### 4.2 学习行为分析更新
```typescript
updateLearningBehavior(userId, knowledgePointId, isCorrect, answerTime)
```

**更新指标：**
- **总题数** - 累加
- **正确数/错误数** - 分别累加
- **平均答题时间** - 加权平均
- **最快/最慢答题时间** - 更新极值
- **连续答对/答错次数** - 重置或累加
- **练习天数** - 统计不同日期的练习次数

#### 4.3 掌握度计算
```typescript
calculateMasteryLevel(userId, knowledgePointId)
```

**计算公式：**
```
掌握度 = (正确率 × 0.5) + (练习量因子 × 0.3) + (时间因子 × 0.2)

其中：
- 正确率 = 正确数 / 总题数
- 练习量因子 = min(总题数 / 20, 1)  // 20题为满分
- 时间因子 = min(练习天数 / 7, 1)   // 7天为满分
```

**掌握等级（0-5）：**
- 0：未学习
- 1：初步了解（掌握度 < 0.3）
- 2：基本掌握（掌握度 0.3-0.5）
- 3：熟练掌握（掌握度 0.5-0.7）
- 4：精通（掌握度 0.7-0.9）
- 5：专家（掌握度 >= 0.9）

#### 4.4 薄弱点检测
```typescript
detectWeakPoints(userId, subject)
```

**检测条件：**
- 总题数 >= 5（有足够样本）
- 正确率 < 60%（低于及格线）
- 掌握度 < 3（未熟练掌握）

**返回信息：**
- 知识点ID和名称
- 正确率、掌握度
- 建议练习题数

#### 4.5 学习报告生成
```typescript
generateLearningReport(userId, subject, timeRange)
```

**报告内容：**
- **总体统计**：总题数、正确率、学习时长、练习天数
- **知识点掌握情况**：各知识点的掌握度和正确率
- **薄弱点分析**：需要加强的知识点
- **学习趋势**：每日正确率和学习时长曲线

---

## 5. 关卡解锁机制

### 核心功能
**文件：** `server/src/services/learningMapService.ts`

### 实现原理

#### 5.1 关卡解锁检查
```typescript
checkStageUnlock(userId, stageId)
```

**解锁条件类型：**

1. **always** - 始终解锁（第一关）
2. **previous_stage** - 需要完成前置关卡
   ```
   条件：current_stage >= required_stage
   ```
3. **stars** - 需要收集足够星星
   ```
   条件：total_stars_earned >= required_stars
   ```
4. **perfect_stages** - 需要完美通关指定数量关卡
   ```
   条件：perfect_count >= required_count
   ```
5. **badges** - 需要获得指定勋章
   ```
   条件：拥有指定的勋章ID
   ```

#### 5.2 关卡完成记录
```typescript
completeStage(userId, stageId, completionData)
```

**完成流程：**

1. **检查关卡是否解锁** - 必须先解锁才能完成
2. **记录完成数据**：
   - 分数（0-100）
   - 获得星星数（1-3星）
   - 是否完美通关
   - 完成时长
3. **计算星星数**：
   - 1星：分数 >= 60
   - 2星：分数 >= 80
   - 3星：分数 >= 95
4. **判断完美通关**：
   - 分数 = 100
   - 无错误
   - 时间在限制内
5. **更新用户进度**：
   - 更新当前关卡
   - 累加总星星数
   - 更新完成率
6. **检查并授予勋章** - 满足条件自动获得

#### 5.3 勋章系统
```typescript
checkAndAwardBadges(userId, mapId)
```

**勋章类型：**

1. **完成关卡数** - 完成N个关卡
2. **收集星星数** - 收集N颗星星
3. **完美通关数** - 完美通关N个关卡
4. **连续学习天数** - 连续学习N天
5. **特殊成就** - 特定条件触发

**授予流程：**
1. 查询地图的所有勋章
2. 检查每个勋章的条件
3. 如果满足且未获得，则授予
4. 记录到 `user_badges` 表

#### 5.4 进度统计
```typescript
getProgressStats(userId)
```

**统计内容：**
- 总完成关卡数
- 总星星数
- 完美通关数
- 勋章数量

---

## 6. 能力评估系统

### 核心功能
**文件：** `server/src/services/learningPlanService.ts`

### 实现原理

#### 6.1 能力评估数据结构
**表：** `learning_ability_assessment`

**字段：**
- `user_id` - 用户ID
- `subject` - 学科（数学、语文、英语等）
- `skill_name` - 技能名称（加法、阅读理解等）
- `practice_count` - 练习次数
- `success_count` - 成功次数
- `avg_accuracy` - 平均正确率
- `mastery_level` - 掌握等级（0-5）
- `last_assessed_at` - 最后评估时间

#### 6.2 获取能力评估
```typescript
getAbilityAssessment(userId, subject?)
```

**返回数据：**
- 按掌握等级降序排列
- 可按学科筛选
- 显示每个技能的练习情况和掌握度

#### 6.3 更新能力评估
```typescript
updateAbilityAssessment(userId, subject, skillName, assessmentData)
```

**更新逻辑：**

1. **检查是否存在记录**
2. **如果不存在** - 创建新记录：
   - 初始化练习次数、成功次数、正确率
3. **如果存在** - 更新现有记录：
   - 累加练习次数
   - 累加成功次数
   - 计算新的平均正确率：
     ```
     新平均正确率 = (旧平均 × 旧次数 + 新正确率) / 新总次数
     ```
4. **更新最后评估时间**

#### 6.4 能力评估在AI计划中的应用
```typescript
generateAIPlan(userId, preferences)
```

**应用方式：**
1. 获取用户所有能力评估数据
2. 识别薄弱技能（掌握度低、正确率低）
3. 在生成计划时优先安排薄弱技能的练习
4. 根据掌握度分配练习量：
   - 薄弱技能：更多练习时间
   - 熟练技能：适度复习

---

## 系统架构总结

### 数据流向
```
用户答题
  ↓
记录答题行为 (question_attempts)
  ↓
更新学习行为分析 (learning_behavior_analysis)
  ↓
计算掌握度
  ↓
更新能力评估 (learning_ability_assessment)
  ↓
生成推荐 / 生成学习路径 / 生成AI计划
```

### 核心算法

1. **掌握度计算** - 综合正确率、练习量、时间因子
2. **自适应推荐** - 基于掌握度的难度调整
3. **拓扑排序** - 确保知识点学习顺序
4. **优先级排序** - 薄弱点优先、复习提醒
5. **星星评级** - 基于分数的三星评价
6. **勋章系统** - 多维度成就激励

### 技术特点

✨ **智能化**
- AI自适应推荐
- 智能学习路径生成
- 自动薄弱点检测

📊 **数据驱动**
- 完整的行为追踪
- 实时掌握度计算
- 多维度数据分析

🎮 **游戏化**
- 关卡解锁机制
- 星星奖励系统
- 勋章成就系统

🎯 **个性化**
- 基于能力的推荐
- 个性化学习计划
- 自适应难度调整

### 数据库表关系

```
knowledge_graph (知识图谱)
  ↓ 关联
learning_behavior_analysis (学习行为分析)
  ↓ 关联
learning_ability_assessment (能力评估)
  ↓ 应用于
learning_plans (学习计划)
  ↓ 包含
plan_tasks (计划任务)

learning_maps (学习地图)
  ↓ 包含
learning_stages (学习关卡)
  ↓ 完成记录
stage_completions (关卡完成)
  ↓ 更新
user_learning_progress (用户进度)
```

---

## 优化建议

### 性能优化
1. 添加缓存层（Redis）缓存知识图谱
2. 批量计算掌握度，减少数据库查询
3. 异步处理学习行为分析更新

### 功能增强
1. 引入机器学习模型优化推荐算法
2. 添加协同过滤推荐相似用户的学习路径
3. 实现知识点遗忘曲线，智能安排复习

### 用户体验
1. 可视化知识图谱展示
2. 学习进度动画效果
3. 实时反馈和鼓励机制
