import api from "./axiosConfig";
import type {
  CotisationConfigDto,
  CreateCotisationConfigRequest,
  UpdateCotisationConfigRequest,
} from "../types/cotisationConfig";

const BASE_URL = "/v1/cotisation-configs";

/**
 * Creates a cotisation configuration for an association.
 * Only one configuration is allowed per association.
 */
export async function createCotisationConfig(
  payload: CreateCotisationConfigRequest
): Promise<CotisationConfigDto> {
  const { data } = await api.post<CotisationConfigDto>(BASE_URL, payload);
  return data;
}

/**
 * Retrieves the cotisation configuration attached to an association.
 */
export async function getCotisationConfigByAssociation(
  associationId: number
): Promise<CotisationConfigDto> {
  const { data } = await api.get<CotisationConfigDto>(
    `${BASE_URL}/association/${associationId}`
  );

  return data;
}

/**
 * Updates the cotisation configuration of an association.
 * Backend identifies the configuration through the association id.
 */
export async function updateCotisationConfig(
  associationId: number,
  payload: UpdateCotisationConfigRequest
): Promise<CotisationConfigDto> {
  const { data } = await api.put<CotisationConfigDto>(
    `${BASE_URL}/association/${associationId}`,
    payload
  );

  return data;
}

/**
 * Deletes the cotisation configuration of an association.
 * Backend returns HTTP 204 No Content.
 */
export async function deleteCotisationConfig(
  associationId: number
): Promise<void> {
  await api.delete<void>(`${BASE_URL}/association/${associationId}`);
}

export const cotisationConfigService = {
  createCotisationConfig,
  getCotisationConfigByAssociation,
  updateCotisationConfig,
  deleteCotisationConfig,
};