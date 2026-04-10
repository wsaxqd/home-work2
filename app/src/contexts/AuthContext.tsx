import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface User {
  id: number
  username: string
  nickname?: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  parentUser: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  parentLogin: (user: User) => void
  parentLogout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [parentUser, setParentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userProfile = localStorage.getItem('userProfile')
    const parentProfile = localStorage.getItem('parentProfile')

    if (userProfile) {
      try {
        setUser(JSON.parse(userProfile))
      } catch (e) {
        localStorage.removeItem('userProfile')
      }
    }

    if (parentProfile) {
      try {
        setParentUser(JSON.parse(parentProfile))
      } catch (e) {
        localStorage.removeItem('parentProfile')
      }
    }

    setIsLoading(false)
  }, [])

  const login = (user: User) => {
    setUser(user)
    localStorage.setItem('userProfile', JSON.stringify(user))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('userProfile')
    localStorage.removeItem('token')
  }

  const parentLogin = (user: User) => {
    setParentUser(user)
    localStorage.setItem('parentProfile', JSON.stringify(user))
  }

  const parentLogout = () => {
    setParentUser(null)
    localStorage.removeItem('parentProfile')
    localStorage.removeItem('parentToken')
  }

  return (
    <AuthContext.Provider value={{ user, parentUser, isLoading, login, logout, parentLogin, parentLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
