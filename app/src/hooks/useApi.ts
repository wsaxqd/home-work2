import { useState, useCallback } from 'react'
import { ApiResponse } from '../config/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T = unknown>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
    setState({ data: null, loading: true, error: null })
    try {
      const response = await apiCall()
      if (response.success) {
        setState({ data: response.data || null, loading: false, error: null })
        return response.data
      } else {
        setState({ data: null, loading: false, error: response.error || '请求失败' })
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '网络错误'
      setState({ data: null, loading: false, error: errorMessage })
      return null
    }
  }, [])

  return { ...state, execute }
}
