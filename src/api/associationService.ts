
import api from './axiosConfig'
import type { Association, AssociationPage } from '../types/association'

export async function getAssociations(page = 0, size = 10): Promise<AssociationPage> {
  const params = { page, size }
  const response = await api.get<AssociationPage>('/associations', { params })
  return response.data
}

export async function getAssociationById(id: number): Promise<Association> {
  const response = await api.get<Association>(`/associations/${id}`)
  return response.data
}

export async function createAssociation(data: Omit<Association, 'id'>): Promise<Association> {
  const response = await api.post<Association>('/associations', data)
  return response.data
}

export async function updateAssociation(id: number, data: Partial<Association>): Promise<Association> {
  const response = await api.put<Association>(`/associations/${id}`, data)
  return response.data
}

export async function deleteAssociation(id: number): Promise<void> {
  await api.delete(`/associations/${id}`)
}