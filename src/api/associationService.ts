import api from "./axiosConfig";
import type {
  Association,
  AssociationFilter,
  AssociationInput,
  AssociationPage,
} from "../types/association";

const BASE_URL = "/v1/associations";

/**
 * Fetch a paginated list of associations with optional filters.
 *
 * Backend endpoint:
 * GET /v1/associations
 */
export async function getAssociations(
  filters: AssociationFilter = {},
  page = 0,
  size = 10,
  sort?: string | string[]
): Promise<AssociationPage> {
  const response = await api.get<AssociationPage>(BASE_URL, {
    params: {
      ...filters,
      page,
      size,
      sort,
    },
  });

  return response.data;
}

/**
 * Fetch a single association by ID.
 *
 * Backend endpoint:
 * GET /v1/associations/{id}
 */
export async function getAssociationById(id: number): Promise<Association> {
  const response = await api.get<Association>(`${BASE_URL}/${id}`);
  return response.data;
}

/**
 * Create a new association.
 *
 * Server-managed fields such as id and dateCreation must not be sent.
 *
 * Backend endpoint:
 * POST /v1/associations
 */
export async function createAssociation(
  payload: AssociationInput
): Promise<Association> {
  const response = await api.post<Association>(BASE_URL, payload);
  return response.data;
}

/**
 * Update an existing association.
 *
 * Backend uses PUT, so required fields must be provided.
 *
 * Backend endpoint:
 * PUT /v1/associations/{id}
 */
export async function updateAssociation(
  id: number,
  payload: AssociationInput
): Promise<Association> {
  const response = await api.put<Association>(`${BASE_URL}/${id}`, payload);
  return response.data;
}

/**
 * Delete an association.
 *
 * Backend endpoint:
 * DELETE /v1/associations/{id}
 */
export async function deleteAssociation(id: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/${id}`);
}

export const associationService = {
  getAssociations,
  getAssociationById,
  createAssociation,
  updateAssociation,
  deleteAssociation,
};