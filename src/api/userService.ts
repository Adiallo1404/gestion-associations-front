import api from './axiosConfig'
import type { User, CreateUserDto, UserFilter, PageResponse } from '../types/user'

const BASE_URL = '/v1/users'

export async function getUsers(
  filter: UserFilter = {},
  page = 0,
  size = 10
): Promise<PageResponse<User>> {
  const params = { ...filter, page, size }
  const response = await api.get<PageResponse<User>>(BASE_URL, { params })
  return response.data
}

export async function getUserById(id: number): Promise<User> {
  const response = await api.get<User>(`${BASE_URL}/${id}`)
  return response.data
}

export async function getUserByEmail(email: string): Promise<User> {
  const response = await api.get<User>(`${BASE_URL}/email`, {
    params: { email },
  })
  return response.data
}

export async function createUser(user: CreateUserDto): Promise<User> {
  const response = await api.post<User>(BASE_URL, user)
  return response.data
}

export async function updateUser(id: number, user: User): Promise<User> {
  const response = await api.put<User>(`${BASE_URL}/${id}`, user)
  return response.data
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`)
}