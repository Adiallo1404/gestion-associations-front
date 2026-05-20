import api from './axiosConfig';
import type { BureauDto } from '../types/bureau';

const BASE = '/v1/bureaux';

export const getBureauByAssociation = async (associationId: number): Promise<BureauDto[]> => {
  const response = await api.get<BureauDto[]>(`${BASE}/association/${associationId}`);
  return response.data;
};

export const getBureauActifByAssociation = async (associationId: number): Promise<BureauDto[]> => {
  const response = await api.get<BureauDto[]>(`${BASE}/association/${associationId}/actif`);
  return response.data;
};

export const getBureauById = async (id: number): Promise<BureauDto> => {
  const response = await api.get<BureauDto>(`${BASE}/${id}`);
  return response.data;
};

export const getBureauByMembre = async (memberId: number): Promise<BureauDto[]> => {
  const response = await api.get<BureauDto[]>(`${BASE}/membre/${memberId}`);
  return response.data;
};

export const createBureau = async (dto: Partial<BureauDto>): Promise<BureauDto> => {
  const response = await api.post<BureauDto>(BASE, dto);
  return response.data;
};

export const updateBureau = async (id: number, dto: Partial<BureauDto>): Promise<BureauDto> => {
  const response = await api.put<BureauDto>(`${BASE}/${id}`, dto);
  return response.data;
};

export const cloturerBureau = async (id: number): Promise<BureauDto> => {
  const response = await api.patch<BureauDto>(`${BASE}/${id}/cloture`);
  return response.data;
};

export const deleteBureau = async (id: number): Promise<void> => {
  await api.delete(`${BASE}/${id}`);
};