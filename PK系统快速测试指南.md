# 🚀 PK系统快速测试指南

## 系统状态确认 ✅

- ✅ PostgreSQL容器运行中（16小时）
- ✅ 后端服务器运行正常（http://localhost:3000）
- ✅ 数据库表已创建（7个PK核心表）
- ✅ 15个API接口已部署

---

## 快速测试流程（5分钟）

### 步骤1：注册两个测试账号

使用任意API测试工具（Postman / curl / Thunder Client）

**账号A（玩家1）**
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "nickname": "数学天才小明",
  "phone": "13900000001",
  "password": "123456",
  "avatar": "🦁"
}

# 保存返回的 token 为 TOKEN_A
```

**账号B（玩家2）**
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "nickname": "计算高手小红",
  "phone": "13900000002",
  "password": "123456",
  "avatar": "🐯"
}

# 保存返回的 token 为 TOKEN_B
```

---

### 步骤2：玩家A创建房间

```bash
POST http://localhost:3000/api/pk/rooms/create
Authorization: Bearer TOKEN_A
Content-Type: application/json

{
  "gameType": "math-quiz",
  "subject": "math",
  "difficulty": "medium",
  "questionCount": 5,
  "timeLimit": 300,
  "isPrivate": false
}

# 返回示例：
{
  "success": true,
  "data": {
    "roomId": 1,
    "roomCode": "ABC123",
    "gameType": "math-quiz"
  }
}

# 记录 roomCode（例如：ABC123）和 roomId（例如：1）
```

---

### 步骤3：玩家B加入房间

```bash
POST http://localhost:3000/api/pk/rooms/join
Authorization: Bearer TOKEN_B
Content-Type: application/json

{
  "roomCode": "ABC123"
}

# 返回：
{
  "success": true,
  "message": "成功加入房间"
}
```

---

### 步骤4：双方准备

**玩家A准备**
```bash
POST http://localhost:3000/api/pk/rooms/1/ready
Authorization: Bearer TOKEN_A
```

**玩家B准备**
```bash
POST http://localhost:3000/api/pk/rooms/1/ready
Authorization: Bearer TOKEN_B

# 两人都准备后，游戏自动开始！
```

---

### 步骤5：获取题目

```bash
GET http://localhost:3000/api/pk/rooms/1/questions
Authorization: Bearer TOKEN_A  # 或 TOKEN_B

# 返回示例：
{
  "success": true,
  "data": {
    "questions": [
      {
        "questionNumber": 1,
        "question": "计算：25 × 4 = ?",
        "options": ["80", "90", "100", "110"]
      },
      {
        "questionNumber": 2,
        "question": "一个长方形的长是8cm，宽是5cm，它的周长是多少？",
        "options": ["13cm", "26cm", "40cm", "65cm"]
      }
      // ... 共5题
    ]
  }
}
```

---

### 步骤6：提交答案

**玩家A答题（第1题）**
```bash
POST http://localhost:3000/api/pk/rooms/1/answer
Authorization: Bearer TOKEN_A
Content-Type: application/json

{
  "questionNumber": 1,
  "userAnswer": "100",
  "timeSpent": 3500
}

# 返回：
{
  "success": true,
  "data": {
    "isCorrect": true,
    "score": 10,
    "correctAnswer": "100"
  }
}
```

**玩家B答题（第1题）**
```bash
POST http://localhost:3000/api/pk/rooms/1/answer
Authorization: Bearer TOKEN_B
Content-Type: application/json

{
  "questionNumber": 1,
  "userAnswer": "90",
  "timeSpent": 5200
}

# 返回：
{
  "success": true,
  "data": {
    "isCorrect": false,
    "score": 0,
    "correctAnswer": "100"
  }
}
```

**重复答题**：双方继续回答第2-5题...

---

### 步骤7：查看对战结果

```bash
GET http://localhost:3000/api/pk/rooms/1/result
Authorization: Bearer TOKEN_A  # 或 TOKEN_B

# 返回示例：
{
  "success": true,
  "data": {
    "roomStatus": "finished",
    "winner": {
      "userId": "xxx-xxx-xxx",
      "nickname": "数学天才小明",
      "score": 50,
      "correctCount": 5,
      "totalTime": 85000,
      "rankChange": 22
    },
    "loser": {
      "userId": "yyy-yyy-yyy",
      "nickname": "计算高手小红",
      "score": 30,
      "correctCount": 3,
      "totalTime": 120000,
      "rankChange": -11
    }
  }
}
```

---

### 步骤8：查看段位信息

```bash
GET http://localhost:3000/api/pk/ranks/math-quiz
Authorization: Bearer TOKEN_A

# 返回：
{
  "success": true,
  "data": {
    "rankLevel": "bronze",
    "rankPoints": 22,
    "totalWins": 1,
    "totalLosses": 0,
    "winStreak": 1,
    "rankName": "青铜"
  }
}
```

