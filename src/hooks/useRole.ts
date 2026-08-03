// src/hooks/useRole.ts
import keycloak from '../api/keycloak' // adapte le chemin selon où se trouve ton fichier keycloak.ts

export type GlobalRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | null

export const useRole = (): {
  role: GlobalRole
  isSuperAdmin: boolean
  isAdmin: boolean
  isAdminOrSuperAdmin: boolean
  isUser: boolean
} => {
  const realmRoles: string[] = keycloak.tokenParsed?.realm_access?.roles ?? []

  const role: GlobalRole = realmRoles.includes('SUPER_ADMIN')
    ? 'SUPER_ADMIN'
    : realmRoles.includes('ADMIN')
    ? 'ADMIN'
    : realmRoles.includes('USER')
    ? 'USER'
    : null

  return {
    role,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isAdmin: role === 'ADMIN',
    isAdminOrSuperAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    isUser: role === 'USER',
  }
}