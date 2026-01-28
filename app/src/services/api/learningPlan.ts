// 学习计划API服务
import { api } from '../../config/api';

export interface LearningPlan {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'paused' | 'expired';
  target_subjects: string[];
  daily_learning_time: number;
  difficulty_level: number;
  completion_rate: number;
  is_ai_generated: boolean;
  created_at: string;
}

export interface LearningPlanTask {
  id: string;
  plan_id: string;
  task_type: string;
  subject?: string;
  content_id?: string;
  content_title: string;
  scheduled_date: string;
  scheduled_time?: string;
  estimated_duration: number;
  difficulty: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  actual_duration?: number;
  score?: number;
  accuracy?: number;
  ai_feedback?: string;
}

export interface AbilityAssessment {
  id: string;
  user_id: string;
  subject: string;
  skill_name: string;
  mastery_level: number;
  accuracy_rate: number;
  learning_speed: number;
  recent_trend: string;
  last_practiced: string;
}

// 获取我的学习计划列表
export const getMyPlans = (status?: string) => {
  const params = status ? { status } : {};
  return api.get<LearningPlan[]>('/learning-plan/my-plans', { params });
};

// 创建学习计划
export const createPlan = (planData: {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  target_subjects: string[];
  daily_learning_time: number;
  difficulty_level: number;
}) => {
  return api.post<LearningPlan>('/learning-plan/create', planData);
};

// AI生成学习计划
export const generateAIPlan = (preferences: {
  subjects: string[];
  daily_time: number;
  difficulty_level?: number;
  start_date: string;
  duration_days: number;
}) => {
  return api.post<LearningPlan>('/learning-plan/generate', preferences);
};

// 获取计划详情
export const getPlanDetail = (planId: string) => {
  return api.get<LearningPlan>(`/learning-plan/plan/${planId}`);
};

// 获取计划任务列表
export const getPlanTasks = (planId: string, date?: string) => {
  const params = date ? { date } : {};
  return api.get<LearningPlanTask[]>(`/learning-plan/plan/${planId}/tasks`, { params });
};

// 添加任务到计划
export const addPlanTask = (planId: string, taskData: {
  task_type: string;
  subject?: string;
  content_id?: string;
  content_title: string;
  scheduled_date: string;
  scheduled_time?: string;
  estimated_duration: number;
  difficulty: number;
}) => {
  return api.post<LearningPlanTask>(`/learning-plan/plan/${planId}/task`, taskData);
};

// 获取今日任务
export const getTodayTasks = () => {
  return api.get<LearningPlanTask[]>('/learning-plan/today-tasks');
};

// 完成任务
export const completeTask = (taskId: string, completionData: {
  actual_duration?: number;
  score?: number;
  accuracy?: number;
}) => {
  return api.post<LearningPlanTask>(`/learning-plan/task/${taskId}/complete`, completionData);
};

// 获取能力评估
export const getAbilityAssessment = (subject?: string) => {
  const params = subject ? { subject } : {};
  return api.get<AbilityAssessment[]>('/learning-plan/ability-assessment', { params });
};

// 更新能力评估
export const updateAbilityAssessment = (assessmentData: {
  subject: string;
  skill_name: string;
  mastery_level?: number;
  accuracy_rate?: number;
  learning_speed?: number;
  recent_trend?: string;
}) => {
  return api.post<AbilityAssessment>('/learning-plan/ability-assessment', assessmentData);
};

// 删除计划
export const deletePlan = (planId: string) => {
  return api.delete(`/learning-plan/plan/${planId}`);
};

// 暂停/恢复计划
export const togglePlanStatus = (planId: string) => {
  return api.post<LearningPlan>(`/learning-plan/plan/${planId}/toggle`);
};
