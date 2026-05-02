import api from "./axiosConfig";
import type { LienPartage, LienPartageFilters } from "../types/lienPartage";

const BASE_URL = "/v1/liens-partage";

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const createLien = async (dto: LienPartage): Promise<LienPartage> => {
  const response = await api.post<LienPartage>(BASE_URL, dto);
  return response.data;
};

export const getLienById = async (id: number): Promise<LienPartage> => {
  const response = await api.get<LienPartage>(`${BASE_URL}/${id}`);
  return response.data;
};

export const getLienByToken = async (token: string): Promise<LienPartage> => {
  const response = await api.get<LienPartage>(`${BASE_URL}/token/${token}`);
  return response.data;
};

export const deleteLien = async (id: number): Promise<LienPartage> => {
  const response = await api.delete<LienPartage>(`${BASE_URL}/${id}`);
  return response.data;
};

export const getLiensByFilters = async (
  filters: LienPartageFilters,
  page = 0,
  size = 10
): Promise<PageResponse<LienPartage>> => {
  const params: Record<string, unknown> = { page, size };
  if (filters.documentId !== undefined) params.documentId = filters.documentId;
  if (filters.creeParId !== undefined) params.creeParId = filters.creeParId;
  if (filters.actif !== undefined) params.actif = filters.actif;

  const response = await api.get<PageResponse<LienPartage>>(BASE_URL, { params });
  return response.data;
};