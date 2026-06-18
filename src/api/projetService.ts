import api from "./axiosConfig";
import type {
  CreateDepenseProjetRequest,
  CreatePartenaireProjetRequest,
  CreateProjetRequest,
  DepenseProjetDto,
  PartenaireProjetDto,
  ProjetDto,
  ProjetFilter,
  ProjetPageResponse,
  UpdateDepenseProjetRequest,
  UpdatePartenaireProjetRequest,
  UpdateProjetRequest,
} from "../types/projet";

const BASE_URL = "/v1/projets";

// ─── Projets ─────────────────────────────────────────────────────────────────

export async function getProjetsByFilters(
  filter: ProjetFilter = {},
  page = 0,
  size = 10,
  sort?: string | string[]
): Promise<ProjetPageResponse> {
  const { data } = await api.get<ProjetPageResponse>(BASE_URL, {
    params: {
      ...filter,
      page,
      size,
      sort,
    },
  });

  return data;
}

export async function getProjetById(id: number): Promise<ProjetDto> {
  const { data } = await api.get<ProjetDto>(`${BASE_URL}/${id}`);
  return data;
}

export async function createProjet(
  payload: CreateProjetRequest
): Promise<ProjetDto> {
  const { data } = await api.post<ProjetDto>(BASE_URL, payload);
  return data;
}

export async function updateProjet(
  id: number,
  payload: UpdateProjetRequest
): Promise<ProjetDto> {
  const { data } = await api.put<ProjetDto>(`${BASE_URL}/${id}`, payload);
  return data;
}

export async function deleteProjet(id: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/${id}`);
}

// ─── Dépenses projet ─────────────────────────────────────────────────────────

export async function getDepensesByProjet(
  projetId: number
): Promise<DepenseProjetDto[]> {
  const { data } = await api.get<DepenseProjetDto[]>(
    `${BASE_URL}/${projetId}/depenses`
  );

  return data;
}

export async function addDepense(
  projetId: number,
  payload: CreateDepenseProjetRequest
): Promise<DepenseProjetDto> {
  const { data } = await api.post<DepenseProjetDto>(
    `${BASE_URL}/${projetId}/depenses`,
    payload
  );

  return data;
}

export async function updateDepense(
  depenseId: number,
  payload: UpdateDepenseProjetRequest
): Promise<DepenseProjetDto> {
  const { data } = await api.put<DepenseProjetDto>(
    `${BASE_URL}/depenses/${depenseId}`,
    payload
  );

  return data;
}

export async function deleteDepense(depenseId: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/depenses/${depenseId}`);
}

// ─── Partenaires projet ──────────────────────────────────────────────────────

export async function getPartenairesByProjet(
  projetId: number
): Promise<PartenaireProjetDto[]> {
  const { data } = await api.get<PartenaireProjetDto[]>(
    `${BASE_URL}/${projetId}/partenaires`
  );

  return data;
}

export async function addPartenaire(
  projetId: number,
  payload: CreatePartenaireProjetRequest
): Promise<PartenaireProjetDto> {
  const { data } = await api.post<PartenaireProjetDto>(
    `${BASE_URL}/${projetId}/partenaires`,
    payload
  );

  return data;
}

export async function updatePartenaire(
  partenaireId: number,
  payload: UpdatePartenaireProjetRequest
): Promise<PartenaireProjetDto> {
  const { data } = await api.put<PartenaireProjetDto>(
    `${BASE_URL}/partenaires/${partenaireId}`,
    payload
  );

  return data;
}

export async function deletePartenaire(partenaireId: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/partenaires/${partenaireId}`);
}

export const projetService = {
  getProjetsByFilters,
  getProjetById,
  createProjet,
  updateProjet,
  deleteProjet,
  getDepensesByProjet,
  addDepense,
  updateDepense,
  deleteDepense,
  getPartenairesByProjet,
  addPartenaire,
  updatePartenaire,
  deletePartenaire,
};