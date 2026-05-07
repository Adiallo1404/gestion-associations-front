// src/hooks/useRole.ts

export type GlobalRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | null

export const useRole = (): {
  role: GlobalRole
  isSuperAdmin: boolean
  isAdmin: boolean
  isAdminOrSuperAdmin: boolean
  isUser: boolean
} => {
  const token = localStorage.getItem('token')
  if (!token) return {
    role: null,
    isSuperAdmin: false,
    isAdmin: false,
    isAdminOrSuperAdmin: false,
    isUser: false
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const role: GlobalRole = payload.globalRole || payload.role || null

    return {
      role,
      isSuperAdmin:        role === 'SUPER_ADMIN',
      isAdmin:             role === 'ADMIN',
      isAdminOrSuperAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
      isUser:              role === 'USER',
    }
  } catch {
    return {
      role: null,
      isSuperAdmin: false,
      isAdmin: false,
      isAdminOrSuperAdmin: false,
      isUser: false
    }
  }
}