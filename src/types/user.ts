export interface User {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  globalRole?: string;
  active?: boolean;
  dateCreation?: string;
  lastModified?: string;
  lastLoginAt?: string;
}

export interface UserFilter {
  email?: string;
  firstName?: string;
  lastName?: string;
  active?: boolean;
  globalRole?: string;
  associationId?: number;
  roleName?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}