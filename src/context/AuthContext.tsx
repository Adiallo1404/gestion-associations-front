import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../api/authService'
import type { UserInfo } from '../types/auth'

interface AuthContextType {
  isAuthenticated: boolean
  user: UserInfo | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifie le token au démarrage
    if (authService.isAuthenticated()) {
      const token = authService.getToken()!
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({ email: payload.sub })
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    await authService.login({ email, password })
    const token = authService.getToken()!
    const payload = JSON.parse(atob(token.split('.')[1]))
    setUser({ email: payload.sub })
    setIsAuthenticated(true)
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}