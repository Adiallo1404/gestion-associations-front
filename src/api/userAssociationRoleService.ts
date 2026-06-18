import api from "./axiosConfig";
import type {
  AssignUserAssociationRoleRequest,
  UpdateUserAssociationRoleRequest,
  UserAssociationRoleDto,
  UserAssociationRoleFilter,
  UserAssociationRolePageResponse,
} from "../types/userAssociationRole";

const BASE_URL = "/v1/user-association-roles";

/**
 * Assigns a role to a user within an association.
 */
export async function assignRole(
  payload: AssignUserAssociationRoleRequest
): Promise<UserAssociationRoleDto> {
  const { data } = await api.post<UserAssociationRoleDto>(BASE_URL, payload);
  return data;
}

/**
 * Updates only the role of an existing assignment.
 * User and association are immutable after assignment creation.
 */
export async function updateRole(
  id: number,
  payload: UpdateUserAssociationRoleRequest
): Promise<UserAssociationRoleDto> {
  const { data } = await api.put<UserAssociationRoleDto>(
    `${BASE_URL}/${id}`,
    payload
  );

  return data;
}

/**
 * Gets the assignment for a specific user and association.
 * Backend requires both userId and associationId.
 */
export async function getRoleByUserAndAssociation(
  userId: number,
  associationId: number
): Promise<UserAssociationRoleDto> {
  const { data } = await api.get<UserAssociationRoleDto>(BASE_URL, {
    params: {
      userId,
      associationId,
    },
  });

  return data;
}

/**
 * Lists role assignments using optional filters.
 * The backend exposes pagination on /search.
 */
export async function getUserAssociationRoles(
  filter: UserAssociationRoleFilter = {},
  page = 0,
  size = 10,
  sort?: string | string[]
): Promise<UserAssociationRolePageResponse> {
  const { data } = await api.get<UserAssociationRolePageResponse>(
    `${BASE_URL}/search`,
    {
      params: {
        ...filter,
        page,
        size,
        sort,
      },
    }
  );

  return data;
}

/**
 * Removes a user role assignment from an association.
 * Backend returns HTTP 204 No Content.
 */
export async function deleteUserAssociationRole(id: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/${id}`);
}

export const userAssociationRoleService = {
  assignRole,
  updateRole,
  getRoleByUserAndAssociation,
  getUserAssociationRoles,
  deleteUserAssociationRole,
};