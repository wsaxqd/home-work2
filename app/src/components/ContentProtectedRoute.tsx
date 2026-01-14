import { useEffect, useState } from 'react'
import { contentControlManager, type ContentType } from '../services/contentControl'

interface ContentProtectedRouteProps {
  children: React.ReactNode
  contentType: ContentType
}

/**
 * 内容访问控制路由守卫
 * 检查家长是否允许访问特定内容类型
 */
export default function ContentProtectedRoute({
  children,
  contentType
}: ContentProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [canAccess, setCanAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      const allowed = await contentControlManager.canAccess(contentType)
      setCanAccess(allowed)
      setIsChecking(false)
    }
    checkAccess()
  }, [contentType])

  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        检查权限中...
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ color: '#333', marginBottom: '0.5rem' }}>访问受限</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          家长已限制访问此功能
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '0.8rem 2rem',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer'
          }}
        >
          返回
        </button>
      </div>
    )
  }

  return <>{children}</>
}
