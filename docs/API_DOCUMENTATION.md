# 启蒙之光 API 文档

**版本**: V1.0
**基础URL**: `http://localhost:3000/api`
**认证方式**: JWT Bearer Token

---

## 📋 目录

1. [认证相关](#认证相关)
2. [用户管理](#用户管理)
3. [AI功能](#ai功能)
4. [游戏系统](#游戏系统)
5. [作品管理](#作品管理)
6. [社区功能](#社区功能)
7. [学习系统](#学习系统)
8. [家长监护](#家长监护)

---

## 🔐 认证相关

### 用户注册
```http
POST /api/auth/register
```

**请求体**:
```json
{
  "username": "string (必填, 3-20字符)",
  "password": "string (必填, 6-20字符)",
  "email": "string (可选)",
  "age": "number (可选, 6-12)",
  "avatar": "string (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "age": number,
      "avatar": "string"
    },
    "token": "string",
    "refreshToken": "string"
  }
}
```

### 用户登录
```http
POST /api/auth/login
```

**请求体**:
```json
{
  "username": "string (必填)",
  "password": "string (必填)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    },
    "token": "string",
    "refreshToken": "string"
  }
}
```

### 刷新Token
```http
POST /api/auth/refresh
```

**请求头**:
```
Authorization: Bearer {refreshToken}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "string",
    "refreshToken": "string"
  }
}
```

---

## 👤 用户管理

### 获取用户信息
```http
GET /api/user/profile
```

**请求头**:
```
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "age": number,
    "avatar": "string",
    "coins": number,
    "level": number,
    "exp": number,
    "createdAt": "string"
  }
}
```

### 更新用户信息
```http
PUT /api/user/profile
```

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "email": "string (可选)",
  "avatar": "string (可选)",
  "age": "number (可选)"
}
```

---

## 🤖 AI功能

### AI对话
```http
POST /api/ai/chat
```

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "message": "string (必填)",
  "conversationId": "string (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "reply": "string",
    "conversationId": "string"
  }
}
```

### 生成故事
```http
POST /api/ai/story
```

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "theme": "string (必填)",
  "keywords": ["string"],
  "length": "short | medium | long"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "title": "string",
    "content": "string",
    "summary": "string"
  }
}
```

### 情感分析
```http
POST /api/ai/emotion
```

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "text": "string (必填)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "emotion": "happy | sad | angry | neutral",
    "confidence": number,
    "suggestions": ["string"]
  }
}
```

---

## 🎮 游戏系统

### 获取游戏题目
```http
GET /api/games/questions?type={gameType}&difficulty={difficulty}&limit={limit}
```

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
- `type`: 游戏类型 (image_recognition | emotion_recognition | ai_quiz)
- `difficulty`: 难度 (easy | medium | hard)
- `limit`: 题目数量 (默认10)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "type": "string",
      "difficulty": "string",
      "question": "string",
      "options": ["string"],
      "correctAnswer": "string",
      "imageUrl": "string"
    }
  ]
}
```

### 验证答案
```http
POST /api/games/verify-answer
```

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "questionId": "string (必填)",
  "answer": "string (必填)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "correct": boolean,
    "explanation": "string",
    "points": number
  }
}
```

### 保存游戏记录
```http
POST /api/games/record
```

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "game_type": "string (必填)",
  "difficulty": "string (必填)",
  "score": number,
  "time_spent": number,
  "best_streak": number,
  "accuracy": number
}
```

### 获取排行榜
```http
GET /api/games/leaderboard/:gameType/:difficulty?limit={limit}
```

**请求头**:
```
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "rank": number,
      "userId": "string",
      "username": "string",
      "avatar": "string",
      "score": number,
      "playedAt": "string"
    }
  ]
}
```

---

## 🎨 作品管理

### 创建作品
```http
POST /api/works
```

**请求头**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求体**:
```
title: string (必填)
type: story | poem | art | music
content: string (必填)
description: string (可选)
tags: string[] (可选)
file: File (可选)
```

**响应**:
```json
{
  "success": true,
  "message": "作品创建成功",
  "data": {
    "id": "string",
    "title": "string",
    "type": "string",
    "content": "string",
    "coverUrl": "string",
    "createdAt": "string"
  }
}
```

### 获取作品列表
```http
GET /api/works?type={type}&page={page}&limit={limit}
```

**查询参数**:
- `type`: 作品类型 (可选)
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20)

**响应**:
```json
{
  "success": true,
  "data": {
    "works": [
      {
        "id": "string",
        "title": "string",
        "type": "string",
        "coverUrl": "string",
        "author": {
          "id": "string",
          "username": "string",
          "avatar": "string"
        },
        "likes": number,
        "views": number,
        "createdAt": "string"
      }
    ],
    "total": number,
    "page": number,
    "limit": number
  }
}
```

### 获取作品详情
```http
GET /api/works/:id
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "type": "string",
    "content": "string",
    "coverUrl": "string",
    "description": "string",
    "tags": ["string"],
    "author": {
      "id": "string",
      "username": "string",
      "avatar": "string"
    },
    "likes": number,
    "views": number,
    "comments": number,
    "isLiked": boolean,
    "createdAt": "string"
  }
}
```

### 点赞作品
```http
POST /api/works/:id/like
```

**请求头**:
```
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "message": "点赞成功",
  "data": {
    "likes": number
  }
}
```

### 评论作品
```http
POST /api/works/:id/comments
```

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "content": "string (必填, 1-500字符)"
}
```

---

## 👥 社区功能

### 关注用户
```http
POST /api/community/follow/:userId
```

**请求头**:
```
Authorization: Bearer {token}
```

### 获取关注列表
```http
GET /api/community/following
```

**请求头**:
```
Authorization: Bearer {token}
```

### 获取粉丝列表
```http
GET /api/community/followers
```

**请求头**:
```
Authorization: Bearer {token}
```

---

## 📚 学习系统

### 获取学习进度
```http
GET /api/learning/progress
```

**请求头**:
```
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalLessons": number,
    "completedLessons": number,
    "progress": number,
    "currentLevel": number,
    "nextLevelExp": number
  }
}
```

### 获取推荐内容
```http
GET /api/recommendations
```

**请求头**:
```
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "works": [],
    "games": [],
    "lessons": []
  }
}
```

---

## 👨‍👩‍👧 家长监护

### 绑定家长账号
```http
POST /api/parent/bind
```

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "parentEmail": "string (必填)",
  "parentPassword": "string (必填)"
}
```

### 获取使用报告
```http
GET /api/parent/report/:childId
```

**请求头**:
```
Authorization: Bearer {parentToken}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalTime": number,
    "dailyAverage": number,
    "activities": [],
    "achievements": [],
    "concerns": []
  }
}
```

---

## 📊 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE",
  "stack": "错误堆栈 (仅开发环境)"
}
```

### 常见错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | VALIDATION_ERROR | 数据验证失败 |
| 401 | INVALID_TOKEN | 无效的认证令牌 |
| 401 | TOKEN_EXPIRED | 认证令牌已过期 |
| 403 | FORBIDDEN | 禁止访问 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | DUPLICATE_ENTRY | 数据已存在 |
| 500 | DATABASE_ERROR | 数据库操作失败 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

---

## 🔒 认证说明

大部分API需要在请求头中携带JWT token：

```
Authorization: Bearer {your_token_here}
```

Token有效期：7天
Refresh Token有效期：30天

---

**文档更新时间**: 2026-02-16
**API版本**: V1.0
