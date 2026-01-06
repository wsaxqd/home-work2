// 用户相关类型
export interface User {
  id: string
  username: string
  email?: string
  nickname?: string
  avatar?: string
  age?: number
  bio?: string
  level: number
  experience: number
  coins: number
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends User {
  followersCount?: number
  followingCount?: number
  worksCount?: number
  isFollowing?: boolean
}

// 认证相关类型
export interface LoginRequest {
  phone?: string
  email?: string
  password: string
}

export interface RegisterRequest {
  phone?: string
  email?: string
  password: string
  nickname?: string
  avatar?: string
  age?: number
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// 作品相关类型
export interface Work {
  id: string
  userId: string
  type: 'art' | 'music' | 'story' | 'poem'
  title: string
  content: string
  coverImage?: string
  tags?: string[]
  isPublic: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
  user?: User
  isLiked?: boolean
}

export interface CreateWorkRequest {
  type: 'art' | 'music' | 'story' | 'poem'
  title: string
  content: string
  coverImage?: string
  tags?: string[]
  isPublic?: boolean
}

// 评论相关类型
export interface Comment {
  id: string
  userId: string
  workId: string
  content: string
  createdAt: string
  user?: User
}

export interface CreateCommentRequest {
  workId: string
  content: string
}

// 社区相关类型
export interface Post {
  id: string
  userId: string
  content: string
  images?: string[]
  likeCount: number
  commentCount: number
  createdAt: string
  user?: User
  isLiked?: boolean
}

export interface Topic {
  id: string
  icon: string
  title: string
  description?: string
  postCount: number
}

// 游戏相关类型
export interface GameScore {
  id: string
  userId: string
  gameType: string
  score: number
  level: number
  duration: number
  createdAt: string
}

export interface GameRecord {
  gameType: string
  highScore: number
  totalPlays: number
  averageScore: number
}

// 日记相关类型
export interface Diary {
  id: string
  userId: string
  mood: 'happy' | 'sad' | 'excited' | 'calm' | 'angry' | 'anxious'
  content: string
  drawings?: string[]
  weather?: string
  createdAt: string
}

export interface CreateDiaryRequest {
  mood: 'happy' | 'sad' | 'excited' | 'calm' | 'angry' | 'anxious'
  content: string
  drawings?: string[]
  weather?: string
}

// 评估相关类型
export interface Assessment {
  id: string
  userId: string
  category: string
  score: number
  details: Record<string, any>
  recommendations?: string[]
  createdAt: string
}

export interface AssessmentResult {
  category: string
  score: number
  level: string
  strengths: string[]
  improvements: string[]
  recommendations: string[]
}

// 通知相关类型
export interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'follow' | 'system' | 'achievement'
  title: string
  content: string
  relatedId?: string
  isRead: boolean
  createdAt: string
}

// 成就相关类型
export interface Achievement {
  id: string
  userId: string
  achievementType: string
  title: string
  description: string
  icon: string
  unlockedAt: string
}

// 关注相关类型
export interface Follow {
  followerId: string
  followingId: string
  createdAt: string
}

// 点赞相关类型
export interface Like {
  userId: string
  workId: string
  createdAt: string
}

// 愿望相关类型
export interface Wish {
  id: string
  userId: string
  content: string
  category: string
  status: 'pending' | 'completed' | 'expired'
  createdAt: string
  completedAt?: string
}

// 学习进度相关类型
export interface LearningProgress {
  id: string
  userId: string
  category: string
  skillName: string
  level: number
  progress: number
  lastPracticeDate: string
  totalPracticeTime: number
  createdAt: string
  updatedAt: string
}

// AI相关类型
export interface AIGenerateRequest {
  type: 'story' | 'poem' | 'art' | 'music'
  prompt: string
  options?: Record<string, any>
}

export interface AIGenerateResponse {
  content: string
  metadata?: Record<string, any>
}

// 分页相关类型
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 上传相关类型
export interface UploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
}
