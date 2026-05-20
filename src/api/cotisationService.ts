import api from './axiosConfig';
import type { MembreCotisationStatus } from '../types/cotisation';

const BASE = '/v1/cotisations';

// ── CRUD existant ─────────────────────────────────────────────────────────────

export const getCotisations = async (filters: any = {}, page = 0, size = 10) => {
  const response = await api.get(BASE, { params: { ...filters, page, size } });
  return response.data;
};

export const getCotisationById = async (id: number) => {
  const res = await api.get(`${BASE}/${id}`);
  return res.data;
};

export const createCotisation = async (data: any) => {
  const res = await api.post(BASE, data);
  return res.data;
};

export const updateCotisation = async (id: number, data: any) => {
  const res = await api.put(`${BASE}/${id}`, data);
  return res.data;
};

export const deleteCotisation = async (id: number) => {
  await api.delete(`${BASE}/${id}`);
};

// ── Suivi individuel (ADMIN / SUPER_ADMIN uniquement) ─────────────────────────

export const getSuiviCotisations = async (
  associationId: number,
  debut: string,
  fin: string
): Promise<MembreCotisationStatus[]> => {
  const res = await api.get(`${BASE}/suivi`, {
    params: { associationId, debut, fin },
  });
  return res.data;
};

export const getMembresNonCotisants = async (
  associationId: number,
  debut: string,
  fin: string
): Promise<MembreCotisationStatus[]> => {
  const res = await api.get(`${BASE}/non-cotisants`, {
    params: { associationId, debut, fin },
  });
  return res.data;
};