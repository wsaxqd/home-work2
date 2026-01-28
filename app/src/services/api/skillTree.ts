// 技能树API服务
import { api } from '../../config/api';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  subject: string;
  category?: string;
  node_type: 'root' | 'branch' | 'leaf';
  grade_level: number;
  difficulty: number;
  parent_node_id?: string;
  prerequisites?: string[];
  required_mastery?: number;
  estimated_time: number;
  points_reward: number;
  icon?: string;
  position_x?: number;
  position_y?: number;
  resources?: any;
}

export interface UserSkillProgress {
  id: string;
  user_id: string;
  node_id: string;
  is_unlocked: boolean;
  is_completed: boolean;
  practice_count: number;
  success_count: number;
  total_time_spent: number;
  mastery_percentage: number;
  star_rating?: number;
  unlocked_at?: string;
  completed_at?: string;
  node?: SkillNode;
}

export interface LearningPath {
  id: string;
  name: string;
  description?: string;
  subject: string;
  target_grade_min?: number;
  target_grade_max?: number;
  difficulty_level: number;
  node_sequence: string[];
  estimated_days: number;
  tags?: string[];
  is_recommended: boolean;
  icon?: string;
}

export interface UserPathProgress {
  id: string;
  user_id: string;
  path_id: string;
  current_node_index: number;
  completion_percentage: number;
  total_time_spent: number;
  completed_nodes_count: number;
  started_at: string;
  path?: LearningPath;
}

export interface SkillTreeStats {
  total_nodes: number;
  unlocked_nodes: number;
  completed_nodes: number;
  total_points_earned: number;
  mastery_percentage: number;
  subjects: {
    subject: string;
    unlocked: number;
    completed: number;
    total: number;
  }[];
}

// 获取技能树节点
export const getSkillNodes = (subject?: string, gradeLevel?: number) => {
  const params: any = {};
  if (subject) params.subject = subject;
  if (gradeLevel) params.grade = gradeLevel;
  return api.get<SkillNode[]>('/skill-tree/nodes', { params });
};

// 获取节点详情
export const getNodeDetail = (nodeId: string) => {
  return api.get<SkillNode>(`/skill-tree/node/${nodeId}`);
};

// 获取我的技能进度
export const getMyProgress = (subject?: string) => {
  const params = subject ? { subject } : {};
  return api.get<UserSkillProgress[]>('/skill-tree/my-progress', { params });
};

// 检查节点是否可解锁
export const canUnlockNode = (nodeId: string) => {
  return api.get<{ can_unlock: boolean }>(`/skill-tree/node/${nodeId}/can-unlock`);
};

// 解锁节点
export const unlockNode = (nodeId: string) => {
  return api.post<UserSkillProgress>(`/skill-tree/node/${nodeId}/unlock`);
};

// 更新节点进度
export const updateNodeProgress = (nodeId: string, progressData: {
  practice_count?: number;
  success_count?: number;
  time_spent?: number;
}) => {
  return api.post<UserSkillProgress>(`/skill-tree/node/${nodeId}/progress`, progressData);
};

// 评价节点
export const rateNode = (nodeId: string, rating: number) => {
  return api.post<UserSkillProgress>(`/skill-tree/node/${nodeId}/rate`, { rating });
};

// 获取推荐学习路径
export const getRecommendedPaths = (subject?: string) => {
  const params = subject ? { subject } : {};
  return api.get<LearningPath[]>('/skill-tree/paths/recommended', { params });
};

// 开始学习路径
export const startLearningPath = (pathId: string) => {
  return api.post<UserPathProgress>(`/skill-tree/path/${pathId}/start`);
};

// 获取我的学习路径
export const getMyPaths = () => {
  return api.get<UserPathProgress[]>('/skill-tree/my-paths');
};

// 更新路径进度
export const updatePathProgress = (pathId: string, nodeIndex: number) => {
  return api.post<UserPathProgress>(`/skill-tree/path/${pathId}/progress`, { node_index: nodeIndex });
};

// 获取技能树统计
export const getSkillTreeStats = () => {
  return api.get<SkillTreeStats>('/skill-tree/stats');
};
