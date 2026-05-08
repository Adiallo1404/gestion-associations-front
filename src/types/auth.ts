export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  firstName: string
  lastName: string
  password: string
  globalRole?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
}

export interface AuthResponse {
  token: string
}

export interface UserInfo {
  id: string          
  email: string
  firstName?: string
  lastName?: string
  globalRole?: string
}