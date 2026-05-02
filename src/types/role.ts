
export type Permission =
  | "USER_CREATE" | "USER_READ" | "USER_UPDATE" | "USER_DELETE"
  | "ASSOCIATION_CREATE" | "ASSOCIATION_READ" | "ASSOCIATION_UPDATE" | "ASSOCIATION_DELETE";
export interface RoleDto {
  id?: number;
  name: string;
  description?: string;
  externalReference?: string;
  permissions?: Permission[];
  creationDate?: string;
  modificationDate?: string;
}