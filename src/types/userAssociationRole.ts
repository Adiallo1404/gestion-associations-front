/**
 * Role assignment of a user within an association.
 */
export interface UserAssociationRoleDto {
  id: number;

  userId: number;

  associationId: number;

  roleId: number;

  /**
   * Populated by the backend from the Role entity.
   */
  roleName?: string | null;

  /**
   * Populated by the backend from the Association entity.
   */
  associationName?: string | null;
}

/**
 * Payload used to assign a role to a user in an association.
 */
export interface AssignUserAssociationRoleRequest {
  userId: number;

  associationId: number;

  roleId: number;
}

/**
 * Payload used to update an existing assignment.
 * Backend only updates the role.
 */
export interface UpdateUserAssociationRoleRequest {
  roleId: number;
}

export interface UserAssociationRoleFilter {
  userId?: number;

  associationId?: number;

  roleId?: number;

  page?: number;

  size?: number;

  sort?: string | string[];
}

export interface UserAssociationRolePageResponse {
  content: UserAssociationRoleDto[];

  totalElements: number;

  totalPages: number;

  size: number;

  number: number;

  first: boolean;

  last: boolean;

  empty: boolean;
}