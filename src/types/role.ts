export type Permission =
  | "USER_CREATE"
  | "USER_READ"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "ASSOCIATION_CREATE"
  | "ASSOCIATION_READ"
  | "ASSOCIATION_UPDATE"
  | "ASSOCIATION_DELETE";

export const PERMISSION_OPTIONS: Permission[] = [
  "USER_CREATE",
  "USER_READ",
  "USER_UPDATE",
  "USER_DELETE",
  "ASSOCIATION_CREATE",
  "ASSOCIATION_READ",
  "ASSOCIATION_UPDATE",
  "ASSOCIATION_DELETE",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  USER_CREATE: "Créer un utilisateur",
  USER_READ: "Lire un utilisateur",
  USER_UPDATE: "Modifier un utilisateur",
  USER_DELETE: "Supprimer un utilisateur",

  ASSOCIATION_CREATE: "Créer une association",
  ASSOCIATION_READ: "Lire une association",
  ASSOCIATION_UPDATE: "Modifier une association",
  ASSOCIATION_DELETE: "Supprimer une association",
};

export interface RoleDto {
  id?: number;
  name: string;
  description?: string;
  externalReference?: string;
  permissions?: Permission[];
  creationDate?: string;
  modificationDate?: string;
}

export interface RolePageResponse {
  content: RoleDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty?: boolean;
}