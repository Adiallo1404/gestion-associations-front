import api from "./axiosConfig";
import type {
  CreateLienPartageRequest,
  LienPartageDto,
  LienPartageFilter,
  LienPartagePageResponse,
} from "../types/lienPartage";

const BASE_URL = "/v1/liens-partage";

export async function createLien(
  payload: CreateLienPartageRequest
): Promise<LienPartageDto> {
  const { data } = await api.post<LienPartageDto>(BASE_URL, payload);
  return data;
}

export async function getLienById(id: number): Promise<LienPartageDto> {
  const { data } = await api.get<LienPartageDto>(`${BASE_URL}/${id}`);
  return data;
}

export async function getLienByToken(
  token: string
): Promise<LienPartageDto> {
  const { data } = await api.get<LienPartageDto>(
    `${BASE_URL}/token/${encodeURIComponent(token)}`
  );

  return data;
}

export async function deleteLien(id: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/${id}`);
}

export async function getLiensByFilters(
  filters: LienPartageFilter = {},
  page = 0,
  size = 10,
  sort?: string | string[]
): Promise<LienPartagePageResponse> {
  const { data } = await api.get<LienPartagePageResponse>(BASE_URL, {
    params: {
      ...filters,
      page,
      size,
      sort,
    },
  });

  return data;
}

export const lienPartageService = {
  createLien,
  getLienById,
  getLienByToken,
  deleteLien,
  getLiensByFilters,
};