---

### 步骤9：查看排行榜

```bash
GET http://localhost:3000/api/pk/leaderboard/math-quiz?limit=10
Authorization: Bearer TOKEN_A

# 返回前10名玩家排名
```

---

## 核心API端点总览

| 功能 | 方法 | 端点 |
|------|------|------|
| 创建房间 | POST | `/api/pk/rooms/create` |
| 加入房间 | POST | `/api/pk/rooms/join` |
| 房间列表 | GET | `/api/pk/rooms/list` |
| 房间详情 | GET | `/api/pk/rooms/:roomId` |
| 玩家准备 | POST | `/api/pk/rooms/:roomId/ready` |
| 获取题目 | GET | `/api/pk/rooms/:roomId/questions` |
| 提交答案 | POST | `/api/pk/rooms/:roomId/answer` |
| 对战结果 | GET | `/api/pk/rooms/:roomId/result` |
| 段位信息 | GET | `/api/pk/ranks/:gameType` |
| 排行榜 | GET | `/api/pk/leaderboard/:gameType` |

---

## 题库内容（当前10题）

1. 计算：25 × 4 = ? **【答案：100】**
2. 一个长方形的长是8cm，宽是5cm，它的周长是多少？**【答案：26cm】**
3. 小明有12个苹果，吃掉了1/3，还剩多少个？**【答案：8个】**
4. 计算：144 ÷ 12 = ? **【答案：12】**
5. 一个正方形的边长是6米，它的面积是多少平方米？**【答案：36平方米】**
6. 48的因数有哪些？**【答案：1,2,3,4,6,8,12,16,24,48】**
7. 找规律：2, 4, 8, 16, __ **【答案：32】**
8. 小红买3支铅笔用了4.5元，每支铅笔多少钱？**【答案：1.5元】**
9. 比较大小：5/6 和 7/8 哪个大？**【答案：7/8】**
10. 一辆汽车3小时行驶180公里，它的平均速度是多少？**【答案：60公里/小时】**

---

## 段位系统

| 段位 | 名称 | 图标 | 分数范围 |
|------|------|------|----------|
| bronze | 青铜 | 🥉 | 0-99 |
| silver | 白银 | 🥈 | 100-299 |
| gold | 黄金 | 🥇 | 300-599 |
| platinum | 铂金 | 💎 | 600-999 |
| diamond | 钻石 | 💠 | 1000-1499 |
| master | 大师 | 👑 | 1500-1999 |
| grandmaster | 宗师 | 🏆 | 2000+ |

---

## 段位分计算规则

- **普通胜利**：+20分
- **3连胜**：+22分
- **5连胜**：+26分
- **10连胜**：+40分（最高）
- **打败高段位**：额外+10分
- **普通失败**：-10分
- **输给低段位**：-15分
- **连胜中断**：重置连胜计数

---

## 故障排查

### 问题1：无法创建房间
**检查**：用户是否已登录？token是否有效？
```bash
# 验证token
GET http://localhost:3000/api/auth/me
Authorization: Bearer YOUR_TOKEN
```

### 问题2：题目不显示
**检查**：房间状态是否为 "playing"？
```bash
GET http://localhost:3000/api/pk/rooms/1
```

### 问题3：答案提交失败
**检查**：questionNumber是否正确？timeSpent是否为数字？

---

## 前端测试

### 启动前端服务器
```bash
cd app
npm run dev
```

### 访问路径
1. **PK大厅**：http://localhost:5174/pk-battle
2. **对战房间**：http://localhost:5174/pk/room/1

### 测试流程
1. 打开两个浏览器窗口（或无痕模式）
2. 分别登录账号A和账号B
3. 账号A创建房间
4. 账号B加入房间
5. 双方准备并开始答题
6. 查看实时分数对比
7. 查看对战结果和段位变化

---

## 下一步优化建议

### 立即可做
1. ✅ 扩展题库（当前仅10题）
2. ✅ 添加更多科目（语文、英语）
3. ✅ 优化前端动画效果

### 中期规划
1. 🔄 接入WebSocket实现真正实时对战
2. 🔄 添加观战功能
3. 🔄 赛季重置机制
4. 🔄 成就系统

### 长期规划
1. 📅 AI出题系统
2. 📅 战队模式
3. 📅 锦标赛系统
4. 📅 数据分析报告

---

## 联系支持

- 📖 完整文档：`PK系统测试文档.md`
- 🗄️ 数据库Schema：`server/pk_tables.sql`
- 🔌 API实现：`server/src/routes/pk.ts`
- 🎨 前端组件：`app/src/pages/PKBattle.tsx` & `PKRoom.tsx`

---

**系统版本**: v1.0
**最后更新**: 2026-01-21
**状态**: ✅ 已部署并可测试
