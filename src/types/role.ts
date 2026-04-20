export type Permission =
  | "CREATE_USER" | "READ_USER" | "UPDATE_USER" | "DELETE_USER"
  | "CREATE_ASSOCIATION" | "READ_ASSOCIATION" | "UPDATE_ASSOCIATION" | "DELETE_ASSOCIATION";

export interface RoleDto {
  id?: number;
  name: string;
  description?: string;
  externalReference?: string;
  permissions?: Permission[];
  creationDate?: string;
  modificationDate?: string;
}