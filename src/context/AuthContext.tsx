import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import keycloak from '../api/keycloak'
import type { UserInfo } from '../types/auth'
import type { GlobalRole } from '../hooks/useRole'

interface AuthContextType {
  isAuthenticated: boolean
  user: UserInfo | null
  role: GlobalRole
  login: () => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const extractRoleFromToken = (): GlobalRole => {
  const roles: string[] = (keycloak.tokenParsed as any)?.realm_access?.roles ?? []

  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN'
  if (roles.includes('ADMIN')) return 'ADMIN'
  if (roles.includes('USER')) return 'USER'
  return null
}

const buildUserFromToken = (): UserInfo | null => {
  if (!keycloak.tokenParsed) return null

  const tp = keycloak.tokenParsed as any

  return {
    id: tp.sub,
    email: tp.email ?? tp.preferred_username ?? '',
    firstName: tp.given_name ?? '',
    lastName: tp.family_name ?? '',
    globalRole: extractRoleFromToken() ?? undefined,
  } as UserInfo
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!keycloak.authenticated)
  const [user, setUser] = useState<UserInfo | null>(keycloak.authenticated ? buildUserFromToken() : null)
  const [role, setRole] = useState<GlobalRole>(keycloak.authenticated ? extractRoleFromToken() : null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    keycloak.onAuthRefreshSuccess = () => {
      setUser(buildUserFromToken())
      setRole(extractRoleFromToken())
      setIsAuthenticated(true)
    }
  }, [])

  const login = async () => {
    await keycloak.login()
  }

  const logout = () => {
    keycloak.logout({ redirectUri: window.location.origin })
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