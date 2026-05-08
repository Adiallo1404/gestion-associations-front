import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../api/authService'
import type { UserInfo } from '../types/auth'
import type { GlobalRole } from '../hooks/useRole'

interface AuthContextType {
  isAuthenticated: boolean
  user: UserInfo | null
  role: GlobalRole
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const extractRoleFromToken = (token: string): GlobalRole => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.globalRole || payload.role || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [role, setRole] = useState<GlobalRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const token = authService.getToken()!
      const payload = JSON.parse(atob(token.split('.')[1]))
      const extractedRole = extractRoleFromToken(token)
      setUser({
        id: payload.userId,              // ✅ extrait du JWT
        email: payload.sub,
        globalRole: extractedRole ?? undefined
      })
      setRole(extractedRole)
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    await authService.login({ email, password })
    const token = authService.getToken()!
    const payload = JSON.parse(atob(token.split('.')[1]))
    const extractedRole = extractRoleFromToken(token)
    setUser({
      id: payload.userId,                // ✅ extrait du JWT
      email: payload.sub,
      globalRole: extractedRole ?? undefined
    })
    setRole(extractedRole)
    setIsAuthenticated(true)
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setRole(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}