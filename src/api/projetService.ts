import api from './axiosConfig'
import type { ProjetDto, DepenseProjetDto, PartenaireProjetDto, ProjetPage, ProjetFilter } from '../types/projet'

// ✅ BASE URL correspondant à ton Controller Spring Boot
const BASE = '/v1/projets'

// ── Projets ──────────────────────────────────────────────────────────────

/**
 * Liste les projets avec filtres et pagination (Spring Data Page)
 */
export async function getProjetsByFilters(
  filter: ProjetFilter,
  page = 0,
  size = 10
): Promise<ProjetPage> {
  // On regroupe les filtres et les paramètres de pagination
  const params = {
    ...filter,
    page,
    size
  }
  const response = await api.get<ProjetPage>(BASE, { params })
  return response.data
}

/**
 * Récupère un projet par son ID (inclut les dépenses et partenaires associés)
 */
export async function getProjetById(id: number): Promise<ProjetDto> {
  const response = await api.get<ProjetDto>(`${BASE}/${id}`)
  return response.data
}

/**
 * Crée un nouveau projet
 */
export async function createProjet(data: ProjetDto): Promise<ProjetDto> {
  const response = await api.post<ProjetDto>(BASE, data)
  return response.data
}

/**
 * Met à jour un projet existant
 */
export async function updateProjet(id: number, data: ProjetDto): Promise<ProjetDto> {
  const response = await api.put<ProjetDto>(`${BASE}/${id}`, data)
  return response.data
}

/**
 * Supprime un projet
 */
export async function deleteProjet(id: number): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}

// ── Dépenses ─────────────────────────────────────────────────────────────

/**
 * Liste toutes les dépenses rattachées à un projet spécifique
 */
export async function getDepensesByProjet(projetId: number): Promise<DepenseProjetDto[]> {
  const response = await api.get<DepenseProjetDto[]>(`${BASE}/${projetId}/depenses`)
  return response.data
}

/**
 * Ajoute une dépense à un projet
 */
export async function addDepense(projetId: number, data: DepenseProjetDto): Promise<DepenseProjetDto> {
  const response = await api.post<DepenseProjetDto>(`${BASE}/${projetId}/depenses`, data)
  return response.data
}

/**
 * Modifie une dépense existante
 */
export async function updateDepense(depenseId: number, data: DepenseProjetDto): Promise<DepenseProjetDto> {
  const response = await api.put<DepenseProjetDto>(`${BASE}/depenses/${depenseId}`, data)
  return response.data
}

/**
 * Supprime une dépense
 */
export async function deleteDepense(depenseId: number): Promise<void> {
  await api.delete(`${BASE}/depenses/${depenseId}`)
}

// ── Partenaires ──────────────────────────────────────────────────────────

/**
 * Liste tous les partenaires rattachés à un projet
 */
export async function getPartenairesByProjet(projetId: number): Promise<PartenaireProjetDto[]> {
  const response = await api.get<PartenaireProjetDto[]>(`${BASE}/${projetId}/partenaires`)
  return response.data
}

/**
 * Ajoute un partenaire à un projet
 */
export async function addPartenaire(projetId: number, data: PartenaireProjetDto): Promise<PartenaireProjetDto> {
  const response = await api.post<PartenaireProjetDto>(`${BASE}/${projetId}/partenaires`, data)
  return response.data
}

/**
 * Modifie les informations d'un partenaire lié
 */
export async function updatePartenaire(partenaireId: number, data: PartenaireProjetDto): Promise<PartenaireProjetDto> {
  const response = await api.put<PartenaireProjetDto>(`${BASE}/partenaires/${partenaireId}`, data)
  return response.data
}

/**
 * Supprime un partenaire d'un projet
 */
export async function deletePartenaire(partenaireId: number): Promise<void> {
  await api.delete(`${BASE}/partenaires/${partenaireId}`)
}