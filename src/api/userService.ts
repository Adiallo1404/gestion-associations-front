import api from './axiosConfig'
import type { User, UserFilter, PageResponse } from '../types/user'

export async function getUsers(
  filter: UserFilter = {},
  page = 0,
  size = 10
): Promise<PageResponse<User>> {
  const params = { ...filter, page, size }
  const response = await api.get<PageResponse<User>>('/users', { params })
  return response.data
}

export async function getUserById(id: number): Promise<User> {
  const response = await api.get<User>(`/users/${id}`)
  return response.data
}

export async function getUserByEmail(email: string): Promise<User> {
  const response = await api.get<User>(`/users/email`, { params: { email } })
  return response.data
}

export async function createUser(user: User): Promise<User> {
  const response = await api.post<User>('/users', user)
  return response.data
}

export async function updateUser(id: number, user: User): Promise<User> {
  const response = await api.put<User>(`/users/${id}`, user)
  return response.data
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}