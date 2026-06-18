import api from './axiosConfig';
import type { Bureau, BureauInput } from '../types/bureau';

const BASE = '/v1/bureaux';

/**
 * Create a new bureau entry.
 * Backend: BureauController.createBureau (POST /v1/bureaux)
 *
 * IMPORTANT: `actif` has no default value on BureauDto (Java boolean
 * defaults to `false`), unlike BureauEntity where it defaults to `true`.
 * The caller must explicitly send `actif: true` when creating a new entry,
 * otherwise the created bureau entry will be inactive.
 *
 * Possible errors:
 * - 400: `poste` or `dateDebut` missing/invalid (@NotBlank / @NotNull)
 * - 403: current user does not manage this association
 * - 409: the member already holds an active position in this association
 */
export async function createBureau(dto: BureauInput): Promise<Bureau> {
  const response = await api.post<Bureau>(BASE, dto);
  return response.data;
}

/**
 * Update an existing bureau entry (full replacement).
 * Backend: BureauController.updateBureau (PUT /v1/bureaux/{id})
 * Uses @Valid, so `poste` and `dateDebut` are required.
 */
export async function updateBureau(id: number, dto: BureauInput): Promise<Bureau> {
  const response = await api.put<Bureau>(`${BASE}/${id}`, dto);
  return response.data;
}

export async function getBureauById(id: number): Promise<Bureau> {
  const response = await api.get<Bureau>(`${BASE}/${id}`);
  return response.data;
}

/**
 * Delete a bureau entry.
 * Backend returns 204 No Content, so no response body is expected.
 */
export async function deleteBureau(id: number): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

/**
 * Get all bureau entries (active and past) for a given association.
 * Backend: BureauController.getBureauByAssociation
 */
export async function getBureauByAssociation(associationId: number): Promise<Bureau[]> {
  const response = await api.get<Bureau[]>(`${BASE}/associations/${associationId}`);
  return response.data;
}

/**
 * Get only the currently active bureau entries for a given association.
 * Backend: BureauController.getBureauActifByAssociation
 */
export async function getBureauActifByAssociation(associationId: number): Promise<Bureau[]> {
  const response = await api.get<Bureau[]>(`${BASE}/associations/${associationId}/active`);
  return response.data;
}

/**
 * Get all bureau entries (current and past) held by a given member,
 * across all their associations.
 * Backend: BureauController.getBureauByMembre
 */
export async function getBureauByMembre(memberId: number): Promise<Bureau[]> {
  const response = await api.get<Bureau[]>(`${BASE}/members/${memberId}`);
  return response.data;
}

/**
 * Close a bureau entry: sets `actif` to false and `dateFin` to today
 * on the backend. Returns the updated entry.
 * Backend: BureauController.closeBureau (PATCH /v1/bureaux/{id}/close)
 */
export async function closeBureau(id: number): Promise<Bureau> {
  const response = await api.patch<Bureau>(`${BASE}/${id}/close`);
  return response.data;
}