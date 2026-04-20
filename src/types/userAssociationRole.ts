export interface UserAssociationRole {
  id?: number;
  userId: number;
  associationId: number;
  roleId: number;
  roleName?: string;
  associationName?: string;
}

export interface UserAssociationRolePage {
  content: UserAssociationRole[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  userName?: string;
}