import api from "./axiosConfig";
import type {
  CreateRoleRequest,
  Permission,
  RoleDto,
  RoleFilter,
  RolePageResponse,
  UpdateRoleRequest,
} from "../types/role";

const BASE_URL = "/v1/roles";

export async function getRoles(
  params: RoleFilter = {}
): Promise<RolePageResponse> {
  const { data } = await api.get<RolePageResponse>(BASE_URL, { params });
  return data;
}

export async function getRoleById(id: number): Promise<RoleDto> {
  const { data } = await api.get<RoleDto>(`${BASE_URL}/${id}`);
  return data;
}

export async function getRoleByName(name: string): Promise<RoleDto> {
  const { data } = await api.get<RoleDto>(
    `${BASE_URL}/name/${encodeURIComponent(name)}`
  );

  return data;
}

/**
 * Creates a new role with its initial permissions.
 */
export async function createRole(
  payload: CreateRoleRequest
): Promise<RoleDto> {
  const { data } = await api.post<RoleDto>(BASE_URL, payload);
  return data;
}

/**
 * Updates role metadata and replaces its permission set.
 */
export async function updateRole(
  id: number,
  payload: UpdateRoleRequest
): Promise<RoleDto> {
  const { data } = await api.put<RoleDto>(`${BASE_URL}/${id}`, payload);
  return data;
}

/**
 * Deletes a role.
 * Backend returns HTTP 204 No Content.
 */
export async function deleteRole(id: number): Promise<void> {
  await api.delete<void>(`${BASE_URL}/${id}`);
}

/**
 * Adds a permission to a role.
 * The backend expects the role id in the path.
 */
export async function addPermission(
  roleId: number,
  permission: Permission
): Promise<RoleDto> {
  const { data } = await api.patch<RoleDto>(
    `${BASE_URL}/${roleId}/permissions/add`,
    null,
    {
      params: { permission },
    }
  );

  return data;
}

/**
 * Removes a permission from a role.
 * The backend expects the role id in the path.
 */
export async function removePermission(
  roleId: number,
  permission: Permission
): Promise<RoleDto> {
  const { data } = await api.patch<RoleDto>(
    `${BASE_URL}/${roleId}/permissions/remove`,
    null,
    {
      params: { permission },
    }
  );

  return data;
}

export async function getPermissions(roleId: number): Promise<Permission[]> {
  const { data } = await api.get<Permission[]>(
    `${BASE_URL}/${roleId}/permissions`
  );

  return data;
}

export const roleService = {
  getRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  addPermission,
  removePermission,
  getPermissions,
};