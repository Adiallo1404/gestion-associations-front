import api from './axiosConfig'
import type {
  CotisationDto,
  CotisationFilter,
  MembreCotisationStatus,
} from '../types/cotisation'
import type { PageResponse } from '../types/association'

const BASE = '/v1/cotisations'

export const getCotisations = async (
  filters: CotisationFilter = {},
  page = 0,
  size = 10
): Promise<PageResponse<CotisationDto>> => {
  const response = await api.get<PageResponse<CotisationDto>>(BASE, {
    params: { ...filters, page, size },
  })
  return response.data
}

export const getCotisationById = async (id: number): Promise<CotisationDto> => {
  const response = await api.get<CotisationDto>(`${BASE}/${id}`)
  return response.data
}

// datePaiement and dateCreation are server-managed (READ_ONLY) — excluded from the input type
export const createCotisation = async (
  data: Omit<CotisationDto, 'id' | 'dateCreation' | 'datePaiement'>
): Promise<CotisationDto> => {
  const response = await api.post<CotisationDto>(BASE, data)
  return response.data
}

export const updateCotisation = async (
  id: number,
  data: Partial<Omit<CotisationDto, 'id' | 'dateCreation' | 'datePaiement'>>
): Promise<CotisationDto> => {
  const response = await api.put<CotisationDto>(`${BASE}/${id}`, data)
  return response.data
}

export const deleteCotisation = async (id: number): Promise<void> => {
  await api.delete(`${BASE}/${id}`)
}

export const getSuiviCotisations = async (
  associationId: number,
  debut: string,
  fin: string
): Promise<MembreCotisationStatus[]> => {
  const response = await api.get<MembreCotisationStatus[]>(`${BASE}/suivi`, {
    params: { associationId, debut, fin },
  })
  return response.data
}

export const getMembresNonCotisants = async (
  associationId: number,
  debut: string,
  fin: string
): Promise<MembreCotisationStatus[]> => {
  const response = await api.get<MembreCotisationStatus[]>(`${BASE}/non-cotisants`, {
    params: { associationId, debut, fin },
  })
  return response.data
}