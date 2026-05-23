export interface User {

  id?: number; //
  email: string;
  firstName: string;
  lastName: string;
  globalRole?: string;
  associationId?: number;
  active?: boolean;
  dateCreation?: string;
  lastModified?: string;
  lastLoginAt?: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  globalRole?: string;
  password: string;
  associationId?: number;
  roleId?: number; 
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