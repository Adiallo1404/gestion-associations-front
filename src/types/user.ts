/**
 * Global user role synchronized with UserEntity.GlobalRole.
 */
export type GlobalRole = "SUPER_ADMIN" | "ADMIN" | "USER";

export const GLOBAL_ROLE_OPTIONS: readonly GlobalRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "USER",
] as const;

export const GLOBAL_ROLE_LABELS: Record<GlobalRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  USER: "Utilisateur",
};

/**
 * User returned by the API.
 * Password and internal relation fields are never exposed by the backend.
 */
export interface UserDto {
  id: number;

  email: string;

  firstName: string;

  lastName: string;

  globalRole?: GlobalRole | null;

  active?: boolean | null;

  dateCreation?: string | null;
}

/**
 * Payload used to create a user.
 * Password is only sent on creation and is never returned by the API.
 */
export interface CreateUserDto {
  email: string;

  firstName: string;

  lastName: string;

  globalRole?: GlobalRole | null;

  password: string;

  associationId?: number | null;

  roleId?: number | null;
}

/**
 * Payload used to update an existing user.
 * The backend ignores password and relation fields on this endpoint.
 */
export interface UpdateUserRequest {
  email: string;

  firstName: string;

  lastName: string;

  globalRole?: GlobalRole | null;
}

/**
 * Payload used by the current user to update their own profile.
 * Backend only applies firstName and lastName.
 */
export interface UpdateMyProfileRequest {
  firstName: string;

  lastName: string;

  email?: string;
}

export interface UserFilter {
  email?: string;

  firstName?: string;

  lastName?: string;

  active?: boolean;

  globalRole?: GlobalRole;

  associationId?: number;

  page?: number;

  size?: number;

  sort?: string | string[];
}

export interface UserPageResponse {
  content: UserDto[];

  totalElements: number;

  totalPages: number;

  number: number;

  size: number;

  first: boolean;

  last: boolean;

  empty: boolean;
}