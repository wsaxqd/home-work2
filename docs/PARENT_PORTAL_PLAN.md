# 家长端完整实施方案

> **功能名称**: 家长监护系统
> **目标用户**: 6-12岁儿童的家长
> **核心价值**: 让家长了解孩子学习情况，保障使用安全
> **开发周期**: 3-4周

---

## 📋 目录

1. [需求分析](#需求分析)
2. [功能设计](#功能设计)
3. [数据库设计](#数据库设计)
4. [后端API设计](#后端api设计)
5. [前端页面设计](#前端页面设计)
6. [实施步骤](#实施步骤)
7. [安全考虑](#安全考虑)

---

## 🎯 需求分析

### 核心需求

#### 1. 家长必须能做的事（P0）
- ✅ 绑定孩子账号
- ✅ 查看孩子使用时长和活跃度
- ✅ 查看孩子创作内容（作品、日记）
- ✅ 查看孩子学习报告
- ✅ 设置使用时间限制
- ✅ 接收异常行为提醒

#### 2. 家长希望能做的事（P1）
- ⬜ 与孩子互动（点赞作品、留言）
- ⬜ 查看孩子社交情况（好友列表、互动记录）
- ⬜ 设置内容过滤规则
- ⬜ 导出学习报告（PDF）
- ⬜ 设置每日学习目标

#### 3. 可选功能（P2）
- ⬜ 多孩子账号管理
- ⬜ 家长社区交流
- ⬜ 教育资源推荐
- ⬜ 专家咨询入口

### 用户场景

#### 场景1：首次使用
```
1. 家长下载应用/访问网页
2. 注册家长账号
3. 输入孩子账号/扫描二维码绑定
4. 孩子确认绑定请求
5. 进入家长端主页，查看孩子概况
```

#### 场景2：日常监控
```
1. 家长登录
2. 查看今日使用时长
3. 浏览孩子最新创作
4. 查看学习进度报告
5. 发现异常行为，设置时间限制
```

#### 场景3：周报查看
```
1. 每周一收到系统推送
2. 打开本周学习报告
3. 查看各项数据对比
4. 导出PDF保存
5. 与孩子沟通学习情况
```

---

## 🎨 功能设计

### 功能模块地图

```
家长端
├── 账号管理
│   ├── 家长注册/登录
│   ├── 绑定孩子账号
│   ├── 管理多个孩子
│   └── 解除绑定
├── 实时监控
│   ├── 今日使用时长
│   ├── 在线状态
│   ├── 当前活动
│   └── 设备信息
├── 内容查看
│   ├── 创作作品展示
│   ├── 心灵花园日记
│   ├── 游戏记录
│   └── 社交互动
├── 学习报告
│   ├── 每日总结
│   ├── 每周报告
│   ├── 月度分析
│   └── 能力评估结果
├── 使用管控
│   ├── 时间限制设置
│   ├── 功能禁用
│   ├── 内容过滤
│   └── 紧急锁定
├── 消息通知
│   ├── 异常行为提醒
│   ├── 学习报告推送
│   ├── 作品完成通知
│   └── 系统公告
└── 设置中心
    ├── 家长资料
    ├── 通知偏好
    ├── 隐私设置
    └── 帮助中心
```

---

## 🗄️ 数据库设计

### 新增表结构

#### 1. 家长账号表 (parents)

```sql
CREATE TABLE parents (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(50) NOT NULL,
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_parents_phone ON parents(phone);
CREATE INDEX idx_parents_email ON parents(email);
```

#### 2. 家长-孩子绑定表 (parent_child_bindings)

```sql
CREATE TABLE parent_child_bindings (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relation VARCHAR(20) NOT NULL CHECK (relation IN ('father', 'mother', 'guardian', 'other')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_code VARCHAR(10) UNIQUE, -- 绑定验证码
  bound_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parent_id, child_id)
);

CREATE INDEX idx_bindings_parent ON parent_child_bindings(parent_id);
CREATE INDEX idx_bindings_child ON parent_child_bindings(child_id);
CREATE INDEX idx_bindings_code ON parent_child_bindings(request_code);
```

#### 3. 使用时长记录表 (usage_logs)

```sql
CREATE TABLE usage_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP,
  duration INTEGER, -- 秒
  device_info JSONB, -- 设备信息
  activities JSONB, -- 活动记录 [{type: 'game', id: 1, duration: 300}]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_user_date ON usage_logs(user_id, DATE(session_start));
```

#### 4. 家长控制设置表 (parental_controls)

```sql
CREATE TABLE parental_controls (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  daily_time_limit INTEGER DEFAULT 7200, -- 每日时长限制(秒) 默认2小时
  allowed_time_ranges JSONB, -- 允许使用时间段 [{"start":"08:00", "end":"20:00"}]
  blocked_features JSONB, -- 禁用功能列表 ["games", "social"]
  content_filter_level VARCHAR(20) DEFAULT 'medium', -- low/medium/high
  emergency_lock BOOLEAN DEFAULT false, -- 紧急锁定
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES parents(id)
);

CREATE INDEX idx_controls_child ON parental_controls(child_id);
```

#### 5. 异常行为记录表 (behavior_alerts)

```sql
CREATE TABLE behavior_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'overtime', 'inappropriate_content', 'unusual_activity'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
  description TEXT NOT NULL,
  details JSONB,
  read_by_parent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_user ON behavior_alerts(user_id);
CREATE INDEX idx_alerts_unread ON behavior_alerts(read_by_parent, created_at DESC);
```

#### 6. 家长通知表 (parent_notifications)

```sql
CREATE TABLE parent_notifications (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'report', 'alert', 'achievement', 'work'
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  link VARCHAR(255), -- 跳转链接
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parent_notif_parent ON parent_notifications(parent_id, read);
```

### 修改现有表

#### 修改 users 表（添加家长控制相关字段）

```sql
ALTER TABLE users ADD COLUMN has_parent_control BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP;
```

---

## 🔧 后端API设计

### 1. 家长认证模块

#### 家长注册
```typescript
POST /api/parents/auth/register
Request:
{
  "phone": "13800138000",
  "password": "password123",
  "name": "张女士",
  "email": "optional@example.com"
}
Response:
{
  "success": true,
  "data": {
    "parent": { id, phone, name, avatar },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### 家长登录
```typescript
POST /api/parents/auth/login
Request:
{
  "phone": "13800138000",
  "password": "password123"
}
Response:
{
  "success": true,
  "data": {
    "parent": { id, phone, name, avatar },
    "children": [{ id, nickname, avatar, relation }],
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 2. 绑定管理模块

#### 发起绑定请求
```typescript
POST /api/parents/binding/request
Headers: Authorization: Bearer {parentToken}
Request:
{
  "childPhone": "13900139000", // 或 childId
  "relation": "mother"
}
Response:
{
  "success": true,
  "data": {
    "bindingId": 123,
    "requestCode": "ABC123", // 6位验证码
    "expiresAt": "2026-01-12T10:00:00Z"
  }
}
```

#### 孩子确认绑定
```typescript
POST /api/parents/binding/confirm
Headers: Authorization: Bearer {childToken}
Request:
{
  "requestCode": "ABC123"
}
Response:
{
  "success": true,
  "data": {
    "parent": { id, name, relation },
    "message": "绑定成功"
  }
}
```

#### 获取绑定列表
```typescript
GET /api/parents/binding/list
Headers: Authorization: Bearer {parentToken}
Response:
{
  "success": true,
  "data": [
    {
      "childId": 10,
      "nickname": "小明",
      "avatar": "...",
      "relation": "mother",
      "status": "approved",
      "boundAt": "2026-01-01T10:00:00Z"
    }
  ]
}
```

#### 解除绑定
```typescript
DELETE /api/parents/binding/{childId}
Headers: Authorization: Bearer {parentToken}
Response:
{
  "success": true,
  "message": "已解除绑定"
}
```

### 3. 监控查看模块

#### 获取孩子概览
```typescript
GET /api/parents/children/{childId}/overview
Headers: Authorization: Bearer {parentToken}
Query: ?date=2026-01-11 (可选，默认今天)
Response:
{
  "success": true,
  "data": {
    "child": { id, nickname, avatar, age },
    "today": {
      "totalDuration": 3600, // 秒
      "isOnline": true,
      "currentActivity": "story-creator",
      "lastActive": "2026-01-11T15:30:00Z"
    },
    "activities": [
      { type: "game", name: "表情识别", duration: 600 },
      { type: "create", name: "故事创作", duration: 1200 }
    ],
    "recentWorks": [
      { id: 1, type: "story", title: "小兔子的冒险", createdAt: "..." }
    ],
    "alerts": [
      { id: 1, type: "overtime", severity: "medium", message: "今日使用时长已超过建议值" }
    ]
  }
}
```

#### 获取使用时长统计
```typescript
GET /api/parents/children/{childId}/usage-stats
Headers: Authorization: Bearer {parentToken}
Query: ?range=week (day/week/month)
Response:
{
  "success": true,
  "data": {
    "range": "week",
    "total": 18000, // 总秒数
    "daily": [
      { date: "2026-01-05", duration: 3600 },
      { date: "2026-01-06", duration: 2400 },
      ...
    ],
    "byActivity": {
      "games": 7200,
      "create": 6000,
      "social": 3600,
      "other": 1200
    },
    "peakHours": [
      { hour: 16, count: 5 },
      { hour: 19, count: 8 }
    ]
  }
}
```

#### 获取创作作品列表
```typescript
GET /api/parents/children/{childId}/works
Headers: Authorization: Bearer {parentToken}
Query: ?type=all&page=1&limit=20
Response:
{
  "success": true,
  "data": {
    "total": 45,
    "works": [
      {
        "id": 1,
        "type": "story",
        "title": "小兔子的冒险",
        "thumbnail": "...",
        "content": "...",
        "likes": 10,
        "published": true,
        "createdAt": "2026-01-10T14:20:00Z"
      }
    ]
  }
}
```

#### 获取心灵花园日记
```typescript
GET /api/parents/children/{childId}/diaries
Headers: Authorization: Bearer {parentToken}
Query: ?startDate=2026-01-01&endDate=2026-01-11
Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "mood": "happy",
      "content": "今天很开心，完成了一个故事创作",
      "aiResponse": "...",
      "createdAt": "2026-01-10T20:00:00Z"
    }
  ]
}
```

### 4. 学习报告模块

#### 获取每周报告
```typescript
GET /api/parents/children/{childId}/reports/weekly
Headers: Authorization: Bearer {parentToken}
Query: ?weekStart=2026-01-05
Response:
{
  "success": true,
  "data": {
    "period": { start: "2026-01-05", end: "2026-01-11" },
    "summary": {
      "totalUsage": 18000,
      "avgDaily": 2571,
      "worksCreated": 5,
      "gamesPlayed": 12,
      "achievements": 2
    },
    "highlights": [
      "本周完成了5个创作作品",
      "解锁了'创作达人'成就",
      "游戏平均得分提升20%"
    ],
    "recommendations": [
      "建议适当控制游戏时间",
      "鼓励多尝试诗词创作"
    ],
    "comparison": {
      "vsLastWeek": {
        "usage": "+15%",
        "works": "+2",
        "games": "-3"
      }
    }
  }
}
```

#### 导出报告为PDF
```typescript
GET /api/parents/children/{childId}/reports/export
Headers: Authorization: Bearer {parentToken}
Query: ?type=weekly&date=2026-01-11&format=pdf
Response: PDF文件流
```

### 5. 家长控制模块

#### 获取控制设置
```typescript
GET /api/parents/children/{childId}/controls
Headers: Authorization: Bearer {parentToken}
Response:
{
  "success": true,
  "data": {
    "dailyTimeLimit": 7200,
    "allowedTimeRanges": [
      { "start": "08:00", "end": "12:00" },
      { "start": "14:00", "end": "20:00" }
    ],
    "blockedFeatures": [],
    "contentFilterLevel": "medium",
    "emergencyLock": false
  }
}
```

#### 更新控制设置
```typescript
PUT /api/parents/children/{childId}/controls
Headers: Authorization: Bearer {parentToken}
Request:
{
  "dailyTimeLimit": 5400, // 1.5小时
  "allowedTimeRanges": [
    { "start": "08:00", "end": "20:00" }
  ],
  "blockedFeatures": ["social"],
  "contentFilterLevel": "high"
}
Response:
{
  "success": true,
  "message": "设置已更新"
}
```

#### 紧急锁定
```typescript
POST /api/parents/children/{childId}/emergency-lock
Headers: Authorization: Bearer {parentToken}
Request:
{
  "lock": true,
  "reason": "该睡觉了"
}
Response:
{
  "success": true,
  "message": "已锁定，孩子将在5分钟后被强制退出"
}
```

### 6. 通知模块

#### 获取通知列表
```typescript
GET /api/parents/notifications
Headers: Authorization: Bearer {parentToken}
Query: ?page=1&limit=20&read=false
Response:
{
  "success": true,
  "data": {
    "total": 15,
    "unread": 3,
    "notifications": [
      {
        "id": 1,
        "type": "alert",
        "title": "使用时长提醒",
        "content": "小明今日使用时长已达2小时",
        "childName": "小明",
        "read": false,
        "createdAt": "2026-01-11T16:00:00Z"
      }
    ]
  }
}
```

#### 标记已读
```typescript
PUT /api/parents/notifications/{notificationId}/read
Headers: Authorization: Bearer {parentToken}
Response:
{
  "success": true
}
```

---

## 💻 前端页面设计

### 页面结构

```
/parent (家长端根路径)
├── /login              # 家长登录页
├── /register           # 家长注册页
├── /dashboard          # 控制台首页
├── /children           # 孩子管理
│   ├── /add           # 绑定新孩子
│   └── /{id}          # 单个孩子详情
│       ├── /overview  # 概览（默认）
│       ├── /works     # 作品查看
│       ├── /diaries   # 日记查看
│       ├── /reports   # 学习报告
│       ├── /controls  # 使用管控
│       └── /social    # 社交情况
├── /notifications      # 通知中心
└── /settings          # 设置中心
```

### 关键页面设计

#### 1. 家长登录页 (/parent/login)

```tsx
// app/src/pages/parent/Login.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parentAuthApi } from '../../services/api'
import './ParentLogin.css'

export default function ParentLogin() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await parentAuthApi.login({ phone, password })
      if (response.success) {
        localStorage.setItem('parentToken', response.data.accessToken)
        localStorage.setItem('parentProfile', JSON.stringify(response.data.parent))
        navigate('/parent/dashboard')
      }
    } catch (error) {
      alert('登录失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="parent-login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">👨‍👩‍👧‍👦</div>
          <h1>家长监护中心</h1>
          <p>守护孩子健康成长</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>手机号</label>
            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="login-footer">
          <span>还没有账号？</span>
          <a onClick={() => navigate('/parent/register')}>立即注册</a>
        </div>
      </div>
    </div>
  )
}
```

#### 2. 控制台首页 (/parent/dashboard)

```tsx
// app/src/pages/parent/Dashboard.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parentApi } from '../../services/api'
import './Dashboard.css'

export default function ParentDashboard() {
  const navigate = useNavigate()
  const [children, setChildren] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [childrenRes, notifRes] = await Promise.all([
        parentApi.getChildren(),
        parentApi.getNotifications({ limit: 5 })
      ])

      setChildren(childrenRes.data)
      setNotifications(notifRes.data.notifications)
    } catch (error) {
      console.error('加载失败', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>

  return (
    <div className="parent-dashboard">
      <header className="dashboard-header">
        <h1>家长监护中心</h1>
        <div className="header-actions">
          <button className="btn-notifications">
            🔔
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="badge">{notifications.filter(n => !n.read).length}</span>
            )}
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* 孩子卡片列表 */}
        <section className="children-section">
          <div className="section-header">
            <h2>我的孩子</h2>
            <button
              className="btn-add-child"
              onClick={() => navigate('/parent/children/add')}
            >
              + 绑定孩子
            </button>
          </div>

          <div className="children-grid">
            {children.map(child => (
              <ChildCard
                key={child.id}
                child={child}
                onClick={() => navigate(`/parent/children/${child.id}`)}
              />
            ))}
          </div>
        </section>

        {/* 今日通知 */}
        <section className="notifications-section">
          <div className="section-header">
            <h2>最新通知</h2>
            <a onClick={() => navigate('/parent/notifications')}>查看全部</a>
          </div>

          <div className="notifications-list">
            {notifications.map(notif => (
              <NotificationItem key={notif.id} notification={notif} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ChildCard({ child, onClick }) {
  return (
    <div className="child-card" onClick={onClick}>
      <div className="child-avatar">{child.avatar || '👦'}</div>
      <div className="child-info">
        <div className="child-name">{child.nickname}</div>
        <div className="child-status">
          {child.isOnline ? (
            <span className="status-online">● 在线</span>
          ) : (
            <span className="status-offline">○ 离线</span>
          )}
        </div>
      </div>
      <div className="child-stats">
        <div className="stat-item">
          <div className="stat-value">{formatDuration(child.todayUsage)}</div>
          <div className="stat-label">今日使用</div>
        </div>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
```

#### 3. 孩子详情页 (/parent/children/:id)

```tsx
// app/src/pages/parent/ChildDetail.tsx
import { useEffect, useState } from 'react'
import { useParams, Outlet, NavLink } from 'react-router-dom'
import { parentApi } from '../../services/api'
import './ChildDetail.css'

export default function ChildDetail() {
  const { id } = useParams()
  const [child, setChild] = useState(null)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChildDetail()
  }, [id])

  const loadChildDetail = async () => {
    try {
      const response = await parentApi.getChildOverview(id!)
      setChild(response.data.child)
      setOverview(response.data)
    } catch (error) {
      console.error('加载失败', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>

  return (
    <div className="child-detail-page">
      {/* 头部信息 */}
      <header className="child-header">
        <div className="child-profile">
          <div className="child-avatar-large">{child.avatar || '👦'}</div>
          <div className="child-basic-info">
            <h1>{child.nickname}</h1>
            <div className="child-meta">
              <span>{child.age}岁</span>
              <span>•</span>
              <span>{overview.today.isOnline ? '在线' : '离线'}</span>
            </div>
          </div>
        </div>

        {/* 今日概览卡片 */}
        <div className="today-overview">
          <div className="overview-item">
            <div className="item-icon">⏱️</div>
            <div className="item-value">{formatDuration(overview.today.totalDuration)}</div>
            <div className="item-label">今日使用</div>
          </div>
          <div className="overview-item">
            <div className="item-icon">✨</div>
            <div className="item-value">{overview.recentWorks.length}</div>
            <div className="item-label">今日创作</div>
          </div>
          <div className="overview-item">
            <div className="item-icon">⚠️</div>
            <div className="item-value">{overview.alerts.length}</div>
            <div className="item-label">待处理提醒</div>
          </div>
        </div>
      </header>

      {/* 导航标签 */}
      <nav className="child-nav">
        <NavLink to="overview" className={({ isActive }) => isActive ? 'active' : ''}>
          概览
        </NavLink>
        <NavLink to="works">作品</NavLink>
        <NavLink to="diaries">日记</NavLink>
        <NavLink to="reports">报告</NavLink>
        <NavLink to="controls">管控</NavLink>
        <NavLink to="social">社交</NavLink>
      </nav>

      {/* 子路由内容 */}
      <div className="child-content">
        <Outlet context={{ child, overview }} />
      </div>
    </div>
  )
}
```

#### 4. 使用管控页面 (/parent/children/:id/controls)

```tsx
// app/src/pages/parent/Controls.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { parentApi } from '../../services/api'
import './Controls.css'

export default function ParentalControls() {
  const { id } = useParams()
  const [controls, setControls] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadControls()
  }, [id])

  const loadControls = async () => {
    try {
      const response = await parentApi.getControls(id!)
      setControls(response.data)
    } catch (error) {
      console.error('加载失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTimeLimit = async (newLimit: number) => {
    try {
      await parentApi.updateControls(id!, { dailyTimeLimit: newLimit })
      setControls({ ...controls, dailyTimeLimit: newLimit })
      alert('设置已更新')
    } catch (error) {
      alert('更新失败：' + error.message)
    }
  }

  const handleEmergencyLock = async () => {
    if (!confirm('确定要紧急锁定吗？孩子将被强制退出应用')) return

    try {
      await parentApi.emergencyLock(id!, true)
      alert('已锁定')
    } catch (error) {
      alert('锁定失败：' + error.message)
    }
  }

  if (loading) return <div>加载中...</div>

  return (
    <div className="parental-controls">
      {/* 时间限制设置 */}
      <section className="control-section">
        <h3>⏱️ 使用时长限制</h3>
        <div className="control-card">
          <div className="control-row">
            <span>每日使用时长上限</span>
            <select
              value={controls.dailyTimeLimit}
              onChange={(e) => handleUpdateTimeLimit(Number(e.target.value))}
            >
              <option value={3600}>1小时</option>
              <option value={5400}>1.5小时</option>
              <option value={7200}>2小时</option>
              <option value={10800}>3小时</option>
              <option value={-1}>不限制</option>
            </select>
          </div>
        </div>
      </section>

      {/* 允许时间段 */}
      <section className="control-section">
        <h3>🕐 允许使用时间段</h3>
        <div className="control-card">
          {controls.allowedTimeRanges.map((range, index) => (
            <div key={index} className="time-range">
              <input type="time" value={range.start} />
              <span>-</span>
              <input type="time" value={range.end} />
              <button className="btn-remove">删除</button>
            </div>
          ))}
          <button className="btn-add-range">+ 添加时间段</button>
        </div>
      </section>

      {/* 功能禁用 */}
      <section className="control-section">
        <h3>🚫 功能禁用</h3>
        <div className="control-card">
          <label className="feature-toggle">
            <input
              type="checkbox"
              checked={controls.blockedFeatures.includes('games')}
            />
            <span>游戏功能</span>
          </label>
          <label className="feature-toggle">
            <input
              type="checkbox"
              checked={controls.blockedFeatures.includes('social')}
            />
            <span>社交功能</span>
          </label>
          <label className="feature-toggle">
            <input
              type="checkbox"
              checked={controls.blockedFeatures.includes('create')}
            />
            <span>创作功能</span>
          </label>
        </div>
      </section>

      {/* 内容过滤 */}
      <section className="control-section">
        <h3>🛡️ 内容过滤级别</h3>
        <div className="control-card">
          <select value={controls.contentFilterLevel}>
            <option value="low">宽松</option>
            <option value="medium">中等</option>
            <option value="high">严格</option>
          </select>
        </div>
      </section>

      {/* 紧急锁定 */}
      <section className="control-section">
        <h3>🔒 紧急操作</h3>
        <div className="control-card">
          <button className="btn-emergency-lock" onClick={handleEmergencyLock}>
            紧急锁定
          </button>
          <p className="help-text">
            点击后，孩子将在5分钟内被强制退出应用，并无法登录
          </p>
        </div>
      </section>
    </div>
  )
}
```

---

## 🚀 实施步骤

### 第1周：数据库和后端基础

#### Day 1-2: 数据库设计
- [ ] 创建迁移文件 `024_create_parent_system.ts`
- [ ] 执行迁移，创建所有表
- [ ] 编写种子数据用于测试
- [ ] 测试数据库约束和索引

#### Day 3-4: 家长认证API
- [ ] 实现家长注册接口
- [ ] 实现家长登录接口
- [ ] JWT token生成（独立于儿童端）
- [ ] 编写单元测试

#### Day 5-7: 绑定管理API
- [ ] 实现绑定请求接口
- [ ] 实现绑定确认接口
- [ ] 绑定列表和解绑接口
- [ ] 测试绑定流程

### 第2周：核心监控功能

#### Day 1-3: 监控API开发
- [ ] 孩子概览接口
- [ ] 使用时长统计接口
- [ ] 活动记录接口
- [ ] 实时状态推送（WebSocket可选）

#### Day 4-5: 内容查看API
- [ ] 作品列表接口
- [ ] 日记查看接口
- [ ] 社交情况接口

#### Day 6-7: 学习报告API
- [ ] 每日总结生成
- [ ] 每周报告生成
- [ ] PDF导出功能（使用puppeteer或pdfkit）

### 第3周：前端页面开发

#### Day 1-2: 基础页面
- [ ] 家长登录页
- [ ] 家长注册页
- [ ] 控制台首页
- [ ] 统一的家长端Layout

#### Day 3-4: 孩子管理页面
- [ ] 孩子列表
- [ ] 绑定流程页面
- [ ] 孩子详情页
- [ ] 概览Tab

#### Day 5-7: 功能页面
- [ ] 作品查看页
- [ ] 日记查看页
- [ ] 学习报告页
- [ ] 使用管控页

### 第4周：完善和测试

#### Day 1-2: 通知系统
- [ ] 通知列表页面
- [ ] 推送通知功能
- [ ] 异常行为检测

#### Day 3-4: 样式优化
- [ ] 统一视觉设计
- [ ] 响应式适配
- [ ] 动画和交互优化

#### Day 5-7: 测试和修复
- [ ] 功能测试
- [ ] 边界情况测试
- [ ] Bug修复
- [ ] 性能优化

---

## 🔐 安全考虑

### 1. 认证和授权

#### 独立的认证体系
```typescript
// 家长和儿童使用不同的token
const parentToken = jwt.sign(
  { id: parent.id, type: 'parent' },
  process.env.PARENT_JWT_SECRET,
  { expiresIn: '7d' }
)

// 中间件验证
function parentAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  try {
    const decoded = jwt.verify(token, process.env.PARENT_JWT_SECRET)
    if (decoded.type !== 'parent') {
      return res.status(403).json({ error: '无权访问' })
    }
    req.parent = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: '认证失败' })
  }
}
```

#### 权限检查
```typescript
// 确保家长只能访问自己绑定的孩子
async function checkParentChildAccess(parentId: number, childId: number) {
  const binding = await pool.query(
    `SELECT * FROM parent_child_bindings
     WHERE parent_id = $1 AND child_id = $2 AND status = 'approved'`,
    [parentId, childId]
  )
  return binding.rows.length > 0
}
```

### 2. 隐私保护

#### 敏感数据脱敏
```typescript
// 家长查看日记时，过滤敏感信息
function sanitizeDiary(diary: any) {
  return {
    ...diary,
    content: diary.content,
    // 不返回过于私密的AI对话内容
    aiResponse: diary.aiResponse ? '（AI回复已隐藏）' : null
  }
}
```

#### 孩子知情权
```typescript
// 孩子可以查看家长查看过哪些内容
CREATE TABLE parent_view_logs (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER,
  child_id INTEGER,
  viewed_content_type VARCHAR(50),
  viewed_content_id INTEGER,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 防滥用机制

#### 频率限制
```typescript
// 限制绑定请求频率
const bindingRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次
  message: '绑定请求过于频繁，请稍后再试'
})
```

#### 操作日志
```typescript
CREATE TABLE parent_operation_logs (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER,
  child_id INTEGER,
  operation VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📱 额外考虑

### 1. 移动端APP
如果需要独立的家长端APP：
- 可以使用React Native复用前端代码
- 或使用Capacitor将Web应用打包为原生APP
- 推送通知使用Firebase Cloud Messaging

### 2. 多孩子管理
```sql
-- 已经支持，一个家长可以绑定多个孩子
SELECT * FROM parent_child_bindings WHERE parent_id = 1;
```

### 3. 多家长共管
```sql
-- 已经支持，一个孩子可以被多个家长绑定
SELECT * FROM parent_child_bindings WHERE child_id = 10;
```

### 4. 孩子端配合改动

#### 添加绑定确认入口
```tsx
// app/src/pages/Profile.tsx 添加
<div className="setting-item" onClick={() => navigate('/parent-binding')}>
  <span>👨‍👩‍👧 家长监护</span>
  <span className="arrow">→</span>
</div>
```

#### 绑定确认页面
```tsx
// app/src/pages/ParentBinding.tsx
export default function ParentBinding() {
  const [code, setCode] = useState('')

  const handleConfirm = async () => {
    const response = await api.confirmParentBinding(code)
    if (response.success) {
      alert(`已绑定家长：${response.data.parent.name}`)
    }
  }

  return (
    <div className="parent-binding-page">
      <h2>确认家长绑定</h2>
      <input
        placeholder="输入6位验证码"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
      />
      <button onClick={handleConfirm}>确认绑定</button>
    </div>
  )
}
```

---

## 🎯 总结

### 核心交付物

1. ✅ **数据库表** (7张新表)
   - parents, parent_child_bindings, usage_logs
   - parental_controls, behavior_alerts, parent_notifications

2. ✅ **后端API** (30+接口)
   - 家长认证 (注册/登录)
   - 绑定管理 (请求/确认/解绑)
   - 监控查看 (概览/时长/作品/日记)
   - 学习报告 (日/周/月报告)
   - 使用管控 (时间限制/功能禁用/紧急锁定)
   - 通知系统

3. ✅ **前端页面** (10+页面)
   - 登录注册
   - 控制台首页
   - 孩子管理
   - 详情页（6个Tab）
   - 通知中心

### 预期效果

- 🎯 家长可以全面了解孩子使用情况
- 🔒 家长可以有效管控孩子使用行为
- 📊 定期推送学习报告，促进沟通
- ⚠️ 异常行为及时提醒，保障安全

### 预计工作量

- **开发时间**: 3-4周（1人全职）
- **代码量估计**:
  - 后端: ~3000行
  - 前端: ~4000行
  - 数据库迁移: ~500行

---

**文档作者**: Claude Code AI
**版本**: v1.0
**创建日期**: 2026-01-11
