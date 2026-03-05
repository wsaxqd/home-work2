import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  type?: 'user' | 'parent'
}

export function ProtectedRoute({ children, type = 'user' }: ProtectedRouteProps) {
  const { user, parentUser, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  const isAuthenticated = type === 'parent' ? !!parentUser : !!user
  const redirectTo = type === 'parent' ? '/parent/login' : '/splash'

  return isAuthenticated ? <>{children}</> : <Navigate to={redirectTo} replace />
}
