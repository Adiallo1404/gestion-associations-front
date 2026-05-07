import api from './axiosConfig'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth'

export const authService = {

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    const response = await api.post<AuthResponse>('/api/auth/login', data)
    localStorage.setItem('token', response.data.token)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    const response = await api.post<AuthResponse>('/api/auth/register', data)
    localStorage.setItem('token', response.data.token)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  },

  getToken: (): string | null => {
    return localStorage.getItem('token')
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token')
    if (!token) return false
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 <= Date.now()) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return false
      }
      return true
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return false
    }
  },


  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/api/auth/forgot-password', { email })
  },


  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/api/auth/reset-password', { token, newPassword })
  },
}