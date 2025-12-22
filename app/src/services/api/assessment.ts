import { api } from '../../config/api'
import type { Assessment, AssessmentResult } from '../../types'

export const assessmentApi = {
  // 开始评估
  startAssessment: (category: string) =>
    api.post<{ assessmentId: string; questions: any[] }>('/assessment/start', { category }),

  // 提交评估答案
  submitAssessment: (assessmentId: string, answers: Record<string, any>) =>
    api.post<AssessmentResult>(`/assessment/${assessmentId}/submit`, { answers }),

  // 获取评估历史
  getAssessmentHistory: (category?: string) => {
    const query = category ? `?category=${category}` : ''
    return api.get<Assessment[]>(`/assessment/history${query}`)
  },

  // 获取评估详情
  getAssessmentDetail: (assessmentId: string) =>
    api.get<Assessment>(`/assessment/${assessmentId}`),

  // 获取推荐内容
  getRecommendations: (category: string) =>
    api.get<string[]>(`/assessment/recommendations/${category}`),

  // 获取所有评估类别
  getCategories: () =>
    api.get<Array<{ id: string; name: string; description: string }>>('/assessment/categories'),
}
